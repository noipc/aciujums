import os
import json
import gzip
import base64
import boto3
import re

sns_client = boto3.client('sns')
TOPIC_ARN = os.environ["SNS_TOPIC_ARN"]

def lambda_handler(event, context):
    data = gzip.decompress(base64.b64decode(event['awslogs']['data']))
    log_event = json.loads(data)

    for log in log_event["logEvents"]:
        message = log['message']

        if "[VALIDATION FAILED]" in message:
            match = re.search(r'\[VALIDATION FAILED\] (.+)', message)
            error_detail = match.group(1) if match else message

            sns_client.publish(
                TopicArn=TOPIC_ARN,
                Subject="CSV Validation Error",
                Message=f"CSV structure error detected:\n\n{error_detail}"
            )
