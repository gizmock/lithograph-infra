import * as cdk from "@aws-cdk/core";
import * as dynamodb from "@aws-cdk/aws-dynamodb";

export class WebSiteSettingTable extends dynamodb.Table {
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

export class WebPageTable extends dynamodb.Table {
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
