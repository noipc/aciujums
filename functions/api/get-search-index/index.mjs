import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({});

export const handler = async () => {
    const items = [];
    let lastKey;

    do {
        const params = {
            TableName: "aciujums_search",
            ProjectionExpression: "legal_id, entity_name",
            ...(lastKey && { ExclusiveStartKey: lastKey }),
        };
        const data = await client.send(new ScanCommand(params));
        for (const item of data.Items ?? []) {
            items.push(unmarshall(item));
        }
        lastKey = data.LastEvaluatedKey;
    } while (lastKey);

    return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(items),
    };
};
