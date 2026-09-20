"use client";

import { useCallback, useEffect, useState } from "react";
import { clearInviteCookie, persistInviteCookie } from "@/lib/invite";
import type { PublicInvite } from "@/types";

type PublicInviteState = {
  invite: PublicInvite | null;
  loading: boolean;
  refresh: () => void;
};

type FetchResult = {
  code: string;
  invite: PublicInvite | null;
};

export function usePublicInvite(inviteCode: string | null): PublicInviteState {
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState<FetchResult | null>(null);

  const refresh = useCallback(() => {
    setNonce((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!inviteCode) return;

    const controller = new AbortController();

    void fetch(`/api/invite?code=${encodeURIComponent(inviteCode)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Invitation not found.");
        return (await response.json()) as PublicInvite;
      })
      .then((data) => {
        persistInviteCookie(inviteCode);
        setResult({ code: inviteCode, invite: data });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        clearInviteCookie();
        setResult({ code: inviteCode, invite: null });
      });

    return () => controller.abort();
  }, [inviteCode, nonce]);

  const invite =
    inviteCode && result?.code === inviteCode ? result.invite : null;
  const loading = Boolean(inviteCode) && result?.code !== inviteCode;

  return { invite, loading, refresh };
}
