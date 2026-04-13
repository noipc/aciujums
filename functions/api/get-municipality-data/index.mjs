import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({});

export const handler = async (event) => {
    try {
        const municipality = event.queryStringParameters?.municipality;
        const year = event.queryStringParameters?.year;

        if (!municipality || !year) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Municipality and year parameters are required" }),
            };
        }

        const params = {
            TableName: "aciujums_finances",
            IndexName: "municipality-year-index",
            KeyConditionExpression: "municipality = :m AND #year = :y",
            ExpressionAttributeNames: {
                "#year": "year"
            },
            ExpressionAttributeValues: {
                ":m": { S: municipality },
                ":y": { N: year.toString() }
            }
        };

        const data = await client.send(new QueryCommand(params));
        const items = (data.Items || []).map((item) => unmarshall(item));

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(items),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error" }),
        };
    }
};
