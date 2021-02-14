import * as cognito from "@aws-cdk/aws-cognito";
import * as iam from "@aws-cdk/aws-iam";
import * as cdk from "@aws-cdk/core";

const COGNITO_IDENTITY_DOMAIN = "cognito-identity.amazonaws.com";
const COGNITO_STATUS_UNAUTHENTICATED = "unauthenticated";
const COGNITO_STATUS_AUTHENTICATED = "authenticated";

export class AdminCognito {
  readonly authenticatedRole: iam.IRole;

  constructor(scope: cdk.Construct) {
    const userPool = new AdminUserPool(scope, "AdminCognitoUserPool");
    const userPoolClient = new AdminUserPoolClient(
      scope,
      "AdminCognitoUserPoolClient",
      userPool
    );

    const identityPool = new AdminIdentityPool(
      scope,
      "AdminCognitoIdentityPool",
      userPool,
      userPoolClient
    );

    const unauthenticatedRole = new AdminUnauthenticatedRole(
      scope,
      "AdminCognitoIdentityUnauthenticatedRole",
      identityPool
    );

    this.authenticatedRole = new AdminAuthenticatedRole(
      scope,
      "AdminCognitoIdentityAuthenticatedRole",
      identityPool
    );

    new AdminIdentityRoleAttachement(
      scope,
      "AdminCognitoIdentityRoleAttachment",
      {
        identityPool: identityPool,
        unauthenticatedRole: unauthenticatedRole,
        authenticatedRole: this.authenticatedRole,
      }
    );
  }
}

class AdminUserPool extends cognito.UserPool {
  constructor(scope: cdk.Construct, id: string) {
    super(scope, id, {
      selfSignUpEnabled: false,
    });
  }
}

class AdminUserPoolClient extends cognito.UserPoolClient {
  constructor(scope: cdk.Construct, id: string, userPool: cognito.IUserPool) {
    super(scope, id, {
      userPool: userPool,
      preventUserExistenceErrors: true,
    });
  }
}

class AdminIdentityPool extends cognito.CfnIdentityPool {
  constructor(
    scope: cdk.Construct,
    id: string,
    userPool: cognito.UserPool,
    userPoolClient: cognito.UserPoolClient
  ) {
    super(scope, id, {
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: userPoolClient.userPoolClientId,
          providerName: userPool.userPoolProviderName,
        },
      ],
    });
  }
}

class AdminUnauthenticatedRole extends iam.Role {
  constructor(
    scope: cdk.Construct,
    id: string,
    identityPool: cognito.CfnIdentityPool
  ) {
    super(scope, id, {
      assumedBy: new iam.FederatedPrincipal(
        COGNITO_IDENTITY_DOMAIN,
        {
          StringEquals: {
            "cognito-identity.amazonaws.com:aud": identityPool.ref,
          },
          "ForAnyValue:StringLike": {
            "cognito-identity.amazonaws.com:amr": COGNITO_STATUS_UNAUTHENTICATED,
          },
        },
        "sts:AssumeRoleWithWebIdentity"
      ),
    });
    this.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["mobileanalytics:PutEvents", "cognito-sync:*"],
        resources: ["*"],
      })
    );
  }
}

class AdminAuthenticatedRole extends iam.Role {
  constructor(
    scope: cdk.Construct,
    id: string,
    identityPool: cognito.CfnIdentityPool
  ) {
    super(scope, id, {
      assumedBy: new iam.FederatedPrincipal(
        COGNITO_IDENTITY_DOMAIN,
        {
          StringEquals: {
            "cognito-identity.amazonaws.com:aud": identityPool.ref,
          },
          "ForAnyValue:StringLike": {
            "cognito-identity.amazonaws.com:amr": COGNITO_STATUS_AUTHENTICATED,
          },
        },
        "sts:AssumeRoleWithWebIdentity"
      ),
    });

    this.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "mobileanalytics:PutEvents",
          "cognito-sync:*",
          "cognito-identity:*",
        ],
        resources: ["*"],
      })
    );
  }
}

class AdminIdentityRoleAttachement extends cognito.CfnIdentityPoolRoleAttachment {
  constructor(
    scope: cdk.Construct,
    id: string,
    props: {
      identityPool: cognito.CfnIdentityPool;
      unauthenticatedRole: iam.Role;
      authenticatedRole: iam.Role;
    }
  ) {
    super(scope, id, {
      identityPoolId: props.identityPool.ref,
      roles: {
        unauthenticated: props.unauthenticatedRole.roleArn,
        authenticated: props.authenticatedRole.roleArn,
      },
    });
  }
}
