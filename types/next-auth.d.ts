import "next-auth";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id?: string;
  }

  interface Session extends DefaultSession {
    user?: { id?: string } & DefaultSession["user"];
  }
}
