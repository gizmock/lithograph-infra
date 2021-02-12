import * as dynamodb from "@aws-cdk/aws-dynamodb";

export function addCrossSearchGSI(table: dynamodb.Table) {
  table.addGlobalSecondaryIndex({
    indexName: "CrossSearchGSI",
    partitionKey: {
      name: "crossSearchId",
      type: dynamodb.AttributeType.STRING,
    },
    sortKey: {
      name: "crossSearchSort",
      type: dynamodb.AttributeType.STRING,
    },
    nonKeyAttributes: ["id", "title", "published"],
    projectionType: dynamodb.ProjectionType.INCLUDE,
  });
}
