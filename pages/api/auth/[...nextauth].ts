import NextAuth from "next-auth"
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
})
