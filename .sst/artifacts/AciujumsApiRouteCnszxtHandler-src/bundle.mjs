import { createRequire as topLevelCreateRequire } from 'module';
const require = topLevelCreateRequire(import.meta.url);
import { fileURLToPath as topLevelFileUrlToPath, URL as topLevelURL } from "url"
const __filename = topLevelFileUrlToPath(import.meta.url)
const __dirname = topLevelFileUrlToPath(new topLevelURL(".", import.meta.url))

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// functions/api/get-app-settings/index.mjs
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
var s3 = new S3Client({});
var handler = /* @__PURE__ */ __name(async (event) => {
  try {
    const response = await s3.send(new GetObjectCommand({
      Bucket: "nipc-dl-analytics",
      Key: "aciujums/app-settings.json"
    }));
    const body = await response.Body.transformToString();
    const settings = JSON.parse(body);
    return {
      statusCode: 200,
      body: JSON.stringify(settings)
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" })
    };
  }
}, "handler");
export {
  handler
};
//# sourceMappingURL=bundle.mjs.map
