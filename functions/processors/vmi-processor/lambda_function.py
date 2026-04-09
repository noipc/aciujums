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
    match = re.search(r"\b\d{4}\b", sheet_name)
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
            return None
        return Decimal(str(value))
    return value

def prepare_data(s3_client, filename):
    bucket_name = "nipc-dl-raw"

    try:
        vmi_file = s3_client.get_object(Bucket=bucket_name, Key=filename)['Body'].read()
        excel_file = pd.ExcelFile(BytesIO(vmi_file), engine='openpyxl')

        sheets_with_years = [(sheet, extract_year(sheet)) for sheet in excel_file.sheet_names if sheet.startswith("Apskaičiuota")]

        columns = "A,B,C,F,I"
        headers = ["municipality", "legal_id", "entity_name", "total_funders", "total_funds"]

        df_list = []
        for sheet_name, year in sheets_with_years:
            temp_df = pd.read_excel(excel_file, sheet_name=sheet_name, header=None, skiprows=7, usecols=columns, names=headers)
            temp_df["year"] = year
            df_list.append(temp_df)

        final_df = pd.concat(df_list, ignore_index=True)

        pagal_teisines_formas = pd.read_excel(excel_file, sheet_name="Pagal_teisines_formas", header=None)
        value_from_A3 = pagal_teisines_formas.iloc[2, 0]
        record_dt = value_from_A3.split(":")[1].strip()

        final_df["record_dt"] = record_dt
        final_df["municipality"] = final_df["municipality"].apply(clean_municipality_name)

        logger.info(f"VMI duomenys yra paruošti pagal {filename} failą")

        return final_df

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

def load_excluded_legal_ids(s3_client):
    """Return a set of legal IDs belonging to Politinė partija — to exclude from all outputs."""
    year = datetime.now().year
    month = datetime.now().strftime("%m")
    jar_key = f"registru_centras/jar/year={year}/month={month}/JAR_IREGISTRUOTI.csv"
    try:
        file_jar = s3_client.get_object(Bucket="nipc-dl-raw", Key=jar_key)["Body"].read().decode("utf-8")
        jar_df = pd.read_csv(StringIO(file_jar), sep="|", usecols=["ja_kodas", "form_pavadinimas"])
        excluded = jar_df[jar_df["form_pavadinimas"].str.contains("Politin", case=False, na=False)]["ja_kodas"]
        logger.info(f"Loaded {len(excluded)} Politinė partija IDs to exclude")
        return set(excluded.tolist())
    except ClientError as e:
        logger.warning(f"Could not load RC JAR for party exclusions, skipping filter: {e}")
        return set()

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
                    'total_funders': int(row['total_funders']),
                    'total_funds': row['total_funds'],
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
                    'total_funders': int(row['total_funders']),
                    'total_funds': row['total_funds'],
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
    dynamodb_resource = boto3.resource('dynamodb')

    table_name = 'aciujums_finances'
    summary_table_name = 'aciujums_summary'
    index_table_name = 'aciujums_search'

    try:
        df = prepare_data(s3_client, filename)

        excluded_ids = load_excluded_legal_ids(s3_client)
        if excluded_ids:
            before = len(df)
            df = df[~df["legal_id"].isin(excluded_ids)]
            logger.info(f"Excluded {before - len(df)} rows belonging to Politinė partija")

        index_df = create_index(df)
        summary_df = create_summary(df)
        insert_data(dynamodb_resource, table_name, df)
        insert_summary_data(dynamodb_resource, summary_table_name, summary_df)
        insert_index_data(dynamodb_resource, index_table_name, index_df)
    except ClientError as e:
        print(e)
        raise e
