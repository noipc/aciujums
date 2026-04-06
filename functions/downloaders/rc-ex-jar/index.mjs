import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import https from 'https';

const client = new S3Client({ region: 'eu-central-1' });
const fileName = 'JAR_ISREGISTRUOTI.csv';

export const handler = async (event, context) => {
  try {
    const dateParts = new Date().toISOString().split('T')[0].split('-');
    const year = dateParts[0];
    const month = dateParts[1];

    const objectKey = `registru_centras/ex_jar/year=${year}/month=${month}/${fileName}`;

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
