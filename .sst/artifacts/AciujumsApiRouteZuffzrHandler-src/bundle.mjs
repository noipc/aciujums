import { createRequire as topLevelCreateRequire } from 'module';
const require = topLevelCreateRequire(import.meta.url);
import { fileURLToPath as topLevelFileUrlToPath, URL as topLevelURL } from "url"
const __filename = topLevelFileUrlToPath(import.meta.url)
const __dirname = topLevelFileUrlToPath(new topLevelURL(".", import.meta.url))

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// functions/api/get-municipality-data/index.mjs
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
var client = new DynamoDBClient({});
var handler = /* @__PURE__ */ __name(async (event) => {
  try {
    const municipality = event.queryStringParameters?.municipality;
    const year = event.queryStringParameters?.year;
    if (!municipality || !year) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Municipality and year parameters are required" })
      };
    }
    const params = {
      TableName: "aciujums_finances",
      IndexName: "municipality-year-index",
      KeyConditionExpression: "municipality = :m AND #year = :y",
      ExpressionAttributeNames: {
        "#year": "year"
      },
      ExpressionAttributeValues: {
        ":m": { S: municipality },
        ":y": { N: year.toString() }
      }
    };
    const data = await client.send(new QueryCommand(params));
    const items = data.Items.map((item) => unmarshall(item));
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items)
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" })
    };
  }
}, "handler");
export {
  handler
};
//# sourceMappingURL=bundle.mjs.map
