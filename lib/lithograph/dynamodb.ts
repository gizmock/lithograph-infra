import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as cdk from "@aws-cdk/core";

export class WebPageTable {
  readonly table: dynamodb.ITable;

  constructor(scope: cdk.Stack) {
    const table = new Table(scope, "WebPageTable");
    addGSICrossSearch(table);
    this.table = table;
  }
}

class Table extends dynamodb.Table {
  constructor(scope: cdk.Construct, id: string) {
    super(scope, id, {
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
    });
  }
}

function addGSICrossSearch(table: dynamodb.Table) {
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
