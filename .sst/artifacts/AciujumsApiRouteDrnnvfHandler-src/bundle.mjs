import { createRequire as topLevelCreateRequire } from 'module';
const require = topLevelCreateRequire(import.meta.url);
import { fileURLToPath as topLevelFileUrlToPath, URL as topLevelURL } from "url"
const __filename = topLevelFileUrlToPath(import.meta.url)
const __dirname = topLevelFileUrlToPath(new topLevelURL(".", import.meta.url))

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// functions/api/get-entity-data/index.mjs
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
var client = new DynamoDBClient({});
var handler = /* @__PURE__ */ __name(async (event) => {
  try {
    const legalIdParam = event.queryStringParameters?.legal_id;
    if (!legalIdParam) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing legal_id query parameter" })
      };
    }
    const legal_id = Number(legalIdParam);
    const entityParams = {
      TableName: "aciujums_entities",
      KeyConditionExpression: "ja_kodas = :lid",
      ExpressionAttributeValues: {
        ":lid": { N: legal_id.toString() }
      }
    };
    const financeParams = {
      TableName: "aciujums_finances",
      KeyConditionExpression: "legal_id = :lid",
      ExpressionAttributeValues: {
        ":lid": { N: legal_id.toString() }
      }
    };
    const [entitiesData, financeData] = await Promise.all([
      client.send(new QueryCommand(entityParams)),
      client.send(new QueryCommand(financeParams))
    ]);
    const info = entitiesData.Items ? entitiesData.Items.map((item) => unmarshall(item)) : [];
    const finances = financeData.Items ? financeData.Items.map((item) => unmarshall(item)) : [];
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ info, finances })
    };
  } catch (error) {
    console.error("DynamoDB error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" })
    };
  }
}, "handler");
export {
  handler
};
//# sourceMappingURL=bundle.mjs.map
