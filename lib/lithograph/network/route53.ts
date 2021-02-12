import * as cdk from "@aws-cdk/core";
import * as route53 from "@aws-cdk/aws-route53";
import * as targets from "@aws-cdk/aws-route53-targets";
import * as cloudfront from "@aws-cdk/aws-cloudfront";

type Props = {
  readonly domain: string;
  readonly zone: route53.IHostedZone;
  readonly distribution: cloudfront.CloudFrontWebDistribution;
};

export class CloudFrontDistributionIPV4ARecord extends route53.ARecord {
  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id, {
      zone: props.zone,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(props.distribution)
      ),
      recordName: props.domain,
    });
  }
}

export class CloudFrontDistributionIPV6AaaaRecord extends route53.AaaaRecord {
  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id, {
      zone: props.zone,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(props.distribution)
      ),
      recordName: props.domain,
    });
  }
}
