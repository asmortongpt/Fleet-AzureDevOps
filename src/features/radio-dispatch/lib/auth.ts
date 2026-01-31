import { NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: 'openid profile email User.Read',
        },
      },
    }),
  ],

  callbacks: {
    async jwt({ token, account, profile }: { token: any; account: any; profile: any }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account?.access_token;
        token.idToken = account?.id_token;
      }
      if (profile) {
        token.role = profile?.role || 'viewer';
        token.organizationId = profile?.organizationId;
      }
      return token;
    },

    async session({ session, token }: { session: any; token: any }) {
      // Send properties to the client
      session.accessToken = token?.accessToken as string;
      session.user.role = token?.role as string;
      session.user.organizationId = token?.organizationId as string;
      return session;
    },

    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Redirect to dashboard after sign in
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      return baseUrl + '/dashboard';
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 60 * 60, // 1 hour
  },

  secret: process.env.NEXTAUTH_SECRET,

  // Cookie configuration for basePath support
  cookies: {
    sessionToken: {
      name: '__Secure-next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/dispatch',
        secure: true,
      },
    },
    callbackUrl: {
      name: '__Secure-next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/dispatch',
        secure: true,
      },
    },
    csrfToken: {
      name: '__Host-next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/dispatch',
        secure: true,
      },
    },
    pkceCodeVerifier: {
      name: '__Secure-next-auth.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/dispatch',
        secure: true,
        maxAge: 900, // 15 minutes
      },
    },
    state: {
      name: '__Secure-next-auth.state',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/dispatch',
        secure: true,
        maxAge: 900, // 15 minutes
      },
    },
    nonce: {
      name: '__Secure-next-auth.nonce',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/dispatch',
        secure: true,
      },
    },
  },
};

// Type augmentation for NextAuth
declare module 'next-auth' {
  interface Session {
    accessToken: string;
    user: {
      role: string;
      organizationId: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role: string;
    organizationId: string;
  }

  interface Profile {
    role?: string;
    organizationId?: string;
    name?: string;
    email?: string;
    picture?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    idToken?: string;
    role?: string;
    organizationId?: string;
  }
}
