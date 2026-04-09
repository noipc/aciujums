import { createRequire as topLevelCreateRequire } from 'module';
const require = topLevelCreateRequire(import.meta.url);
import { fileURLToPath as topLevelFileUrlToPath, URL as topLevelURL } from "url"
const __filename = topLevelFileUrlToPath(import.meta.url)
const __dirname = topLevelFileUrlToPath(new topLevelURL(".", import.meta.url))

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// functions/api/get-search-results/index.mjs
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { QueryCommand, GetCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
var client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "eu-central-1" }));
var TABLE_NAME = "aciujums_search";
var ENTITY_NAME_GSI = "entity_name-index";
var handler = /* @__PURE__ */ __name(async (event) => {
  const query = event.queryStringParameters?.q?.trim();
  if (!query) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing search query ?q=" })
    };
  }
  try {
    let items = [];
    if (/^\d+$/.test(query)) {
      const result = await client.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { legal_id: Number(query) }
      }));
      if (result.Item) items.push(result.Item);
    } else {
      const result = await client.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: ENTITY_NAME_GSI,
        KeyConditionExpression: "entity_name BEGINS_WITH :val",
        ExpressionAttributeValues: {
          ":val": query
        },
        Limit: 20
      }));
      items = result.Items || [];
    }
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(items)
    };
  } catch (err) {
    console.error("Search error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error during search" })
    };
  }
}, "handler");
export {
  handler
};
//# sourceMappingURL=bundle.mjs.map
