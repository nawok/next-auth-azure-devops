import NextAuth, { Profile, TokenSet } from "next-auth"
import {
  TokenEndpointHandler,
  UserinfoEndpointHandler,
} from "next-auth/providers"

const clientId = process.env.AZURE_DEVOPS_APP_ID
const clientSecret = process.env.AZURE_DEVOPS_CLIENT_SECRET
const scope = process.env.AZURE_DEVOPS_SCOPE

export default NextAuth({
  providers: [
    {
      id: "azure-devops",
      name: "Azure DevOps",
      type: "oauth",
      authorization: {
        url: "https://app.vssps.visualstudio.com/oauth2/authorize",
        params: {
          scope,
          response_type: "Assertion",
        },
      },
      token: {
        url: "https://app.vssps.visualstudio.com/oauth2/token",
        async request(context) {
          return { tokens: await makeTokenRequest(context) }
        },
      },
      userinfo: {
        url: "https://app.vssps.visualstudio.com/_apis/profile/profiles/me?details=true&coreAttributes=Avatar&api-version=6.0",
        async request(context) {
          return await makeUserInfoRequest(context)
        },
      },
      async profile(profile: AzureDevOpsProfile) {
        return {
          id: profile.id,
          name: profile.displayName,
          email: profile.emailAddress,
          image: `data:image/jpeg;base64,${profile.coreAttributes.Avatar.value.value}`,
        }
      },
      clientId,
      clientSecret,
    },
  ],
})

// USER INFO

interface AzureDevOpsProfile extends Profile {
  id: string
  displayName: string
  emailAddress: string
  coreAttributes: {
    Avatar: {
      value: {
        value: string
      }
    }
  }
}

async function makeUserInfoRequest(
  context: UserInfoRequestContext
): Promise<AzureDevOpsProfile> {
  const accessToken = context.tokens.access_token as string
  const userInfoEndpoint = context.provider.userinfo as UserinfoEndpointHandler
  const response = await fetch(userInfoEndpoint.url as string, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  return response.json()
}

interface UserInfoRequestContext {
  tokens: TokenSet
  provider: {
    userinfo?: string | UserinfoEndpointHandler
  }
}

// TOKEN

async function makeTokenRequest(
  context: TokenRequestContext
): Promise<TokenSet> {
  const tokenEndpoint = context.provider.token as TokenEndpointHandler
  const response = await fetch(tokenEndpoint.url as string, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
    body: createTokenRequestBody(context),
  })
  const tokenResponse = await response.json()
  return tokenResponse as TokenSet
}

interface TokenRequestContext {
  params: { code?: string; state?: string }
  provider: {
    token?: string | TokenEndpointHandler
    clientSecret?: string
    callbackUrl?: string
  }
}

function createTokenRequestBody(context: TokenRequestContext) {
  const clientSecret = context.provider.clientSecret as string
  const callbackUrl = context.provider.callbackUrl as string
  const code = context.params.code as string
  return new URLSearchParams({
    client_assertion_type:
      "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    client_assertion: clientSecret,
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: code,
    redirect_uri: callbackUrl,
  })
}
