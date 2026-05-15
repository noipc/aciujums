import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import https from 'https';

const client = new S3Client({ region: 'eu-central-1' });

export const handler = async (event, context) => {
  try {
    const file_name = event.file_name;
    const host = event.host;
    const object_key = event.object_key;

    // Prefer the year/month explicitly passed by MasterSync; fall back to
    // today only for local/manual testing.
    const now = new Date();
    const year = String(event.target_year ?? now.getUTCFullYear());
    const month = String(event.target_month ?? (now.getUTCMonth() + 1)).padStart(2, '0');

    const objectKey = `${object_key}/year=${year}/month=${month}/${file_name}`;

    const options = {
      hostname: host,
      path: `/aduomenys/?byla=${file_name}`,
      method: 'GET',
    };

    const file = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to fetch data, status code: ${res.statusCode}`));
          return;
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      });
      req.on('error', error => reject(error));
      req.end();
    });

    const input = {
      Bucket: process.env.DL_RAW_BUCKET,
      Key: objectKey,
      Body: file,
      Tagging: 'Project=aciujums',
    };

    const command = new PutObjectCommand(input);
    const response = await client.send(command);

    console.log(response);

    return {
      statusCode: 200,
      body: `Data saved to S3 bucket: ${objectKey}`,
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: 'Error occurred while processing the request.',
    };
  }
};

export default handler;
