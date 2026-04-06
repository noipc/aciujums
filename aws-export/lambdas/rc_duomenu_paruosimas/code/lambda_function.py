import pandas as pd
import boto3
import math
from io import StringIO
from datetime import datetime
from decimal import Decimal
from botocore.exceptions import ClientError

def convert_value(value):
    if isinstance(value, float):
        if math.isnan(value) or math.isinf(value):
            # Return None or a default value, e.g., Decimal('0')
            return None
        return Decimal(str(value))
    return value

def clean_item(item):
    """
    Remove any keys with None values from the item.
    Alternatively, you can assign a default value instead.
    """
    return {k: v for k, v in item.items() if v is not None}

def prepare_data(s3_client):

    year = datetime.now().year
    month = datetime.now().strftime("%m")
    day = datetime.now().strftime("%d")
    previous_year = year - 1
    bucket_name = "nipc-dl-raw"

    jar              = f"registru_centras/jar/year={year}/month={month}/JAR_IREGISTRUOTI.csv"
    ex_jar           = f"registru_centras/ex_jar/year={year}/month={month}/JAR_ISREGISTRUOTI.csv"
    nvo              = f"registru_centras/nvo/year={year}/month={month}/JAR_NVO_NUO.csv"
    par_gav          = f"registru_centras/paramos_gavejai/year={year}/month={month}/JAR_PARAMOS_GAV_NUO.csv"
    jar_nepateike_fa = f"registru_centras/jar_nepateike_finansiniu_ataskaitu/year={year}/month={month}/JAR_NEPATEIKE_FA_UZ_PRAEJUSIUS.csv"

    try: 
        file_jar        = s3_client.get_object(Bucket=bucket_name, Key=jar)["Body"].read().decode('utf-8')
        file_ex_jar     = s3_client.get_object(Bucket=bucket_name, Key=ex_jar)["Body"].read().decode('utf-8')
        file_nvo        = s3_client.get_object(Bucket=bucket_name, Key=nvo)["Body"].read().decode('utf-8')
        file_par_gav    = s3_client.get_object(Bucket=bucket_name, Key=par_gav)["Body"].read().decode('utf-8')
        file_no_fa      = s3_client.get_object(Bucket=bucket_name, Key=jar_nepateike_fa)["Body"].read().decode('utf-8')

        jar_df        = pd.read_csv(StringIO(file_jar), sep='|', usecols=["ja_kodas", "ja_pavadinimas", "ja_reg_data", "form_pavadinimas", "stat_pavadinimas", "stat_data_nuo"])
        ex_jar_df     = pd.read_csv(StringIO(file_ex_jar), sep='|', usecols=["ja_kodas", "ja_pavadinimas", "ja_reg_data", "form_pavadinimas", "isreg_data"])
        nvo_df        = pd.read_csv(StringIO(file_nvo), sep='|', usecols=["ja_kodas", "nvo_nuo"])
        par_gav_df    = pd.read_csv(StringIO(file_par_gav), sep='|', usecols=["ja_kodas", "paramos_gav_nuo"])
        no_fa_df      = pd.read_csv(StringIO(file_no_fa), sep='|', usecols=["ja_kodas", "fa_nepateikta_uz_metus"])

        ex_jar_df["stat_pavadinimas"] = "Išregistruotas"
        ex_jar_df = ex_jar_df.rename(columns={"isreg_data": "stat_data_nuo"})

        nvo_df["nvo_nuo"] = pd.to_datetime(nvo_df["nvo_nuo"])
        nvo_idx = nvo_df.groupby("ja_kodas")["nvo_nuo"].idxmax()
        nvo_df = nvo_df.loc[nvo_idx].reset_index(drop=True)

        par_gav_df["paramos_gav_nuo"] = pd.to_datetime(par_gav_df["paramos_gav_nuo"])
        par_gav_idx = par_gav_df.groupby("ja_kodas")["paramos_gav_nuo"].idxmax()
        par_gav_df = par_gav_df.loc[par_gav_idx].reset_index(drop=True)

        jar_df["stat_pavadinimas"] = jar_df["stat_pavadinimas"].replace("Teisinis stat neįregistruotas", "Aktyvus")
        nvo_df["nvo_statusas"] = 1
        par_gav_df["par_gav_statusas"] = 1
        no_fa_df = no_fa_df[no_fa_df["fa_nepateikta_uz_metus"] == previous_year]
        no_fa_df["atskaitingas"] = 0

        jar_concat = pd.concat([jar_df, ex_jar_df], ignore_index=True)
        
        df_merged = jar_concat.merge(nvo_df, on="ja_kodas", how="left")
        df_merged = df_merged.merge(par_gav_df, on="ja_kodas", how="left")
        df_merged = df_merged.merge(no_fa_df, on="ja_kodas", how="left")
        df_merged["atskaitingas"] = df_merged["atskaitingas"].fillna(1).astype(int)

        df_merged["nvo_statusas"] = df_merged["nvo_statusas"].fillna(0).astype(int)
        df_merged["par_gav_statusas"] = df_merged["par_gav_statusas"].fillna(0).astype(int)
        df_merged["fa_nepateikta_uz_metus"] = df_merged["fa_nepateikta_uz_metus"].fillna(0).astype(int)

        df_merged = df_merged.fillna({"nvo_nuo": "", "paramos_gav_nuo": ""})

        datetime_columns = ["nvo_nuo", "paramos_gav_nuo"]

        for col in datetime_columns:
            df_merged[col] = df_merged[col].apply(lambda x: x.strftime("%Y-%m-%d") if pd.notnull(x) else None)

        df_merged["formavimo_data"] = f"{year}-{month}-{day}"

        return df_merged
    
    except Exception as e:
        print(e)
        raise e

