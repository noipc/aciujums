import { createRequire as topLevelCreateRequire } from 'module';
const require = topLevelCreateRequire(import.meta.url);
import { fileURLToPath as topLevelFileUrlToPath, URL as topLevelURL } from "url"
const __filename = topLevelFileUrlToPath(import.meta.url)
const __dirname = topLevelFileUrlToPath(new topLevelURL(".", import.meta.url))

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// functions/api/get-index-data/index.mjs
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
var client = new DynamoDBClient({});
var handler = /* @__PURE__ */ __name(async (event) => {
  try {
    const params = {
      TableName: "aciujums_summary"
    };
    const data = await client.send(new ScanCommand(params));
    const items = data.Items ? data.Items.map((item) => unmarshall(item)) : [];
    return {
      statusCode: 200,
      body: JSON.stringify({ data: items })
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Error fetching data from DynamoDB",
        error: err.message
      })
    };
  }
}, "handler");
export {
  handler
};
//# sourceMappingURL=bundle.mjs.map
