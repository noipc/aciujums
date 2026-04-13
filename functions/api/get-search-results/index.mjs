import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ScanCommand, GetCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'eu-central-1' }));

const TABLE_NAME = 'aciujums_search';

const HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
};

export const handler = async (event) => {
    const query = event.queryStringParameters?.q?.trim();

    if (!query) {
        return {
            statusCode: 400,
            headers: HEADERS,
            body: JSON.stringify({ error: 'Missing search query ?q=' }),
        };
    }

    try {
        let items = [];

        if (/^\d+$/.test(query)) {
            const result = await client.send(new GetCommand({
                TableName: TABLE_NAME,
                Key: { legal_id: Number(query) },
            }));
            if (result.Item) items.push(result.Item);
        } else {
            let lastKey;
            do {
                const result = await client.send(new ScanCommand({
                    TableName: TABLE_NAME,
                    FilterExpression: 'begins_with(entity_name, :val)',
                    ExpressionAttributeValues: { ':val': query },
                    ...(lastKey && { ExclusiveStartKey: lastKey }),
                }));
                items.push(...(result.Items || []));
                lastKey = result.LastEvaluatedKey;
                if (items.length >= 20) break;
            } while (lastKey);
            items = items.slice(0, 20);
        }

        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify(items),
        };
    } catch (err) {
        console.error('Search error:', err);
        return {
            statusCode: 500,
            headers: HEADERS,
            body: JSON.stringify({ error: 'Server error during search' }),
        };
    }
};
