import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';

export class CreateUserPoolStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a Cognito user pool
    const userPool = new cognito.UserPool(this, 'NUserPool', {
      userPoolName: 'NUserPool',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: false,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add Google as an identity provider
    const googleProvider = new cognito.UserPoolIdentityProviderGoogle(this, 'Google', {
      userPool,
      clientId: '126127564083-ge13b0car69dnue6403jb1fo6agtncb7.apps.googleusercontent.com',
      clientSecretValue: cdk.SecretValue.unsafePlainText('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'),
      scopes: ['profile', 'email', 'openid'],
      attributeMapping: {
        email: cognito.ProviderAttribute.GOOGLE_EMAIL,
        givenName: cognito.ProviderAttribute.GOOGLE_GIVEN_NAME,
        familyName: cognito.ProviderAttribute.GOOGLE_FAMILY_NAME,
      },
    });

    const microsoftProvider = new cognito.UserPoolIdentityProviderOidc(this, 'Microsoft', {
      name: 'Microsoft',
      userPool,
      clientId: "735b7546-3fca-478b-8b61-233c9d8a5003",
      clientSecret: "ofe8Q~g.iGxIWUDGkuXKFUYE.__DYaUiTdQY6dl7",
      scopes: ['openid', 'profile', 'email'],
      attributeRequestMethod : cognito.OidcAttributeRequestMethod.GET,
      issuerUrl: 'https://login.microsoftonline.com/common/v2.0',
      attributeMapping: {
        email: cognito.ProviderAttribute.other('email'),
        givenName: cognito.ProviderAttribute.other('given_name'),
        familyName: cognito.ProviderAttribute.other('family_name'),
      },
    });
    

 
    // Create a user pool client
    const userPoolClient = new cognito.UserPoolClient(this, 'NUserPoolClient', {
      userPool: userPool,
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        callbackUrls: [
          'http://localhost:3000/auth/callback/google',
          'http://localhost:3000/auth/callback/microsoft'
        ],
        logoutUrls: [
          'https://localhost:3000/auth/logout',
          'http://localhost:3000/logout'
        ],
        defaultRedirectUri: 'http://localhost:3000/auth/callback/google',
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
      },

      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.GOOGLE,
        cognito.UserPoolClientIdentityProvider.custom('Microsoft'),
      ],

    });

    // Ensure the client depends on the Google provider
    userPoolClient.node.addDependency(googleProvider);
    userPoolClient.node.addDependency(microsoftProvider);



    // Set up a Cognito hosted domain
    new cognito.UserPoolDomain(this, 'NUserPoolDomain', {
      userPool: userPool,
      cognitoDomain: {
        domainPrefix: 'nibraspool-app', // must be globally unique
      },
      managedLoginVersion: cognito.ManagedLoginVersion.NEWER_MANAGED_LOGIN,
    });

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
    });
  }
}