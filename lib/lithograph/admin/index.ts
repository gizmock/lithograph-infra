import * as cdk from "@aws-cdk/core";
import * as s3 from "@aws-cdk/aws-s3";
import * as certificatemanager from "@aws-cdk/aws-certificatemanager";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as cognito from "@aws-cdk/aws-cognito";
import * as iam from "@aws-cdk/aws-iam";

import { AdminBucket, AdminBucketDeployment } from "./s3";
import { AdminDistribution, AdminOriginAccessIdentity } from "./cloudfront";
import {
  AdminAuthenticatedRole,
  AdminIdentityPool,
  AdminIdentityRoleAttachement,
  AdminUnauthenticatedRole,
  AdminUserPool,
  AdminUserPoolClient,
} from "./cognito";

type AdminStacksProps = {
  readonly domain: string;
  readonly certificate: certificatemanager.DnsValidatedCertificate;
  readonly appSourceDirectory: string;
};

export class AdminStacks {
  readonly bucket: s3.Bucket;

  readonly distribution: cloudfront.CloudFrontWebDistribution;

  private readonly cognitoStacks: CognitoStacks;

  constructor(scope: cdk.Stack, props: AdminStacksProps) {
    this.bucket = new AdminBucket(scope, "AdminS3Bucket");
    const identity = new AdminOriginAccessIdentity(
      scope,
      "AdminCloudFrontIdentity",
      {
        bucket: this.bucket,
      }
    );
    this.distribution = new AdminDistribution(
      scope,
      "AdminCloudFrontDistribution",
      {
        domain: props.domain,
        bucket: this.bucket,
        certificate: props.certificate,
        identity: identity,
      }
    );
    new AdminBucketDeployment(scope, "AdminS3Deploy", {
      bucket: this.bucket,
      distribution: this.distribution,
      sourceDirectory: props.appSourceDirectory,
    });
    this.cognitoStacks = new CognitoStacks(scope);
  }

  adminAuthenticatedRole(): iam.Role {
    return this.cognitoStacks.authenticatedRole;
  }
}

class CognitoStacks {
  readonly userPool: cognito.UserPool;

  readonly userPoolClient: cognito.UserPoolClient;

  readonly identityPool: cognito.CfnIdentityPool;

  readonly unauthenticatedRole: iam.Role;

  readonly authenticatedRole: iam.Role;

  readonly identityPoolRoleAttachment: cognito.CfnIdentityPoolRoleAttachment;

  constructor(scope: cdk.Construct) {
    this.userPool = new AdminUserPool(scope, "AdminCognitoUserPool");
    this.userPoolClient = new AdminUserPoolClient(
      scope,
      "AdminCognitoUserPoolClient",
      {
        userPool: this.userPool,
      }
    );
    this.identityPool = new AdminIdentityPool(
      scope,
      "AdminCognitoIdentityPool",
      {
        userPool: this.userPool,
        userPoolClient: this.userPoolClient,
      }
    );
    this.unauthenticatedRole = new AdminUnauthenticatedRole(
      scope,
      "AdminCognitoIdentityUnauthenticatedRole",
      {
        identityPool: this.identityPool,
      }
    );
    this.authenticatedRole = new AdminAuthenticatedRole(
      scope,
      "AdminCognitoIdentityAuthenticatedRole",
      {
        identityPool: this.identityPool,
      }
    );
    this.identityPoolRoleAttachment = new AdminIdentityRoleAttachement(
      scope,
      "AdminCognitoIdentityRoleAttachment",
      {
        identityPool: this.identityPool,
        unauthenticatedRole: this.unauthenticatedRole,
        authenticatedRole: this.authenticatedRole,
      }
    );
  }
}
