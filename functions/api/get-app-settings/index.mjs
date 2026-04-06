import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({});

export const handler = async (event) => {
    try {
        const response = await s3.send(new GetObjectCommand({
            Bucket: 'nipc-dl-analytics',
            Key: 'aciujums/app-settings.json',
        }));

        const body = await response.Body.transformToString();
        const settings = JSON.parse(body);

        return {
            statusCode: 200,
            body: JSON.stringify(settings),
        };
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
};
