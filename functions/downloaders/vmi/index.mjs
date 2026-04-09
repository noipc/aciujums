import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: 'eu-central-1' });
const BUCKET_NAME = process.env.DL_RAW_BUCKET;

export const handler = async () => {
    const baseUrl = 'https://www.vmi.lt';
    const targetUrl = `${baseUrl}/evmi/paramos-statistika`;

    try {
        // Fetch the HTML page
        const pageRes = await fetch(targetUrl);
        if (!pageRes.ok) throw new Error(`Page fetch failed: ${pageRes.status}`);
        const html = await pageRes.text();

        // Extract the .xlsx href from anchor tags using regex
        // Looking for: <a href="...xlsx..."> inside a <p> that contains "Paramos apskaičiavimo statist"
        const paragraphs = html.match(/<p[^>]*>[\s\S]*?<\/p>/gi) ?? [];
        let finalHref = null;

        for (const para of paragraphs) {
            if (para.includes('Paramos apskaičiavimo statist')) {
                const hrefMatch = para.match(/href="([^"]*\.xlsx[^"]*)"/i);
                if (hrefMatch) {
                    finalHref = hrefMatch[1];
                    break;
                }
            }
        }

        if (!finalHref) throw new Error('No matching Excel link found');

        const downloadUrl = finalHref.startsWith('http')
            ? finalHref
            : `${baseUrl}${finalHref}`;

        console.log(`Found Excel file URL: ${downloadUrl}`);

        // Download the file
        const fileRes = await fetch(downloadUrl);
        if (!fileRes.ok) throw new Error(`File download failed: ${fileRes.status}`);
        const fileBuffer = Buffer.from(await fileRes.arrayBuffer());

        // Build S3 key with current year/month
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const key = `vmi/paramos_apskaiciavimo_statistika/year=${year}/month=${month}/paramos_statistika.xlsx`;

        await s3.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: fileBuffer,
            ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }));

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
