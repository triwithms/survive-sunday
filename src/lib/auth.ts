import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";
import type { NextRequest } from "next/server";
import type { Provider } from "next-auth/providers";
import { userFromCredentials } from "./credentials-user";
import {
  isIgnoredAuthHost,
  requestPublicOrigin,
  stripIgnoredAuthUrlEnv,
} from "./request-host";

const providers: Provider[] = [
  Credentials({
    id: "credentials",
    name: "Email & Password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = credentials?.email as string | undefined;
      const password = credentials?.password as string | undefined;
      if (!email || !password) return null;
      return userFromCredentials(email, password);
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

/**
 * Auth.js pins AUTH_URL as the request origin (reqWithEnvURL + createActionURL).
 * Leftover localhost or placeholder AUTH_URL (https://example.com) on Vercel
 * rewrites every auth request to the wrong origin and 500s CSRF/session.
 * Strip those; keep a real public AUTH_URL (production / tunnel).
 *
 * Do not customize cookie names. Auth.js defaults pick `authjs.*` on HTTP
 * and `__Secure-` / `__Host-` on HTTPS.
 */
stripIgnoredAuthUrlEnv();

function authConfig(req?: NextRequest): NextAuthConfig {
  return {
    providers,
    session: { strategy: "jwt" },
    pages: {
      signIn: "/login",
    },
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          // Always replace identity — never merge onto a previous demo JWT.
          token.sub = user.id;
          token.email = user.email;
          token.name = user.name;
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user && token.sub) {
          session.user.id = token.sub;
          if (typeof token.email === "string") session.user.email = token.email;
          if (typeof token.name === "string") session.user.name = token.name;
        }
        return session;
      },
      async redirect({ url, baseUrl }) {
        const publicOrigin = requestPublicOrigin(req);
        const origin = publicOrigin ?? baseUrl;
        if (url.startsWith("/")) return `${origin}${url}`;
        try {
          const parsed = new URL(url);
          if (publicOrigin && isIgnoredAuthHost(parsed.host)) {
            return `${publicOrigin}${parsed.pathname}${parsed.search}${parsed.hash}`;
          }
          if (parsed.origin === origin || parsed.origin === baseUrl) {
            return `${origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
          }
        } catch {
          /* fall through */
        }
        return origin;
      },
    },
    trustHost: true,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth((req) =>
  authConfig(req)
);
