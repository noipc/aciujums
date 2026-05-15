import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = "aciujums_metadata";

const fetchStamp = async (key) => {
    const res = await client.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { key },
    }));
    const value = res.Item?.updated_at;
    return typeof value === "number" ? value : null;
};

export const handler = async () => {
    try {
        const [rc, vmi] = await Promise.all([
            fetchStamp("rc"),
            fetchStamp("vmi"),
        ]);

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store, max-age=0, must-revalidate",
            },
            body: JSON.stringify({ rc, vmi }),
        };
    } catch (error) {
        console.error("DynamoDB error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};
