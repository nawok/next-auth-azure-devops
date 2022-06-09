import NextAuth, { User } from "next-auth"
import { JWT } from "next-auth/jwt"
import AzureDevOps from "../../providers/azure-devops"

const clientId = process.env.AZURE_DEVOPS_APP_ID as string
const clientSecret = process.env.AZURE_DEVOPS_CLIENT_SECRET as string
const scope = process.env.AZURE_DEVOPS_SCOPE

export default NextAuth({
  providers: [
    AzureDevOps({
      clientId,
      clientSecret,
      scope,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        const accessToken = account.access_token as string
        const accessTokenExpires = (account.expires_at as number) * 1000
        const refreshToken = account.refresh_token as string
        return { accessToken, accessTokenExpires, refreshToken, user }
      }
      if (Date.now() < token.accessTokenExpires) {
        return token
      }
      return refreshAccessToken(token)
    },
    async session({ session, token }) {
      session.user = token.user as User
      session.accessToken = token.accessToken
      session.error = token.error
      return session
    },
  },
})

async function refreshAccessToken(token: JWT) {
  try {
    const url = "https://app.vssps.visualstudio.com/oauth2/token"
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
      body: new URLSearchParams({
        client_assertion_type:
          "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
        client_assertion: clientSecret,
        grant_type: "refresh_token",
        assertion: token.refreshToken,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/azure-devops`,
      }),
    })

    const newToken = await response.json()

    if (!response.ok) {
      throw newToken
    }

    const accessToken = newToken.access_token as string
    const accessTokenExpires = Date.now() + newToken.expires_in * 1000
    const refreshToken = newToken.refresh_token as string
    return {
      ...token,
      accessToken,
      accessTokenExpires,
      refreshToken,
    }
  } catch (error) {
    console.error(error)
    return {
      ...token,
      error: "RefreshAccessTokenError",
    }
  }
}
