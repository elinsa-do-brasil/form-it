import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

import { ac, owner, admin, member } from "@/server/permissions";

const client = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL,
  plugins: [
    organizationClient({
      ac,
      roles: {
        owner,
        admin,
        member,
      },
    }),
  ],
});

export const authClient = client;
