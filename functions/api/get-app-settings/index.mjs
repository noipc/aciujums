import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({});
const ANALYTICS_BUCKET = process.env.ANALYTICS_BUCKET;

export const handler = async (event) => {
    if (!ANALYTICS_BUCKET) {
        return {
            statusCode: 200,
            body: JSON.stringify({}),
        };
    }

    try {
        const response = await s3.send(new GetObjectCommand({
            Bucket: ANALYTICS_BUCKET,
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