def delete_table_if_exists(dynamodb_client, table_name):

    try:
        dynamodb_client.describe_table(TableName=table_name)
        print(f"Table '{table_name}' exists. Deleting...")

        dynamodb_client.delete_table(TableName=table_name)
        waiter = dynamodb_client.get_waiter('table_not_exists')
        waiter.wait(TableName=table_name)
        print(f"Table '{table_name}' deleted.")

    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            print(f"Table '{table_name}' does not exist.")
        else:
            raise e

def create_table(dynamodb_client, table_name):
    try:
        table = dynamodb_client.create_table(
            TableName=table_name,
            KeySchema=[
                {
                    'AttributeName': 'ja_kodas',
                    'KeyType': 'HASH'  # Partition key
                }
            ],
            AttributeDefinitions=[
                {
                    'AttributeName': 'ja_kodas',
                    'AttributeType': 'N'
                }
            ],
            BillingMode='PAY_PER_REQUEST'
        )

        waiter = dynamodb_client.get_waiter('table_exists')
        waiter.wait(TableName=table_name)
        print(f"Table '{table_name}' created.")
    
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            print(f"Table '{table_name}' already exists.")
        else:
            raise e

def insert_data(dynamo_resource, table_name, df):
    try:
        table = dynamo_resource.Table(table_name)

        with table.batch_writer() as batch:
            for index, row in df.iterrows():
                item = {
                    'ja_kodas': int(row['ja_kodas']),
                    'ja_pavadinimas': row['ja_pavadinimas'],
                    'ja_reg_data': row['ja_reg_data'],
                    'form_pavadinimas': row['form_pavadinimas'],
                    'stat_pavadinimas': row['stat_pavadinimas'],
                    'stat_data_nuo': row['stat_data_nuo'],
                    'nvo_nuo': row['nvo_nuo'] if pd.notna(row['nvo_nuo']) else None,
                    'nvo_statusas': int(row['nvo_statusas']),
                    'paramos_gav_nuo': row['paramos_gav_nuo'] if pd.notna(row['paramos_gav_nuo']) else None,
                    'par_gav_statusas': int(row['par_gav_statusas']),
                    'fa_nepateikta_uz_metus': int(row['fa_nepateikta_uz_metus']),
                    'atskaitingas': int(row['atskaitingas']),
                    'formavimo_data': row['formavimo_data']
                }
                for key, value in item.items():
                    item[key] = convert_value(value)

                # Remove keys with None values (if you don't want to store them)
                item = clean_item(item)
                batch.put_item(Item=item)
    except Exception as e:
        print(e)
        raise e


def lambda_handler(event, context):

    detail = evnet["detail"]
    batch_id = detail["batch_id"]
    s3_client = boto3.client('s3')
    dynamodb_client = boto3.client('dynamodb')
    dynamodb_resource = boto3.resource('dynamodb')
    table_name = "aciujums_entities"

    try:
        
        df_merged = prepare_data(s3_client)
        delete_table_if_exists(dynamodb_client, table_name)
        create_table(dynamodb_client, table_name)
        insert_data(dynamodb_resource, table_name, df_merged)
                    
    except Exception as e:
        print(e)
        raise e

