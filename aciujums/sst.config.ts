/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
    app(input) {
        const stage = input?.stage ?? "dev";
        const isProd = stage === "production";
        const isCI = !!process.env.GITHUB_ACTIONS || process.env.CI === "true";

        const region = isProd ? "us-east-1" : "eu-central-1";

        return {
            name: "aciujums",
            home: "aws",
            providers: {
                aws: isCI
                    ? { region } // CI: use OIDC creds from the Action
                    : { region, profile: isProd ? "nipc-prod" : "nipc-dev" }, // local only
            },
            removal: isProd ? "retain" : "remove",
            protect: ["production"].includes(stage),
        };
    },
    async run() {
        new sst.aws.Nextjs("Aciujums-nextjs");
    },
});
