"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="h-5 w-5 animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        {session.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={session.user.name ?? "User"}
            className="h-6 w-6 rounded-full"
            src={session.user.image}
          />
        ) : null}
        <span className="hidden text-sm text-muted-foreground sm:inline">
          {session.user.name}
        </span>
        <Button onClick={() => signOut()} size="sm" variant="secondary">
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={() => signIn("discord")} size="sm" variant="secondary">
      Sign in with Discord
    </Button>
  );
}
