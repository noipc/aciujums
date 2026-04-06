import pandas as pd
import boto3
import logging
import urllib
import json

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def get_file_date(s3_client, bucket, key):

    try:
        vmi_file = s3_client.get_object(Bucket=bucket, Key=key)['Body'].read()
        excel_file = pd.ExcelFile(vmi_file, engine='openpyxl')

        # Get the value from "Pagal_teisines_formas" sheet, cell A3
        pagal_teisines_formas = pd.read_excel(excel_file, sheet_name="Pagal_teisines_formas", header=None)
        value_from_A3 = pagal_teisines_formas.iloc[2, 0]  # A3 is [2,0] in 0-based indexing

        record_dt = value_from_A3.split(":")[1].strip()
        return record_dt

    except Exception as e:
        logger.error(f"Error reading Excel file: {e}")
        raise e

def send_event(eventbridge, event_details):

    try:
        response = eventbridge.put_events(
            Entries=[
                {
                    "Source": "check_vmi_file_date",
                    "DetailType": "vmi_processing",
                    "Detail": json.dumps(event_details),
                    "EventBusName": "default"
                }
            ]
        )
        logger.info(f"Event sent to EventBridge: {response}")
        return response
    except Exception as e:
        logger.error(f"Error sending event to EventBridge: {e}")
        raise e


def lambda_handler(event, context):

    s3_client         = boto3.client('s3')
    dynamodb_client   = boto3.client('dynamodb')
    dynamodb_resource = boto3.resource('dynamodb')
    eventbridge       = boto3.client('events')

    try:
        record = event['Records'][0]['s3']
        bucket = record['bucket']['name']
        key = urllib.parse.unquote(record['object']['key'])

        file_date = get_file_date(s3_client, bucket, key)

        response = dynamodb_client.get_item(
            TableName='aciujums_logs', 
            Key={
                'batch_id': {'S': 'last_processed_date'},
                'filename': {'S': key }
            }
        )

        existing_date = response.get('Item', {}).get('last_processed_date', {}).get('S', None)

        if not existing_date or file_date > existing_date:
            dynamodb_client.put_item(
                TableName='aciujums_logs', 
                Item={
                    'batch_id': {'S': 'last_processed_date'},
                    'filename': {'S': key},
                    'last_processed_date': {'S': file_date}
                }
            )
            logger.info(f"Updated last_processed_date to {file_date}")
            
        else:
            logger.info(f"No update needed. Existing date: {existing_date}, File date: {file_date}")
            send_event(eventbridge, {"filename": key})
        return {
            'statusCode': 200,
            'body': json.dumps('Hello from Lambda!')
        }

    except Exception as e:
        logger.error(f"Error in Lambda handler: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps(str(e))
        }