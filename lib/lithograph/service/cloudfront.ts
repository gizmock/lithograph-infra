import * as apigatewayv2 from "@aws-cdk/aws-apigatewayv2";
import * as certificatemanager from "@aws-cdk/aws-certificatemanager";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as iam from "@aws-cdk/aws-iam";
import * as s3 from "@aws-cdk/aws-s3";
import * as cdk from "@aws-cdk/core";

const API_CACHE_TTL = cdk.Duration.minutes(0);
const DEFAULT_ROOT_OBJECT = "";
const PUBLIC_FILE_ASSET_PATH = "public/*";

type Props = {
  domain: string;
  certificate: certificatemanager.ICertificate;
  bucket: s3.IBucket;
  renderAPI: apigatewayv2.IHttpApi;
};

export class ServiceDistribution {
  readonly distribution: cloudfront.IDistribution;

  constructor(scope: cdk.Stack, props: Props) {
    const identity = new OriginAccessIdentity(
      scope,
      "WebCloudFrontIdentity",
      props.bucket
    );

    this.distribution = new Distribution(
      scope,
      "WebCloudFrontDistribution",
      identity,
      props
    );
  }
}

class OriginAccessIdentity extends cloudfront.OriginAccessIdentity {
  constructor(scope: cdk.Construct, id: string, bucket: s3.IBucket) {
    super(scope, id);

    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        effect: iam.Effect.ALLOW,
        principals: [this.grantPrincipal],
        resources: [`${bucket.bucketArn}/*`],
      })
    );
  }
}

class Distribution extends cloudfront.CloudFrontWebDistribution {
  constructor(
    scope: cdk.Stack,
    id: string,
    identity: cloudfront.IOriginAccessIdentity,
    props: Props
  ) {
    super(scope, id, {
      defaultRootObject: DEFAULT_ROOT_OBJECT,
      originConfigs: [
        // web file
        {
          s3OriginSource: {
            s3BucketSource: props.bucket,
            originAccessIdentity: identity,
          },
          behaviors: [
            {
              pathPattern: PUBLIC_FILE_ASSET_PATH,
              isDefaultBehavior: false,
            },
          ],
        },
        // render API
        {
          customOriginSource: {
            domainName: `${props.renderAPI.httpApiId}.execute-api.${scope.region}.${scope.urlSuffix}`,
          },
          behaviors: [
            {
              isDefaultBehavior: true,
              maxTtl: API_CACHE_TTL,
              defaultTtl: API_CACHE_TTL,
            },
          ],
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      enableIpV6: true,
      viewerCertificate: cloudfront.ViewerCertificate.fromAcmCertificate(
        props.certificate,
        {
          aliases: [props.domain],
        }
      ),
    });
  }
}
