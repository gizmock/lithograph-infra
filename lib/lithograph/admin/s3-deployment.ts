import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as s3 from "@aws-cdk/aws-s3";
import * as s3deploy from "@aws-cdk/aws-s3-deployment";
import * as cdk from "@aws-cdk/core";

type Props = {
  bucket: s3.IBucket;
  distribution: cloudfront.IDistribution;
  sourceDirectory: string;
};

export function createAdminConsoleBucketDeployment(
  scope: cdk.Construct,
  props: Props
) {
  new BucketDeployment(scope, "AdminS3Deploy", props);
}

class BucketDeployment extends s3deploy.BucketDeployment {
  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id, {
      sources: [s3deploy.Source.asset(props.sourceDirectory)],
      destinationBucket: props.bucket,
      distribution: props.distribution,
      distributionPaths: ["/*"],
    });
  }
}
