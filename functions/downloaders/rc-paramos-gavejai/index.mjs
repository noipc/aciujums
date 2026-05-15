import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import https from 'https';

const client = new S3Client({ region: 'eu-central-1' });
const fileName = 'JAR_PARAMOS_GAV_NUO.csv';

export const handler = async (event, context) => {
  try {
    // Prefer the year/month explicitly passed by MasterSync; fall back to
    // today only for local/manual testing.
    const now = new Date();
    const year = String(event?.target_year ?? now.getUTCFullYear());
    const month = String(event?.target_month ?? (now.getUTCMonth() + 1)).padStart(2, '0');

    const objectKey = `registru_centras/paramos_gavejai/year=${year}/month=${month}/${fileName}`;

    const options = {
      hostname: 'www.registrucentras.lt',
      path: `/aduomenys/?byla=${fileName}`,
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
    await client.send(command);

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
