import * as cdk from "@aws-cdk/core";
import * as route53 from "@aws-cdk/aws-route53";
import * as certificatemanager from "@aws-cdk/aws-certificatemanager";

const CERTIFICATE_REGION: string = "us-east-1";

type SiteCertificateProps = {
  readonly domain: string;
  readonly zone: route53.PublicHostedZone;
};

export class SiteCertificate extends certificatemanager.DnsValidatedCertificate {
  constructor(scope: cdk.Construct, id: string, props: SiteCertificateProps) {
    super(scope, id, {
      domainName: props.domain,
      hostedZone: props.zone,
      validation: certificatemanager.CertificateValidation.fromDns(props.zone),
      region: CERTIFICATE_REGION,
    });
  }
}
