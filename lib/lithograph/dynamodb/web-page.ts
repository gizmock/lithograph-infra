import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as iam from "@aws-cdk/aws-iam";
import * as cdk from "@aws-cdk/core";

export class DynamoDBWebPage {
  private readonly table: dynamodb.Table;

  constructor(scope: cdk.Stack) {
    this.table = new WebPageTable(scope, "WebPageTable");
  }

  grantReadData(grantee: iam.IGrantable) {
    this.table.grantReadData(grantee);
  }
}

class WebPageTable extends dynamodb.Table {
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
