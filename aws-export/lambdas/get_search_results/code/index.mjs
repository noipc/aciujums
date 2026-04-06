import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { QueryCommand, GetCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'eu-central-1' }));

const TABLE_NAME = 'aciujums_search';
const ENTITY_NAME_GSI = 'entity_name-index';

export const handler = async (event) => {
    const query = event.queryStringParameters?.q?.trim();

    if (!query) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing search query ?q=' }),
        };
    }

    try {
        let items = [];

        if (/^\d+$/.test(query)) {
            // Numeric → assume legal_id
            const result = await client.send(new GetCommand({
                TableName: TABLE_NAME,
                Key: { legal_id: Number(query) },
            }));
            if (result.Item) items.push(result.Item);
        } else {
            // Text search → entity_name begins_with
            const result = await client.send(new QueryCommand({
                TableName: TABLE_NAME,
                IndexName: ENTITY_NAME_GSI,
                KeyConditionExpression: 'entity_name BEGINS_WITH :val',
                ExpressionAttributeValues: {
                    ':val': query,
                },
                Limit: 20,
            }));
            items = result.Items || [];
        }

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(items),
        };

    } catch (err) {
        console.error('Search error:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server error during search' }),
        };
    }
};
