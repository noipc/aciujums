import { createRequire as topLevelCreateRequire } from 'module';
const require = topLevelCreateRequire(import.meta.url);
import { fileURLToPath as topLevelFileUrlToPath, URL as topLevelURL } from "url"
const __filename = topLevelFileUrlToPath(import.meta.url)
const __dirname = topLevelFileUrlToPath(new topLevelURL(".", import.meta.url))

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// functions/downloaders/rc-ex-paramos-gavejai/index.mjs
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import https from "https";
var client = new S3Client({ region: "eu-central-1" });
var fileName = "JAR_PARAMOS_GAV_IKI.csv";
var handler = /* @__PURE__ */ __name(async (event, context) => {
  try {
    const dateParts = (/* @__PURE__ */ new Date()).toISOString().split("T")[0].split("-");
    const year = dateParts[0];
    const month = dateParts[1];
    const objectKey = `registru_centras/ex_paramos_gavejai/year=${year}/month=${month}/${fileName}`;
    const options = {
      hostname: "www.registrucentras.lt",
      path: `/aduomenys/?byla=${fileName}`,
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
    await client.send(command);
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
export {
  handler
};
//# sourceMappingURL=bundle.mjs.map
