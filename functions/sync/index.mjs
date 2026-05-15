import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const lambda = new LambdaClient({});

// Per-downloader static payload bits. The target year/month is injected
// at invocation time below so every downloader writes to the same
// year=YYYY/month=MM partition for the current execution.
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
    { name: 'RcExJarDownloader',           envVar: 'DOWNLOADER_RC_EX_JAR',            payload: {} },
    { name: 'RcNvoDownloader',             envVar: 'DOWNLOADER_RC_NVO',               payload: {} },
    { name: 'RcParamosGavejaiDownloader',  envVar: 'DOWNLOADER_RC_PARAMOS_GAVEJAI',   payload: {} },
    { name: 'RcJarNoFaDownloader',         envVar: 'DOWNLOADER_RC_JAR_NO_FA',         payload: {} },
    { name: 'RcExNvoDownloader',           envVar: 'DOWNLOADER_RC_EX_NVO',            payload: {} },
    { name: 'RcExParamosGavejaiDownloader',envVar: 'DOWNLOADER_RC_EX_PARAMOS_GAVEJAI',payload: {} },
    { name: 'VmiDownloader',               envVar: 'DOWNLOADER_VMI',                  payload: {} },
];

export const handler = async () => {
    const now = new Date();
    const timestamp = now.toISOString();

    // Explicitly capture the current execution year + month. This is the
    // single source of truth for the partition all downloaders write into.
    const target_year = now.getUTCFullYear();
    const target_month = now.getUTCMonth() + 1; // 1-12

    console.log('MasterSync starting', JSON.stringify({ timestamp, target_year, target_month }));

    const results = await Promise.allSettled(
        DOWNLOADERS.map(async ({ name, envVar, payload }) => {
            const functionName = process.env[envVar];
            if (!functionName) {
                throw new Error(`Missing env var ${envVar}`);
            }

            const fullPayload = {
                ...payload,
                target_year,
                target_month,
            };

            await lambda.send(new InvokeCommand({
                FunctionName: functionName,
                InvocationType: 'Event',
                Payload: JSON.stringify(fullPayload),
            }));
            return { name, functionName, status: 'invoked', payload: fullPayload };
        })
    );

    const invoked = results.map((result, i) => {
        if (result.status === 'fulfilled') {
            return result.value;
        }
        return { name: DOWNLOADERS[i].name, status: 'error', error: result.reason?.message };
    });

    console.log('MasterSync completed', JSON.stringify({ timestamp, target_year, target_month, invoked }));

    return {
        statusCode: 200,
        timestamp,
        target_year,
        target_month,
        invoked,
    };
};
