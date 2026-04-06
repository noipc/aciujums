import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({});

export const handler = async (event) => {
    try {
        const legalIdParam = event.queryStringParameters?.legal_id;

        if (!legalIdParam) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Missing legal_id query parameter" }),
            };
        }

        const legal_id = Number(legalIdParam);

        const entityParams = {
            TableName: "aciujums_entities",
            KeyConditionExpression: "ja_kodas = :lid",
            ExpressionAttributeValues: {
                ":lid": { N: legal_id.toString() }
            }
        };

        const financeParams = {
            TableName: "aciujums_finances",
            KeyConditionExpression: "legal_id = :lid",
            ExpressionAttributeValues: {
                ":lid": { N: legal_id.toString() }
            }
        };

        const [entitiesData, financeData] = await Promise.all([
            client.send(new QueryCommand(entityParams)),
            client.send(new QueryCommand(financeParams)),
        ]);

        const info = entitiesData.Items ? entitiesData.Items.map((item) => unmarshall(item)) : [];
        const finances = financeData.Items ? financeData.Items.map((item) => unmarshall(item)) : [];

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ info, finances })
        };
    } catch (error) {
        console.error("DynamoDB error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};
