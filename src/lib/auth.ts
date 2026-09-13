import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";
import type { NextRequest } from "next/server";
import type { Provider } from "next-auth/providers";
import { userFromCredentials } from "./credentials-user";
import { isLoopbackHost, requestPublicOrigin } from "./request-host";
import { requiresTwoFactor } from "./two-factor";
import { userFromTwoFactorGrant } from "./two-factor-service";

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
  Credentials({
    id: "two-factor",
    name: "One-time code",
    credentials: {
      grant: { label: "Grant", type: "text" },
    },
    async authorize(credentials) {
      const grant = credentials?.grant as string | undefined;
      if (!grant) return null;
      return userFromTwoFactorGrant(grant);
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
 * A leftover localhost AUTH_URL on Vercel would rewrite every auth request
 * to http://localhost:3000. Only strip loopback URLs; keep a real public
 * AUTH_URL (production / tunnel) so Host + cookies stay on that origin.
 *
 * Do not customize cookie names. Auth.js defaults pick `authjs.*` on HTTP
 * and `__Secure-` / `__Host-` on HTTPS. Overriding names while also toggling
 * useSecureCookies caused CSRF/session handler 500s on Vercel HTTPS.
 */
for (const key of ["AUTH_URL", "NEXTAUTH_URL"] as const) {
  const raw = process.env[key];
  if (!raw) continue;
  try {
    if (isLoopbackHost(new URL(raw).host)) {
      delete process.env[key];
    }
  } catch {
    delete process.env[key];
  }
}

function authConfig(req?: NextRequest): NextAuthConfig {
  return {
    providers,
    session: { strategy: "jwt" },
    pages: {
      signIn: "/login",
    },
    callbacks: {
      async jwt({ token, user, account }) {
        if (user) {
          // Always replace identity — never merge onto a previous demo JWT.
          token.sub = user.id;
          token.email = user.email;
          token.name = user.name;
          const email = typeof user.email === "string" ? user.email : undefined;
          const completed =
            account?.provider === "two-factor" ||
            ("twoFactorComplete" in user && user.twoFactorComplete === true);
          token.twoFactorPending = completed ? false : requiresTwoFactor(email);
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user && token.sub) {
          session.user.id = token.sub;
          if (typeof token.email === "string") session.user.email = token.email;
          if (typeof token.name === "string") session.user.name = token.name;
        }
        session.twoFactorPending = Boolean(token.twoFactorPending);
        return session;
      },
      async redirect({ url, baseUrl }) {
        const publicOrigin = requestPublicOrigin(req);
        const origin = publicOrigin ?? baseUrl;
        if (url.startsWith("/")) return `${origin}${url}`;
        try {
          const parsed = new URL(url);
          if (publicOrigin && isLoopbackHost(parsed.host)) {
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
