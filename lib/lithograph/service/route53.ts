import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as route53 from "@aws-cdk/aws-route53";
import * as targets from "@aws-cdk/aws-route53-targets";
import * as cdk from "@aws-cdk/core";

type Props = {
  readonly domain: string;
  readonly zone: route53.IHostedZone;
  readonly distribution: cloudfront.IDistribution;
};

export function createServiceDNSRecords(scope: cdk.Construct, props: Props) {
  new IPV4ARecord(scope, "WebDistributionAliasIPV4", {
    domain: props.domain,
    zone: props.zone,
    distribution: props.distribution,
  });

  new IPV6AaaaRecord(scope, "WebDistributionAlias", {
    domain: props.domain,
    zone: props.zone,
    distribution: props.distribution,
  });
}

class IPV4ARecord extends route53.ARecord {
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

class IPV6AaaaRecord extends route53.AaaaRecord {
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
