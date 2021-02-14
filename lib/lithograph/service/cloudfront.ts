import * as apigatewayv2 from "@aws-cdk/aws-apigatewayv2";
import * as certificatemanager from "@aws-cdk/aws-certificatemanager";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as iam from "@aws-cdk/aws-iam";
import * as s3 from "@aws-cdk/aws-s3";
import * as cdk from "@aws-cdk/core";

const API_CACHE_TTL = cdk.Duration.minutes(0);
const DEFAULT_ROOT_OBJECT = "";
const PUBLIC_FILE_ASSET_PATH = "public/*";

type WebOriginAccessIdentityProps = {
  readonly bucket: s3.IBucket;
};

export class WebOriginAccessIdentity extends cloudfront.OriginAccessIdentity {
  constructor(
    scope: cdk.Construct,
    id: string,
    props: WebOriginAccessIdentityProps
  ) {
    super(scope, id);
    props.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        effect: iam.Effect.ALLOW,
        principals: [this.grantPrincipal],
        resources: [`${props.bucket.bucketArn}/*`],
      })
    );
  }
}

type WebDistributionProps = WebOriginAccessIdentityProps & {
  readonly domain: string;
  readonly certificate: certificatemanager.ICertificate;
  readonly renderAPI: apigatewayv2.IHttpApi;
  readonly identity: cloudfront.OriginAccessIdentity;
};

export class WebDistribution extends cloudfront.CloudFrontWebDistribution {
  constructor(scope: cdk.Stack, id: string, props: WebDistributionProps) {
    super(scope, id, {
      defaultRootObject: DEFAULT_ROOT_OBJECT,
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: props.bucket,
            originAccessIdentity: props.identity,
          },
          behaviors: [
            {
              pathPattern: PUBLIC_FILE_ASSET_PATH,
              isDefaultBehavior: false,
            },
          ],
        },
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
