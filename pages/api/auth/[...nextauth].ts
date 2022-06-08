import NextAuth, { TokenSet } from "next-auth"
import { TokenEndpointHandler } from "next-auth/providers"
import invariant from "tiny-invariant"

const clientId = process.env.AZURE_DEVOPS_APP_ID
const clientSecret = process.env.AZURE_DEVOPS_CLIENT_SECRET
const scope = process.env.AZURE_DEVOPS_SCOPE

invariant(
  clientId && clientSecret && scope,
  "Check environment variables for Azure DevOps provider"
)

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
          const tokens = await makeTokenRequest(context)
          return { tokens }
        },
      },
      userinfo: {
        url: "https://app.vsaex.visualstudio.com/me",
        async request(context) {
          console.log({ userInfoRequest: { tokens: context.tokens } })
          return {
            id: "nawok",
            name: "Pavel Fomchenkov",
            email: "hello@pavel.codes",
            image: "https://avatars.githubusercontent.com/u/159773?s=120&v=4",
          }
        },
      },
      profile: (profile) => {
        return {
          id: profile.id,
          name: profile.name,
          email: profile.name,
          image: profile.image,
        }
      },
      clientId,
      clientSecret,
    },
  ],
})

interface TokenRequestContext {
  params: { code?: string; state?: string }
  provider: {
    token?: string | TokenEndpointHandler | undefined
    clientSecret?: string
    callbackUrl?: string
  }
}

async function makeTokenRequest(
  context: TokenRequestContext
): Promise<TokenSet> {
  const { url } = context.provider.token as TokenEndpointHandler
  invariant(url, "Token URL is not set")
  const body = createTokenRequestBody(context)
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": body.length.toString(),
    },
    method: "POST",
    body,
  })
  const tokenResponse = await response.json()
  return tokenResponse as TokenSet
}

function createTokenRequestBody(context: TokenRequestContext) {
  const clientSecret = context.provider.clientSecret as string
  const callbackUrl = context.provider.callbackUrl as string
  const code = context.params.code as string

  const bodyParams = new URLSearchParams({
    client_assertion_type:
      "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    client_assertion: clientSecret,
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: code,
    redirect_uri: callbackUrl,
  })

  return bodyParams.toString()
}
