import * as certificatemanager from "@aws-cdk/aws-certificatemanager";
import * as route53 from "@aws-cdk/aws-route53";
import * as cdk from "@aws-cdk/core";

const CERTIFICATE_REGION: string = "us-east-1";

type Props = {
  scope: cdk.Construct;
  webDomain: string;
  adminDomain: string;
  zone: route53.IHostedZone;
};

export class Certificates {
  readonly webCertificate: certificatemanager.ICertificate;
  readonly adminCertificate: certificatemanager.ICertificate;

  constructor(props: Props) {
    this.webCertificate = new Certificate(
      props.scope,
      "WebCertificate",
      props.webDomain,
      props.zone
    );

    this.adminCertificate = new Certificate(
      props.scope,
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
