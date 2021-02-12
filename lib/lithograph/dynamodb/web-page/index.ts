import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as iam from "@aws-cdk/aws-iam";
import * as cdk from "@aws-cdk/core";
import { addCrossSearchGSI } from "./gsi";

export class DynamoDBWebPage {
  private readonly table: dynamodb.Table;

  constructor(scope: cdk.Stack) {
    this.table = new Table(scope, "WebPageTable");
    addCrossSearchGSI(this.table);
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
