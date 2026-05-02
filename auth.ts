import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

function getAllowedOwnerEmails() {
  return new Set(
    (process.env.OWNER_GOOGLE_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    })
  ],
  session: {
    strategy: "jwt"
  },
  trustHost: true,
  callbacks: {
    async signIn({ profile }) {
      const allowedEmails = getAllowedOwnerEmails();
      const profileEmail = profile?.email?.toLowerCase();

      if (!profileEmail || !profile?.email_verified || allowedEmails.size === 0) {
        return false;
      }

      return allowedEmails.has(profileEmail);
    },
    async jwt({ token, profile }) {
      if (profile?.sub) {
        token.sub = profile.sub;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      return session;
    }
  }
});
