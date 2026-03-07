import { createAuthClient } from "better-auth/react";
import {
  organizationClient,
  twoFactorClient,
  usernameClient,
} from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";

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
    twoFactorClient(),
    passkeyClient(),
    usernameClient(),
  ],
});

export const authClient = client;
