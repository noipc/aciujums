exports.handler = async (event) => {
    try {
        
        const AWS = require('aws-sdk');
        const s3 = new AWS.S3();
        
        const s3Params = {
            Bucket: 'nipc-dl-analytics',
            Key: 'aciujums/app-settings.json',  // Replace with your actual settings file name
        };
        
        const data = await s3.getObject(s3Params).promise();
        const settings = JSON.parse(data.Body.toString('utf-8'));
        

        return {
            statusCode: 200,
            body: JSON.stringify(settings),
        };
    } catch (err) {

        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
};
