const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {

    try {
        
        const params = {
            TableName: 'aciujums_summary'
        };

        const data = await dynamodb.scan(params).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ data: data.Items })
        };
        
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: 'Error fetching data from DynamoDB',
                error: err.message,
            }),
        };
    }
};
