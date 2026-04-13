import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const lambda = new LambdaClient({});

const DOWNLOADERS = [
    {
        name: 'RcJarDownloader',
        envVar: 'DOWNLOADER_RC_JAR',
        payload: {
            file_name: 'JAR_IREGISTRUOTI.csv',
            host: 'www.registrucentras.lt',
            object_key: 'registru_centras/jar',
        },
    },
    { name: 'RcExJarDownloader',          envVar: 'DOWNLOADER_RC_EX_JAR',           payload: {} },
    { name: 'RcNvoDownloader',             envVar: 'DOWNLOADER_RC_NVO',              payload: {} },
    { name: 'RcParamosGavejaiDownloader',  envVar: 'DOWNLOADER_RC_PARAMOS_GAVEJAI', payload: {} },
    { name: 'RcJarNoFaDownloader',         envVar: 'DOWNLOADER_RC_JAR_NO_FA',       payload: {} },
    { name: 'RcExNvoDownloader',           envVar: 'DOWNLOADER_RC_EX_NVO',          payload: {} },
    { name: 'RcExParamosGavejaiDownloader',envVar: 'DOWNLOADER_RC_EX_PARAMOS_GAVEJAI', payload: {} },
    { name: 'VmiDownloader',               envVar: 'DOWNLOADER_VMI',                payload: {} },
];

export const handler = async () => {
    const timestamp = new Date().toISOString();
    const results = await Promise.allSettled(
        DOWNLOADERS.map(async ({ name, envVar, payload }) => {
            const functionName = process.env[envVar];
            if (!functionName) {
                throw new Error(`Missing env var ${envVar}`);
            }
            await lambda.send(new InvokeCommand({
                FunctionName: functionName,
                InvocationType: 'Event',
                Payload: JSON.stringify(payload),
            }));
            return { name, functionName, status: 'invoked' };
        })
    );

    const invoked = results.map((result, i) => {
        if (result.status === 'fulfilled') {
            return result.value;
        }
        return { name: DOWNLOADERS[i].name, status: 'error', error: result.reason?.message };
    });

    console.log('MasterSync completed', JSON.stringify({ timestamp, invoked }));

    return {
        statusCode: 200,
        timestamp,
        invoked,
    };
};
