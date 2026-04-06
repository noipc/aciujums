import boto3
import logging
import urllib.parse
import pandas as pd
import io
import csv
import json
from datetime import datetime

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('aciujums_logs')
eventbridge = boto3.client('events')

logger = logging.getLogger()
logger.setLevel(logging.INFO)

EXPECTED_DELIMITER = '|'

REQUIRED_FILES = [
    "JAR_IREGISTRUOTI.csv",
    "JAR_ISREGISTRUOTI.csv",
    "JAR_NEPATEIKE_FA_UZ_PRAEJUSIUS.csv",
    "JAR_NVO_NUO.csv",
    "JAR_PARAMOS_GAV_NUO.csv"
]

REQUIRED_SCHEMAS = {
    "registru_centras/jar": {"ja_kodas", "ja_pavadinimas", "adresas", "ja_reg_data", "form_kodas", "form_pavadinimas", "stat_kodas", "stat_pavadinimas", "stat_data_nuo", "formavimo_data"},
    "registru_centras/ex_jar": {"ja_kodas", "ja_pavadinimas", "adresas", "ja_reg_data", "form_kodas", "form_pavadinimas", "isreg_data", "formavimo_data"},
    "registru_centras/jar_nepateike_finansiniu_ataskaitu": {"ja_kodas", "ja_pavadinimas", "ja_reg_data", "form_kodas", "stat_kodas", "fa_nepateikta_uz_metus", "formavimo_data"},
    "registru_centras/nvo": {"ja_kodas", "ja_pavadinimas", "ja_reg_data", "form_kodas", "form_pavadinimas", "nvo_nuo", "formavimo_data"},
    "registru_centras/paramos_gavejai": {"ja_kodas", "ja_pavadinimas", "ja_reg_data", "form_kodas", "form_pavadinimas", "paramos_gav_nuo", "formavimo_data"}
}

def get_required_columns(s3_key):
    for prefix, columns in REQUIRED_SCHEMAS.items():
        if s3_key.startswith(prefix):
            return columns
    return None

def check_csv_delimiter(key, file_content):
    try:
        dialect = csv.Sniffer().sniff(file_content[:1024].decode('utf-8'))
        return dialect.delimiter
    except csv.Error:
        logger.error(f"[VALIDATION FAILED] File: {key} - Failed to determine CSV delimiter")
        return None

def log_validation_result(batch_id, file_key, status, error_message="", detected_delimiter=None):
    item = {
        "batch_id": batch_id,
        "filename": file_key,
        "status": status,
        "timestamp": datetime.utcnow().isoformat(),
    }
    if error_message:
        item["error_message"] = error_message
    if detected_delimiter:
        item["detected_delimiter"] = detected_delimiter
    table.put_item(Item=item)

def extract_batch_id_from_key(key):
    try:
        parts = key.split('/')
        year = [p for p in parts if p.startswith('year=')][0].split('=')[1]
        month = [p for p in parts if p.startswith('month=')][0].split('=')[1]
        return f"{year}-{month}"
    except Exception:
        return "unknown"

def check_all_valid(batch_id):
    response = table.query(
        KeyConditionExpression=boto3.dynamodb.conditions.Key('batch_id').eq(batch_id)
    )
    items = response["Items"]
    valid_keys = {item["filename"].split("/")[-1] for item in items if item["status"] == "VALID"}
    if all(required in valid_keys for required in REQUIRED_FILES):
        logger.info(f"All required files for batch {batch_id} are valid")
        return True
    return False

def trigger_processing(batch_id):
    eventbridge.put_events(
        Entries=[
            {
                'Source': 'aciujums',
                'DetailType': 'Processing',
                'Detail': json.dumps({'batch_id': batch_id}),
                'EventBusName': 'aciujums'
            }
        ]
    )

def lambda_handler(event, context):
    try:
        record = event['Records'][0]['s3']
        bucket = record['bucket']['name']
        key = urllib.parse.unquote(record['object']['key'])
        batch_id = extract_batch_id_from_key(key)
        required_columns = get_required_columns(key)

        if required_columns is None:
            error_msg = f"No schema defined for file: {key}"
            logger.error(f"[VALIDATION FAILED] {error_msg}")
            log_validation_result(batch_id, key, "INVALID", error_msg)
            return {"statusCode": 400, "body": error_msg}

        response = s3_client.get_object(Bucket=bucket, Key=key)
        body = response['Body'].read()

        delimiter = check_csv_delimiter(key, body)
        if delimiter != EXPECTED_DELIMITER:
            error_msg = f"Invalid delimiter: {delimiter}"
            logger.error(f"[VALIDATION FAILED] File: {key} - {error_msg}")
            log_validation_result(batch_id, key, "INVALID", error_msg, delimiter)
            return {"statusCode": 400, "body": error_msg}

        try:
            df = pd.read_csv(io.BytesIO(body), delimiter=EXPECTED_DELIMITER)
        except Exception as e:
            error_msg = f"Failed to parse CSV: {str(e)}"
            logger.error(f"[VALIDATION FAILED] File: {key} - {error_msg}")
            log_validation_result(batch_id, key, "INVALID", error_msg)
            return {"statusCode": 400, "body": error_msg}

        missing = required_columns - set(df.columns)
        if missing:
            error_msg = f"Missing columns: {', '.join(missing)}"
            logger.error(f"[VALIDATION FAILED] File: {key} - {error_msg}")
            log_validation_result(batch_id, key, "INVALID", error_msg)
            return {"statusCode": 400, "body": error_msg}

        logger.info(f"[VALIDATION SUCCESS] File: {key} passed validation")
        log_validation_result(batch_id, key, "VALID", detected_delimiter=delimiter)

        if check_all_valid(batch_id):
            trigger_processing(batch_id)

        return {"statusCode": 200, "body": f"Valid file: {key}"}

    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        logger.error(f"[VALIDATION FAILED] {error_msg}")
        return {"statusCode": 500, "body": error_msg}
