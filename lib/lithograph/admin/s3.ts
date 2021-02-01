import * as cdk from "@aws-cdk/core";
import * as s3 from "@aws-cdk/aws-s3";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as s3deploy from "@aws-cdk/aws-s3-deployment";

const INDEX_FILE: string = "index.html";

export class AdminBucket extends s3.Bucket {
  constructor(scope: cdk.Construct, id: string) {
    super(scope, id, {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      websiteErrorDocument: INDEX_FILE,
      websiteIndexDocument: INDEX_FILE,
    });
  }
}

type AdminBucketDeploymentProps = {
  readonly bucket: s3.Bucket;
  readonly distribution: cloudfront.CloudFrontWebDistribution;
  readonly sourceDirectory: string;
};

export class AdminBucketDeployment extends s3deploy.BucketDeployment {
  constructor(
    scope: cdk.Construct,
    id: string,
    props: AdminBucketDeploymentProps
  ) {
    super(scope, id, {
      sources: [s3deploy.Source.asset(props.sourceDirectory)],
      destinationBucket: props.bucket,
      distribution: props.distribution,
      distributionPaths: ["/*"],
    });
  }
}
