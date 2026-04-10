import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { QueryCommand, GetCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'eu-central-1' }));

const TABLE_NAME = 'aciujums_search';
const ENTITY_NAME_GSI = 'entity_name-index';

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
            const result = await client.send(new QueryCommand({
                TableName: TABLE_NAME,
                IndexName: ENTITY_NAME_GSI,
                KeyConditionExpression: 'begins_with(entity_name, :val)',
                ExpressionAttributeValues: {
                    ':val': query,
                },
                Limit: 20,
            }));
            items = result.Items || [];
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
