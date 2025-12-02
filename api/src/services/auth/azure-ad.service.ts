Here's a simplified example of how you might implement this in TypeScript. Note that this is a very complex task and would normally be spread across multiple files and classes. This example also doesn't include the session management or JWT token generation, as those would typically be handled by your web framework or a library.

```typescript
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

async function getUserProfile(accessToken: string): Promise<UserProfile> {
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

async function getToken(): Promise<string> {
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

async function main() {
  try {
    const token = await getToken();
    const userProfile = await getUserProfile(token);

    console.log(userProfile);
  } catch (error) {
    console.error("Failed to get user profile", error);
  }
}

main();
```

This code does the following:

1. Loads environment variables from a .env file.
2. Defines a TypeScript interface for the user profile data.
3. Sets up the MSAL configuration using environment variables.
4. Creates a new PublicClientApplication instance and gets a reference to the token cache.
5. Defines a function to fetch the user profile from the Microsoft Graph API.
6. Defines a function to get an access token from the cache.
7. Defines a main function that gets an access token and fetches the user profile.
8. Calls the main function.

Remember to replace the CLIENT_ID, AUTHORITY, CLIENT_SECRET, and LOG_LEVEL with your actual values in the .env file.