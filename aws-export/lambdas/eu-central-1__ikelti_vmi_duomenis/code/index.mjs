import axios from 'axios';
import * as cheerio from 'cheerio';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: 'eu-central-1' }); // Replace with your region
const BUCKET_NAME = 'nipc-dl-raw'; // Replace with your bucket name

export const handler = async () => {
    const baseUrl = 'https://www.vmi.lt';
    const targetUrl = `${baseUrl}/evmi/paramos-statistika`;

    try {
        // Step 1: Fetch the HTML
        const response = await axios.get(targetUrl);
        const $ = cheerio.load(response.data);

        const excelLinks = $('a[href*=".xlsx"]');

        console.log(excelLinks)

        let finalHref = null;

        excelLinks.each((i, el) => {
            const parent = $(el).closest('p').text();
            const href = $(el).attr('href');
            if (parent.includes('Paramos apskaičiavimo statist')) {
                finalHref = href;
                return false; // break out of .each()
            }
        });

        if (!finalHref) throw new Error('No matching Excel link found');

        const downloadUrl = finalHref.startsWith('http')
            ? finalHref
            : `${baseUrl}${finalHref}`;

        console.log(`Found Excel file URL: ${downloadUrl}`);


        // Step 3: Download the file
        const fileResponse = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
        const fileBuffer = Buffer.from(fileResponse.data);

        // Step 4: Define S3 object key
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');

        const key = `vmi/paramos_apskaiciavimo_statistika/year=${year}/month=${month}/paramos_statistika.xlsx`;

        // Step 5: Upload to S3
        const putCommand = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: fileBuffer,
            ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        await s3.send(putCommand);
        console.log(`File uploaded successfully to s3://${BUCKET_NAME}/${key}`);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'File downloaded and uploaded to S3 successfully.', key }),
        };

    } catch (error) {
        console.error('Error occurred:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};