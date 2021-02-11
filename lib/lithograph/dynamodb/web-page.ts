import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as iam from "@aws-cdk/aws-iam";
import * as cdk from "@aws-cdk/core";

export class DynamoDBWebPage {
  private readonly table: dynamodb.Table;

  constructor(scope: cdk.Stack) {
    this.table = new Table(scope, "WebPageTable");
    this.addCrossSearchGSI();
  }

  private addCrossSearchGSI() {
    this.table.addGlobalSecondaryIndex({
      indexName: "CrossSearchGSI",
      partitionKey: {
        name: "crossSearch",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "publisedSort",
        type: dynamodb.AttributeType.STRING,
      },
      nonKeyAttributes: ["id", "title"],
      projectionType: dynamodb.ProjectionType.INCLUDE,
    });
  }

  grantReadData(grantee: iam.IGrantable) {
    this.table.grantReadData(grantee);
  }

  grantReadWriteData(grantee: iam.IGrantable) {
    this.table.grantReadWriteData(grantee);
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
