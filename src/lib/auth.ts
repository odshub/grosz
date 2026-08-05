import { NextAuthOptions, DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { supabaseAdmin } from "@/lib/supabase";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
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
    async session({ session }) {
      if (session.user?.email) {
        const { data: dbUser } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("email", session.user.email)
          .single();
          
        if (dbUser) {
          session.user.id = dbUser.id;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/", 
  },
};
