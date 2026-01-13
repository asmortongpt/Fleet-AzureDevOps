import { Configuration, PublicClientApplication, TokenCache } from "@azure/msal-node";
import axios from "axios";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

interface UserProfile {
  id: string;
  displayName: string;
  mail: string;
}

const config: Configuration = {
  auth: {
    clientId: process.env.CLIENT_ID as string,
    authority: process.env.AUTHORITY as string,
    clientSecret: process.env.CLIENT_SECRET as string,
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel: any, message: string, containsPii: boolean) {
        console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: process.env.LOG_LEVEL as any,
    },
  },
};

const client = new PublicClientApplication(config);
const tokenCache: TokenCache = client.getTokenCache();

export async function getUserProfile(accessToken: string): Promise<UserProfile> {
  try {
    const response = await axios.get("https://graph.microsoft.com/v1.0/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Failed to fetch user profile", error);
    throw error;
  }
}

export async function getToken(): Promise<string> {
  try {
    const accounts = await tokenCache.getAllAccounts();
    const firstAccount = accounts[0];

    const response = await client.acquireTokenSilent({
      scopes: ["User.Read"],
      account: firstAccount,
    });

    return response.accessToken;
  } catch (error) {
    console.error("Failed to get token", error);
    throw error;
  }
}