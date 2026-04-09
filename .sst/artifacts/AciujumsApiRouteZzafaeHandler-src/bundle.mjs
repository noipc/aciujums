import { createRequire as topLevelCreateRequire } from 'module';
const require = topLevelCreateRequire(import.meta.url);
import { fileURLToPath as topLevelFileUrlToPath, URL as topLevelURL } from "url"
const __filename = topLevelFileUrlToPath(import.meta.url)
const __dirname = topLevelFileUrlToPath(new topLevelURL(".", import.meta.url))

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// functions/api/get-search-index/index.mjs
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
var client = new DynamoDBClient({});
var handler = /* @__PURE__ */ __name(async () => {
  const items = [];
  let lastKey;
  do {
    const params = {
      TableName: "aciujums_search",
      ProjectionExpression: "legal_id, entity_name",
      ...lastKey && { ExclusiveStartKey: lastKey }
    };
    const data = await client.send(new ScanCommand(params));
    for (const item of data.Items ?? []) {
      items.push(unmarshall(item));
    }
    lastKey = data.LastEvaluatedKey;
  } while (lastKey);
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(items)
  };
}, "handler");
export {
  handler
};
//# sourceMappingURL=bundle.mjs.map
