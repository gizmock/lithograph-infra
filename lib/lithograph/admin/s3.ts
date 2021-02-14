import * as s3 from "@aws-cdk/aws-s3";
import * as cdk from "@aws-cdk/core";

export class AdminS3BcuketSpa {
  readonly bucket: s3.IBucket;

  constructor(scope: cdk.Construct) {
    this.bucket = new Bucket(scope, "AdminS3Bucket");
  }
}

const INDEX_FILE: string = "index.html";

class Bucket extends s3.Bucket {
  constructor(scope: cdk.Construct, id: string) {
    super(scope, id, {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      websiteErrorDocument: INDEX_FILE,
      websiteIndexDocument: INDEX_FILE,
    });
  }
}
