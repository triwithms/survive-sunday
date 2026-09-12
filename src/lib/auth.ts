import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";
import type { NextRequest } from "next/server";
import type { Provider } from "next-auth/providers";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

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
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.passwordHash) return null;
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return null;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      };
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
 * A tunnel https AUTH_URL then marks cookies Secure / __Secure- / __Host-,
 * so they never stick on http://localhost:3000 — QA gets bounced to /join.
 *
 * AUTH_TRUST_HOST=true (and trustHost: true) → drop AUTH_URL so the incoming
 * Host + x-forwarded-proto win. Localhost stays HTTP/non-Secure; the
 * loca.lt tunnel stays HTTPS/Secure. AUTH_URL in .env is the documented
 * default / fallback when AUTH_TRUST_HOST is unset.
 */
const trustHost =
  process.env.AUTH_TRUST_HOST === "true" ||
  process.env.AUTH_TRUST_HOST === "1" ||
  true;

if (trustHost) {
  delete process.env.AUTH_URL;
  delete process.env.NEXTAUTH_URL;
}

function requestIsHttps(req?: NextRequest | Request): boolean {
  if (req) {
    const forwarded = req.headers.get("x-forwarded-proto");
    if (forwarded) return forwarded.split(",")[0].trim() === "https";
    try {
      return new URL(req.url).protocol === "https:";
    } catch {
      /* fall through */
    }
  }
  const fallback = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "";
  return fallback.startsWith("https://");
}

/** Stable names (no __Secure-/__Host- prefix) so HTTP + HTTPS share cookies. */
function cookieOptions(secure: boolean) {
  return {
    sessionToken: {
      name: "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure,
      },
    },
    callbackUrl: {
      name: "authjs.callback-url",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure,
      },
    },
    csrfToken: {
      name: "authjs.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure,
      },
    },
  };
}

function authConfig(req?: NextRequest): NextAuthConfig {
  const secure = requestIsHttps(req);
  return {
    providers,
    session: { strategy: "jwt" },
    pages: {
      signIn: "/login",
    },
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.sub = user.id;
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user && token.sub) {
          session.user.id = token.sub;
        }
        return session;
      },
    },
    trustHost: true,
    useSecureCookies: secure,
    cookies: cookieOptions(secure),
    secret: process.env.AUTH_SECRET,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth((req) =>
  authConfig(req)
);
