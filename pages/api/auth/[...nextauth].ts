import { NextApiRequest, NextApiResponse } from "next"
import NextAuth from "next-auth"
import invariant from "tiny-invariant"

const clientId = process.env.AZURE_DEVOPS_APP_ID
const clientSecret = process.env.AZURE_DEVOPS_CLIENT_SECRET
const scope = process.env.AZURE_DEVOPS_SCOPE
// const callbackUrl = "https://localhost/api/auth/callback/azure-devops"

invariant(clientId && clientSecret && scope)

export default (req: NextApiRequest, res: NextApiResponse) => {
  // console.log("\n=================== REQUEST ===================\n\n", { req })
  // console.log("\n=================== RESPONSE ===================\n\n", { res })

  return NextAuth(req, res, {
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
        },
        userinfo: {
          url: "https://app.vsaex.visualstudio.com/me",
        },
        profile: (profile) => {
          console.log(profile)
          return {
            id: "id1",
            name: "test",
            email: "test@test.com",
            image: "https://image.com/1.jpg",
          }
        },
        clientId,
        clientSecret,
      },
    ],
    theme: {
      colorScheme: "auto",
    },
    callbacks: {
      async jwt({ token }) {
        return token
      },
    },
  })
}
