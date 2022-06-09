import NextAuth from "next-auth"
import {
  TokenEndpointHandler,
  UserinfoEndpointHandler,
} from "next-auth/providers"
import { AzureDevOpsProfile } from "../../providers/azure-devops"

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
          const tokenEndpoint = context.provider.token as TokenEndpointHandler
          const response = await fetch(tokenEndpoint.url as string, {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            method: "POST",
            body: new URLSearchParams({
              client_assertion_type:
                "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
              client_assertion: context.provider.clientSecret as string,
              grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
              assertion: context.params.code as string,
              redirect_uri: context.provider.callbackUrl,
            }),
          })
          return { tokens: await response.json() }
        },
      },
      userinfo: {
        url: "https://app.vssps.visualstudio.com/_apis/profile/profiles/me?details=true&coreAttributes=Avatar&api-version=6.0",
        async request(context) {
          const accessToken = context.tokens.access_token as string
          const userInfoEndpoint = context.provider
            .userinfo as UserinfoEndpointHandler
          const response = await fetch(userInfoEndpoint.url as string, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          })
          return response.json()
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
