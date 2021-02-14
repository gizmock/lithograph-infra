import * as certificatemanager from "@aws-cdk/aws-certificatemanager";
import * as route53 from "@aws-cdk/aws-route53";
import * as cdk from "@aws-cdk/core";

const CERTIFICATE_REGION: string = "us-east-1";

type Props = {
  serviceDomain: string;
  adminDomain: string;
  zone: route53.IHostedZone;
};

export class Certificates {
  readonly service: certificatemanager.ICertificate;
  readonly admin: certificatemanager.ICertificate;

  constructor(scope: cdk.Construct, props: Props) {
    this.service = new Certificate(
      scope,
      "WebCertificate",
      props.serviceDomain,
      props.zone
    );

    this.admin = new Certificate(
      scope,
      "AdminCertificate",
      props.adminDomain,
      props.zone
    );
  }
}

class Certificate extends certificatemanager.DnsValidatedCertificate {
  constructor(
    scope: cdk.Construct,
    id: string,
    domain: string,
    zone: route53.IHostedZone
  ) {
    super(scope, id, {
      domainName: domain,
      hostedZone: zone,
      validation: certificatemanager.CertificateValidation.fromDns(zone),
      region: CERTIFICATE_REGION,
    });
  }
}
