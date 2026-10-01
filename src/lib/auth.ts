import { NextAuthOptions, DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { supabaseAdmin } from "@/lib/supabase";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    dbId?: string;
  }
}

const ALLOWED_EMAILS = ["i.ds.orlik@gmail.com", "zingelanna5@gmail.com"];

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      if (!ALLOWED_EMAILS.includes(user.email)) {
        return false;
      }
      
      // Upsert user in Supabase
      const { data: existingUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", user.email)
        .single();

      if (!existingUser) {
        await supabaseAdmin.from("users").insert({ email: user.email });
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        // Only run on sign in
        const { data: dbUser } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("email", user.email)
          .single();
        if (dbUser) {
          token.dbId = dbUser.id;
        }
      } else if (!token.dbId && token.email) {
        // Fallback for existing sessions that don't have dbId yet
        const { data: dbUser } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("email", token.email)
          .single();
        if (dbUser) {
          token.dbId = dbUser.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.dbId) {
        session.user.id = token.dbId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/", 
  },
};
