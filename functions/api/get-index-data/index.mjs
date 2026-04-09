import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({});

export const handler = async (event) => {
    try {
        const params = {
            TableName: 'aciujums_summary'
        };

        const data = await client.send(new ScanCommand(params));
        const items = data.Items ? data.Items.map((item) => unmarshall(item)) : [];

        return {
            statusCode: 200,
            body: JSON.stringify({ data: items })
        };
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: 'Error fetching data from DynamoDB',
                error: err.message,
            }),
        };
    }
};
