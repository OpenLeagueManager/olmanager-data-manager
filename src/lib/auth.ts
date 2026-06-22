import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { isMaintainer } from "./permissions";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Discord({
      clientId: process.env.AUTH_DISCORD_ID,
      clientSecret: process.env.AUTH_DISCORD_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.isMaintainer = isMaintainer(session);
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
});
