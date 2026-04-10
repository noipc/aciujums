/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
    app(input) {
        const stage = input?.stage ?? "dev";
        const isProd = stage === "production";
        const isCI = !!process.env.GITHUB_ACTIONS || process.env.CI === "true";

        // Both prod and dev deploy to eu-central-1 to co-locate with the API (Phase 8c)
        const region = "eu-central-1";

        return {
            name: "aciujums",
            home: "aws",
            providers: {
                aws: isCI
                    ? { region }
                    : { region, profile: isProd ? "nipc-prod" : "nipc-dev" },
            },
            removal: isProd ? "retain" : "remove",
            protect: ["production"].includes(stage),
            tags: {
                project: "aciujums",
                stage,
            },
        };
    },
    async run() {
        const { accountId } = await aws.getCallerIdentity({});

        // Official AWS SDK Pandas layer — python3.14 arm64 (eu-central-1)
        // Check latest version: https://aws-sdk-pandas.readthedocs.io/en/stable/layers.html
        const PANDAS_LAYER =
            "arn:aws:lambda:eu-central-1:336392948345:layer:AWSSDKPandas-Python312-Arm64:1";

        // ─────────────────────────────────────────────
        // GLOBAL: 30-day log retention on all project Lambdas
        // ─────────────────────────────────────────────
        $transform(sst.aws.Function, (args) => {
            args.logging = { retention: "1 month" };
        });

        // ─────────────────────────────────────────────
        // S3 BUCKETS
        // ─────────────────────────────────────────────
        const rawBucketName = $app.stage === "production" ? "nipc-raw-duomenys" : "nipc-dl-raw";
        const rawBucket = new sst.aws.Bucket("RawBucket", {
            transform: { bucket: (args, opts) => { args.bucket = rawBucketName; args.forceDestroy = undefined; opts.import = rawBucketName; } },
        });

        const analyticsBucket = $app.stage !== "production"
            ? new sst.aws.Bucket("AnalyticsBucket", {
                transform: { bucket: (args, opts) => { args.bucket = "nipc-dl-analytics"; opts.import = "nipc-dl-analytics"; } },
            })
            : null;

        // ─────────────────────────────────────────────
        // DYNAMODB TABLES
        // ─────────────────────────────────────────────
        const entitiesTable = new sst.aws.Dynamo("EntitiesTable", {
            fields: { ja_kodas: "number" },
            primaryIndex: { hashKey: "ja_kodas" },
            transform: {
                table: (args, opts) => { args.name = "aciujums_entities"; args.billingMode = "PAY_PER_REQUEST"; args.pointInTimeRecovery = { "__defaults": [], "enabled": false }; opts.import = "aciujums_entities"; },
            },
        });

        const financesTable = new sst.aws.Dynamo("FinancesTable", {
            fields: {
                legal_id: "number",
                municipality_year: "string",
                municipality: "string",
                year: "number",
            },
            primaryIndex: { hashKey: "legal_id", rangeKey: "municipality_year" },
            globalIndexes: {
                "municipality-year-index": { hashKey: "municipality", rangeKey: "year" },
            },
            transform: {
                table: (args, opts) => { args.name = "aciujums_finances"; args.billingMode = "PAY_PER_REQUEST"; args.pointInTimeRecovery = { "__defaults": [], "enabled": false }; opts.import = "aciujums_finances"; },
            },
        });

        const summaryTable = new sst.aws.Dynamo("SummaryTable", {
            fields: { municipality: "string", year: "number" },
            primaryIndex: { hashKey: "municipality", rangeKey: "year" },
            transform: {
                table: (args, opts) => { args.name = "aciujums_summary"; args.billingMode = "PAY_PER_REQUEST"; args.pointInTimeRecovery = { "__defaults": [], "enabled": false }; opts.import = "aciujums_summary"; },
            },
        });

        const searchTable = new sst.aws.Dynamo("SearchTable", {
            fields: { legal_id: "number", entity_name: "string" },
            primaryIndex: { hashKey: "legal_id" },
            globalIndexes: {
                "entity_name-index": { hashKey: "entity_name" },
            },
            transform: {
                table: (args, opts) => { args.name = "aciujums_search"; args.billingMode = "PAY_PER_REQUEST"; args.pointInTimeRecovery = { "__defaults": [], "enabled": false }; opts.import = "aciujums_search"; },
            },
        });

        const logsTable = new sst.aws.Dynamo("LogsTable", {
            fields: { batch_id: "string", filename: "string" },
            primaryIndex: { hashKey: "batch_id", rangeKey: "filename" },
            transform: {
                table: (args, opts) => { args.name = "aciujums_logs"; args.billingMode = "PAY_PER_REQUEST"; args.pointInTimeRecovery = { "__defaults": [], "enabled": false }; opts.import = "aciujums_logs"; },
            },
        });

        // ─────────────────────────────────────────────
        // SNS ALERT TOPIC
        // ─────────────────────────────────────────────
        const alertTopic = new sst.aws.SnsTopic("AlertTopic", {
            transform: { topic: (args, opts) => { args.name = "lambda-csv-errors"; opts.import = `arn:aws:sns:eu-central-1:${accountId}:lambda-csv-errors`; } },
        });

        // ─────────────────────────────────────────────
        // CUSTOM EVENTBUS (RC validation → processing pipeline)
        // ─────────────────────────────────────────────
        const aciujumsBus = new aws.cloudwatch.EventBus("AciujumsBus", {
            name: "aciujums",
        }, { import: "aciujums" });

        const alertEmail = process.env.ALERT_EMAIL;
        if (!alertEmail) throw new Error("ALERT_EMAIL env var is required");
        new aws.sns.TopicSubscription("AlertEmailSubscription", {
            topic: alertTopic.arn,
            protocol: "email",
            endpoint: alertEmail,
        });

        // ─────────────────────────────────────────────
        // IAM ROLES
        // ─────────────────────────────────────────────
        const lambdaAssumePolicy = JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Effect: "Allow",
                Principal: { Service: "lambda.amazonaws.com" },
                Action: "sts:AssumeRole",
            }],
        });

        const BASE_POLICIES = [
            "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        ];

        const downloaderRole = new aws.iam.Role("DownloaderRole", {
            name: $interpolate`aciujums-downloader-${$app.stage}`,
            assumeRolePolicy: lambdaAssumePolicy,
            managedPolicyArns: BASE_POLICIES,
            inlinePolicies: [{
                name: "s3-put-raw",
                policy: $jsonStringify({
                    Version: "2012-10-17",
                    Statement: [{
                        Effect: "Allow",
                        Action: ["s3:PutObject"],
                        Resource: $interpolate`${rawBucket.arn}/*`,
                    }],
                }),
            }],
        });

        const validatorRole = new aws.iam.Role("ValidatorRole", {
            name: $interpolate`aciujums-validator-${$app.stage}`,
            assumeRolePolicy: lambdaAssumePolicy,
            managedPolicyArns: BASE_POLICIES,
            inlinePolicies: [{
                name: "validator-access",
                policy: $jsonStringify({
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Effect: "Allow",
                            Action: ["s3:GetObject"],
                            Resource: $interpolate`${rawBucket.arn}/*`,
                        },
                        {
                            Effect: "Allow",
                            Action: ["dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:GetItem"],
                            Resource: logsTable.arn,
                        },
                        {
                            Effect: "Allow",
                            Action: ["events:PutEvents"],
                            Resource: [aciujumsBus.arn, "arn:aws:events:*:*:event-bus/default"],
                        },
                    ],
                }),
            }],
        });

        const processorRole = new aws.iam.Role("ProcessorRole", {
            name: $interpolate`aciujums-processor-${$app.stage}`,
            assumeRolePolicy: lambdaAssumePolicy,
            managedPolicyArns: BASE_POLICIES,
            inlinePolicies: [{
                name: "processor-access",
                policy: $jsonStringify({
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Effect: "Allow",
                            Action: ["s3:GetObject"],
                            Resource: $interpolate`${rawBucket.arn}/*`,
                        },
                        {
                            Effect: "Allow",
                            Action: [
                                "dynamodb:PutItem",
                                "dynamodb:BatchWriteItem",
                                "dynamodb:GetItem",
                                "dynamodb:CreateTable",
                                "dynamodb:DeleteTable",
                                "dynamodb:DescribeTable",
                            ],
                            Resource: entitiesTable.arn,
                        },
                        {
                            Effect: "Allow",
                            Action: ["dynamodb:PutItem", "dynamodb:BatchWriteItem"],
                            Resource: [financesTable.arn, summaryTable.arn, searchTable.arn],
                        },
                    ],
                }),
            }],
        });

        const alertRole = new aws.iam.Role("AlertRole", {
            name: $interpolate`aciujums-alert-${$app.stage}`,
            assumeRolePolicy: lambdaAssumePolicy,
            managedPolicyArns: BASE_POLICIES,
            inlinePolicies: [{
                name: "sns-publish",
                policy: $jsonStringify({
                    Version: "2012-10-17",
                    Statement: [{
                        Effect: "Allow",
                        Action: ["sns:Publish"],
                        Resource: alertTopic.arn,
                    }],
                }),
            }],
        });

        const apiRole = new aws.iam.Role("ApiRole", {
            name: $interpolate`aciujums-api-${$app.stage}`,
            assumeRolePolicy: lambdaAssumePolicy,
            managedPolicyArns: BASE_POLICIES,
            inlinePolicies: [{
                name: "api-read-access",
                policy: $jsonStringify({
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Effect: "Allow",
                            Action: ["dynamodb:GetItem", "dynamodb:Query", "dynamodb:Scan"],
                            Resource: [
                                entitiesTable.arn,
                                financesTable.arn,
                                summaryTable.arn,
                                searchTable.arn,
                                $interpolate`${financesTable.arn}/index/*`,
                                $interpolate`${searchTable.arn}/index/*`,
                            ],
                        },
                        ...(analyticsBucket ? [{
                            Effect: "Allow",
                            Action: ["s3:GetObject", "s3:ListBucket"],
                            Resource: [analyticsBucket.arn, $interpolate`${analyticsBucket.arn}/*`],
                        }] : []),
                    ],
                }),
            }],
        });

        // ─────────────────────────────────────────────
        // DOWNLOADER LAMBDAS (nodejs22.x, arm64)
        // ─────────────────────────────────────────────
        const downloaderEnv = { DL_RAW_BUCKET: rawBucket.name };
        // @aws-sdk/client-s3 is built into the nodejs22.x Lambda runtime — mark as external
        const downloaderNodejs = { esbuild: { external: ["@aws-sdk/client-s3"] } };

        const rcJar = new sst.aws.Function("RcJarDownloader", {
            handler: "functions/downloaders/rc-jar/index.handler",
            runtime: "nodejs22.x",
            architecture: "arm64",
            timeout: "70 seconds",
            memory: "512 MB",
            environment: downloaderEnv,
            role: downloaderRole.arn,
            nodejs: downloaderNodejs,
        });

        const rcExJar = new sst.aws.Function("RcExJarDownloader", {
            handler: "functions/downloaders/rc-ex-jar/index.handler",
            runtime: "nodejs22.x",
            architecture: "arm64",
            timeout: "70 seconds",
            memory: "512 MB",
            environment: downloaderEnv,
            role: downloaderRole.arn,
            nodejs: downloaderNodejs,
        });

        const rcNvo = new sst.aws.Function("RcNvoDownloader", {
            handler: "functions/downloaders/rc-nvo/index.handler",
            runtime: "nodejs22.x",
            architecture: "arm64",
            timeout: "70 seconds",
            memory: "512 MB",
            environment: downloaderEnv,
            role: downloaderRole.arn,
            nodejs: downloaderNodejs,
        });

        const rcExNvo = new sst.aws.Function("RcExNvoDownloader", {
            handler: "functions/downloaders/rc-ex-nvo/index.handler",
            runtime: "nodejs22.x",
            architecture: "arm64",
            timeout: "70 seconds",
            memory: "128 MB",
            environment: downloaderEnv,
            role: downloaderRole.arn,
            nodejs: downloaderNodejs,
        });

        const rcParamosGavejai = new sst.aws.Function("RcParamosGavejaiDownloader", {
            handler: "functions/downloaders/rc-paramos-gavejai/index.handler",
            runtime: "nodejs22.x",
            architecture: "arm64",
            timeout: "70 seconds",
            memory: "512 MB",
            environment: downloaderEnv,
            role: downloaderRole.arn,
            nodejs: downloaderNodejs,
        });

        const rcExParamosGavejai = new sst.aws.Function("RcExParamosGavejaiDownloader", {
            handler: "functions/downloaders/rc-ex-paramos-gavejai/index.handler",
            runtime: "nodejs22.x",
            architecture: "arm64",
            timeout: "70 seconds",
            memory: "512 MB",
            environment: downloaderEnv,
            role: downloaderRole.arn,
            nodejs: downloaderNodejs,
        });

        const rcJarNoFa = new sst.aws.Function("RcJarNoFaDownloader", {
            handler: "functions/downloaders/rc-jar-no-fa/index.handler",
            runtime: "nodejs22.x",
            architecture: "arm64",
            timeout: "70 seconds",
            memory: "512 MB",
            environment: downloaderEnv,
            role: downloaderRole.arn,
            nodejs: downloaderNodejs,
        });

        const vmiDownloader = new sst.aws.Function("VmiDownloader", {
            handler: "functions/downloaders/vmi/index.handler",
            runtime: "nodejs22.x",
            architecture: "arm64",
            timeout: "30 seconds",
            memory: "128 MB",
            environment: downloaderEnv,
            role: downloaderRole.arn,
            nodejs: downloaderNodejs,
        });

        // ─────────────────────────────────────────────
        // VALIDATOR LAMBDAS (python3.14, arm64, Pandas layer)
        // ─────────────────────────────────────────────
        const checkCsvStructure = new sst.aws.Function("CheckCsvStructure", {
            handler: "functions/validators/check-csv-structure/lambda_function.lambda_handler",
            runtime: "python3.12",
            architecture: "arm64",
            layers: [PANDAS_LAYER],
            timeout: "10 seconds",
            memory: "512 MB",
            role: validatorRole.arn,
        });

        const checkVmiFileDate = new sst.aws.Function("CheckVmiFileDate", {
            handler: "functions/validators/check-vmi-file-date/lambda_function.lambda_handler",
            runtime: "python3.12",
            architecture: "arm64",
            layers: [PANDAS_LAYER],
            timeout: "30 seconds",
            memory: "128 MB",
            role: validatorRole.arn,
        });

        // ─────────────────────────────────────────────
        // PROCESSOR LAMBDAS (python3.14, arm64, Pandas layer)
        // ─────────────────────────────────────────────
        const rcProcessor = new sst.aws.Function("RcProcessor", {
            handler: "functions/processors/rc-processor/lambda_function.lambda_handler",
            runtime: "python3.12",
            architecture: "arm64",
            layers: [PANDAS_LAYER],
            timeout: "600 seconds",
            memory: "1240 MB",
            role: processorRole.arn,
        });

        const vmiProcessor = new sst.aws.Function("VmiProcessor", {
            handler: "functions/processors/vmi-processor/lambda_function.lambda_handler",
            runtime: "python3.12",
            architecture: "arm64",
            layers: [PANDAS_LAYER],
            timeout: "300 seconds",
            memory: "1024 MB",
            role: processorRole.arn,
        });

        // ─────────────────────────────────────────────
        // ALERT LAMBDA (python3.14, arm64)
        // ─────────────────────────────────────────────
        const sendAlert = new sst.aws.Function("SendAlert", {
            handler: "functions/alerts/send-alert/lambda_function.lambda_handler",
            runtime: "python3.12",
            architecture: "arm64",
            timeout: "10 seconds",
            memory: "128 MB",
            role: alertRole.arn,
        });

        // CloudWatch Logs → send-alert (fires on [VALIDATION FAILED] log lines)
        const awsRegion = aws.getRegionOutput({}).name;
        const awsAccount = aws.getCallerIdentityOutput({}).accountId;

        const checkCsvLogGroup = new aws.cloudwatch.LogGroup("CheckCsvStructureLogGroup", {
            name: $interpolate`/aws/lambda/${checkCsvStructure.name}`,
            retentionInDays: 30,
        });

        new aws.lambda.Permission("SendAlertCwPermission", {
            action: "lambda:InvokeFunction",
            function: sendAlert.arn,
            principal: "logs.amazonaws.com",
            sourceArn: $interpolate`arn:aws:logs:${awsRegion}:${awsAccount}:log-group:${checkCsvLogGroup.name}:*`,
        });

        new aws.cloudwatch.LogSubscriptionFilter("CsvValidationAlertFilter", {
            logGroup: checkCsvLogGroup.name,
            filterPattern: '"VALIDATION FAILED"',
            destinationArn: sendAlert.arn,
        }, { dependsOn: [checkCsvLogGroup] });

        // ─────────────────────────────────────────────
        // S3 EVENT TRIGGERS
        // ─────────────────────────────────────────────
        const csvPermission = new aws.lambda.Permission("CheckCsvS3Permission", {
            action: "lambda:InvokeFunction",
            function: checkCsvStructure.arn,
            principal: "s3.amazonaws.com",
            sourceArn: rawBucket.arn,
        });

        const xlsxPermission = new aws.lambda.Permission("CheckVmiS3Permission", {
            action: "lambda:InvokeFunction",
            function: checkVmiFileDate.arn,
            principal: "s3.amazonaws.com",
            sourceArn: rawBucket.arn,
        });

        new aws.s3.BucketNotification("RawBucketNotifications", {
            bucket: rawBucket.name,
            lambdaFunctions: [
                {
                    lambdaFunctionArn: checkCsvStructure.arn,
                    events: ["s3:ObjectCreated:*"],
                    filterSuffix: ".csv",
                },
                {
                    lambdaFunctionArn: checkVmiFileDate.arn,
                    events: ["s3:ObjectCreated:Put"],
                    filterSuffix: ".xlsx",
                },
            ],
        }, { dependsOn: [csvPermission, xlsxPermission] });

        // ─────────────────────────────────────────────
        // EVENTBRIDGE RULES
        // ─────────────────────────────────────────────

        // 1. Monthly RC download — 3rd of every month at 06:00 UTC
        const monthlyRcRule = new aws.cloudwatch.EventRule("MonthlyRcTrigger", {
            name: "monthly-trigger",
            scheduleExpression: "cron(0 6 3 1-12 ? *)",
        });

        new aws.cloudwatch.EventTarget("MonthlyRcJarTarget", {
            rule: monthlyRcRule.name,
            arn: rcJar.arn,
            input: JSON.stringify({
                file_name: "JAR_IREGISTRUOTI.csv",
                host: "www.registrucentras.lt",
                object_key: "registru_centras/jar",
            }),
        });
        new aws.cloudwatch.EventTarget("MonthlyRcExJarTarget", { rule: monthlyRcRule.name, arn: rcExJar.arn });
        new aws.cloudwatch.EventTarget("MonthlyRcNvoTarget", { rule: monthlyRcRule.name, arn: rcNvo.arn });
        new aws.cloudwatch.EventTarget("MonthlyRcParamosGavejaiTarget", { rule: monthlyRcRule.name, arn: rcParamosGavejai.arn });
        new aws.cloudwatch.EventTarget("MonthlyRcJarNoFaTarget", { rule: monthlyRcRule.name, arn: rcJarNoFa.arn });

        for (const { name, fn } of [
            { name: "RcJar", fn: rcJar },
            { name: "RcExJar", fn: rcExJar },
            { name: "RcNvo", fn: rcNvo },
            { name: "RcParamosGavejai", fn: rcParamosGavejai },
            { name: "RcJarNoFa", fn: rcJarNoFa },
        ]) {
            new aws.lambda.Permission(`MonthlyRc${name}EbPermission`, {
                action: "lambda:InvokeFunction",
                function: fn.arn,
                principal: "events.amazonaws.com",
                sourceArn: monthlyRcRule.arn,
            });
        }

        // 2. Monthly VMI download — 3rd of every month at 06:00 UTC (separate rule)
        const monthlyVmiRule = new aws.cloudwatch.EventRule("MonthlyVmiTrigger", {
            name: "monthly-trigger-2",
            scheduleExpression: "cron(0 6 3 1-12 ? *)",
        });

        new aws.cloudwatch.EventTarget("MonthlyRcExNvoTarget", { rule: monthlyVmiRule.name, arn: rcExNvo.arn });
        new aws.cloudwatch.EventTarget("MonthlyRcExParamosGavejaiTarget", { rule: monthlyVmiRule.name, arn: rcExParamosGavejai.arn });

        for (const { name, fn } of [
            { name: "RcExNvo", fn: rcExNvo },
            { name: "RcExParamosGavejai", fn: rcExParamosGavejai },
        ]) {
            new aws.lambda.Permission(`MonthlyVmi${name}EbPermission`, {
                action: "lambda:InvokeFunction",
                function: fn.arn,
                principal: "events.amazonaws.com",
                sourceArn: monthlyVmiRule.arn,
            });
        }

        // 3. RC processing — triggered via the "aciujums" custom bus
        const rcProcessingRule = new aws.cloudwatch.EventRule("RcProcessingTrigger", {
            eventBusName: aciujumsBus.name,
            eventPattern: JSON.stringify({
                source: ["aciujums"],
                "detail-type": ["Processing"],
            }),
        });

        new aws.cloudwatch.EventTarget("RcProcessingTarget", {
            rule: rcProcessingRule.name,
            eventBusName: aciujumsBus.name,
            arn: rcProcessor.arn,
        });

        new aws.lambda.Permission("RcProcessorEbPermission", {
            action: "lambda:InvokeFunction",
            function: rcProcessor.arn,
            principal: "events.amazonaws.com",
            sourceArn: rcProcessingRule.arn,
        });

        // 4. VMI processing — triggered via the default bus
        const vmiProcessingRule = new aws.cloudwatch.EventRule("VmiProcessingTrigger", {
            name: "trigger-vmi-processing",
            eventPattern: JSON.stringify({
                source: ["check_vmi_file_date"],
                "detail-type": ["vmi_processing"],
            }),
        });

        new aws.cloudwatch.EventTarget("VmiProcessingTarget", {
            rule: vmiProcessingRule.name,
            arn: vmiProcessor.arn,
        });

        new aws.lambda.Permission("VmiProcessorEbPermission", {
            action: "lambda:InvokeFunction",
            function: vmiProcessor.arn,
            principal: "events.amazonaws.com",
            sourceArn: vmiProcessingRule.arn,
        });

        // ─────────────────────────────────────────────
        // API GATEWAY HTTP v2
        // ─────────────────────────────────────────────
        const api = new sst.aws.ApiGatewayV2("AciujumsApi", {
            cors: {
                allowOrigins: ["*"],
                allowMethods: ["GET"],
                allowHeaders: ["Content-Type"],
            },
        });

        // @aws-sdk/* packages are built into the nodejs22.x Lambda runtime
        const apiNodejs = { esbuild: { external: ["@aws-sdk/client-dynamodb", "@aws-sdk/util-dynamodb", "@aws-sdk/lib-dynamodb", "@aws-sdk/client-s3"] } };

        api.route("GET /entity_data", {
            handler: "functions/api/get-entity-data/index.handler",
            runtime: "nodejs22.x",
            architecture: "arm64",
            timeout: "3 seconds",
            memory: "128 MB",
            role: apiRole.arn,
            nodejs: apiNodejs,
        });

        api.route("GET /index_data", {
            handler: "functions/api/get-index-data/index.handler",
            runtime: "nodejs22.x",
            architecture: "arm64",
            timeout: "30 seconds",
            memory: "128 MB",
            role: apiRole.arn,
            nodejs: apiNodejs,
        });

        api.route("GET /municipality_data", {
            handler: "functions/api/get-municipality-data/index.handler",
            runtime: "nodejs22.x",
            architecture: "arm64",
            timeout: "30 seconds",
            memory: "128 MB",
            role: apiRole.arn,
            nodejs: apiNodejs,
        });

        api.route("GET /search", {
            handler: "functions/api/get-search-results/index.handler",
            runtime: "nodejs22.x",
            architecture: "arm64",
            timeout: "3 seconds",
            memory: "128 MB",
            role: apiRole.arn,
            nodejs: apiNodejs,
        });

        api.route("GET /app_settings", {
            handler: "functions/api/get-app-settings/index.handler",
            runtime: "nodejs22.x",
            architecture: "arm64",
            timeout: "30 seconds",
            memory: "128 MB",
            role: apiRole.arn,
            nodejs: apiNodejs,
        });

        api.route("GET /search_index", {
            handler: "functions/api/get-search-index/index.handler",
            runtime: "nodejs22.x",
            architecture: "arm64",
            timeout: "30 seconds",
            memory: "256 MB",
            role: apiRole.arn,
            nodejs: apiNodejs,
        });

        // ─────────────────────────────────────────────
        // NEXT.JS APP
        // ─────────────────────────────────────────────
        new sst.aws.Nextjs("Aciujums-nextjs", {
            path: "aciujums",
            server: { architecture: "arm64" },
            environment: {
                NEXT_PUBLIC_API_URL: api.url,
            },
        });

        return {
            apiUrl: api.url,
        };
    },
});
