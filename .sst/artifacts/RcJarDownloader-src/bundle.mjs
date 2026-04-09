import { createRequire as topLevelCreateRequire } from 'module';
const require = topLevelCreateRequire(import.meta.url);
import { fileURLToPath as topLevelFileUrlToPath, URL as topLevelURL } from "url"
const __filename = topLevelFileUrlToPath(import.meta.url)
const __dirname = topLevelFileUrlToPath(new topLevelURL(".", import.meta.url))

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// functions/downloaders/rc-jar/index.mjs
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import https from "https";
var client = new S3Client({ region: "eu-central-1" });
var handler = /* @__PURE__ */ __name(async (event, context) => {
  try {
    const file_name = event.file_name;
    const host = event.host;
    const object_key = event.object_key;
    const dateParts = (/* @__PURE__ */ new Date()).toISOString().split("T")[0].split("-");
    const year = dateParts[0];
    const month = dateParts[1];
    const objectKey = `${object_key}/year=${year}/month=${month}/${file_name}`;
    const options = {
      hostname: host,
      path: `/aduomenys/?byla=${file_name}`,
      method: "GET"
    };
    const file = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to fetch data, status code: ${res.statusCode}`));
          return;
        }
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => resolve(data));
      });
      req.on("error", (error) => reject(error));
      req.end();
    });
    const input = {
      Bucket: process.env.DL_RAW_BUCKET,
      Key: objectKey,
      Body: file,
      Tagging: "Project=aciujums"
    };
    const command = new PutObjectCommand(input);
    const response = await client.send(command);
    console.log(response);
    return {
      statusCode: 200,
      body: `Data saved to S3 bucket: ${objectKey}`
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: "Error occurred while processing the request."
    };
  }
}, "handler");
var rc_jar_default = handler;
export {
  rc_jar_default as default,
  handler
};
//# sourceMappingURL=bundle.mjs.map
