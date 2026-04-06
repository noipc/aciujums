import pandas as pd
import boto3
import math
import re
import logging
from io import BytesIO
from io import StringIO
from datetime import datetime
from decimal import Decimal
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def extract_year(sheet_name):
    match = re.search(r"\b\d{4}\b", sheet_name)  # Finds a 4-digit year
    return int(match.group()) if match else None

def clean_municipality_name(name):
    replacements = {
        "r.": "rajono",
        "m.": "miesto",
        "sav.": "savivaldybe"
    }
    ltu_mapping = str.maketrans("ąčęėįšųūž", "aceeisuuz")

    cleaned = name.lower()

    for old, new in replacements.items():
        cleaned = cleaned.replace(old, new)

    cleaned = cleaned.translate(ltu_mapping)

    cleaned = cleaned.replace(" ", "-")

    cleaned = cleaned.strip("-")
    return cleaned

def convert_value(value):
    if isinstance(value, float):
        if math.isnan(value) or math.isinf(value):
            # Return None or a default value, e.g., Decimal('0')
            return None
        return Decimal(str(value))
    return value

def prepare_data(s3_client, filename):

    bucket_name = "nipc-dl-raw"
    vmi = filename

    try:
        vmi_file = s3_client.get_object(Bucket=bucket_name, Key=vmi)['Body'].read()
        excel_file = pd.ExcelFile(BytesIO(vmi_file), engine='openpyxl')

        # Filter sheet names that start with "Apskaičiuota" and contain a year
        sheets_with_years = [(sheet, extract_year(sheet)) for sheet in excel_file.sheet_names if sheet.startswith("Apskaičiuota")]

        columns = "A,B,C,F,I"
        headers = ["municipality", "legal_id", "entity_name", "total_funders", "total_funds"]

        # Read and combine all data into a single DataFrame
        df_list = []

        for sheet_name, year in sheets_with_years:
            temp_df = pd.read_excel(excel_file, sheet_name=sheet_name, header=None, skiprows=7, usecols=columns, names=headers)  # Start reading from 8th row
            temp_df["year"] = year  # Add the extracted year as a new column
            df_list.append(temp_df)

        # Concatenate all DataFrames into one
        final_df = pd.concat(df_list, ignore_index=True)

        # Get the value from "Pagal_teisines_formas" sheet, cell A3
        pagal_teisines_formas = pd.read_excel(excel_file, sheet_name="Pagal_teisines_formas", header=None)
        value_from_A3 = pagal_teisines_formas.iloc[2, 0]  # A3 is [2,0] in 0-based indexing
        record_dt = value_from_A3.split(":")[1].strip()

        final_df["record_dt"] = record_dt

        final_df["municipality"] = final_df["municipality"].apply(clean_municipality_name)

        logging.info(f"VMI duomenys yra paruošti pagal {filename} failą")  

        return final_df

    except ClientError as e:
        print(e)
        raise e

def prep_csv_data(s3_client):

    csv = f"vmi/paramos_apskaiciavimo_statistika/year=2024/sav.csv"

    try:
        csv_file = s3_client.get_object(Bucket="nipc-dl-raw", Key=csv)['Body'].read().decode('utf-8')

        df = pd.read_csv(StringIO(csv_file), sep=",")
        df = df.rename(columns={"savivaldybe":"municipality"})

        df["record_dt"] = "2023-11-16"

        return df
    except ClientError as e:
        print(e)
        raise e

def create_summary(df):
    summary_df = df.groupby(['municipality', 'year']).agg({
        'total_funders': 'sum',
        'total_funds': 'sum',
        'legal_id': 'count'
    }).reset_index()

    summary_df = summary_df.rename(columns={'legal_id': 'total_recipients'})

    summary_df["record_dt"] = df["record_dt"]

    return summary_df

def create_index(df):
    entity_df = df[['legal_id', 'entity_name']].drop_duplicates()
    return entity_df.sort_values('legal_id').reset_index(drop=True)

def insert_data(dynamodb_resource, table_name, df):
    try:
        table = dynamodb_resource.Table(table_name)
        with table.batch_writer() as batch:
            for index, row in df.iterrows():
                item = {
                    'legal_id': row['legal_id'],
                    'municipality_year': f"{row['municipality']}#{int(row['year'])}",
                    'entity_name': row['entity_name'],
                    'municipality': row['municipality'],
                    'year': int(row['year']),
                    'total_funders':  int(row['total_funders']),
                    'total_funds':  row['total_funds'],
                    'record_dt': row['record_dt']
                }
                for key, value in item.items():
                    item[key] = convert_value(value)

                batch.put_item(Item=item)

    except ClientError as e:
        print(e)
        raise e

def insert_summary_data(dynamodb_resource, table_name, df):
    try:
        table = dynamodb_resource.Table(table_name)
        with table.batch_writer() as batch:
            for index, row in df.iterrows():
                item = {
                    'municipality': row['municipality'],
                    'year': int(row['year']),
                    'total_funders':  int(row['total_funders']),
                    'total_funds':  row['total_funds'],
                    'total_recipients': int(row['total_recipients']),
                    'record_dt': row['record_dt']
                }
                for key, value in item.items():
                    item[key] = convert_value(value)

                batch.put_item(Item=item)

    except ClientError as e:
        print(e)
        raise e


def insert_index_data(dynamodb_resource, table_name, df):
    try:
        table = dynamodb_resource.Table(table_name)
        with table.batch_writer() as batch:
            for index, row in df.iterrows():
                item = {
                    'legal_id': row['legal_id'],
                    'entity_name': row['entity_name']
                }
                for key, value in item.items():
                    item[key] = convert_value(value)

                batch.put_item(Item=item)

    except ClientError as e:
        print(e)
        raise e

def lambda_handler(event, context):

    detail = event['detail']
    filename = detail['filename']
    s3_client = boto3.client('s3')
    dynamodb_client = boto3.client('dynamodb')
    dynamodb_resource = boto3.resource('dynamodb')

    table_name = 'aciujums_finances'
    summary_table_name = 'aciujums_summary'
    index_table_name = 'aciujums_search'

    try:
        df = prepare_data(s3_client, filename)
        # df = prep_csv_data(s3_client)
        index_df = create_index(df)
        summary_df = create_summary(df)
        # insert_data(dynamodb_resource, table_name, df)
        # insert_summary_data(dynamodb_resource, summary_table_name, summary_df)
        # insert_index_data(dynamodb_resource, index_table_name, index_df)

    
    except ClientError as e:
        print(e)
        raise e
    


