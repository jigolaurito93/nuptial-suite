"use client";

import { useEffect, useState } from "react";
import { hasSupabaseEnv } from "@/lib/env";
import { mapWellWishRow } from "@/lib/invite";
import { createClient } from "@/lib/supabase/client";
import type { WellWish, WellWishRow } from "@/types";

export function MessagesSection() {
  const configured = hasSupabaseEnv();
  const [messages, setMessages] = useState<WellWish[]>([]);
  const [loading, setLoading] = useState(configured);
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!configured) return;

    const supabase = createClient();
    let cancelled = false;

    void supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setErrorMessage("Unable to load messages. Sign in and try again.");
          setMessages([]);
          setLoading(false);
          return;
        }

        setMessages(((data ?? []) as WellWishRow[]).map(mapWellWishRow));
        setErrorMessage("");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [configured, reloadToken]);

  async function onDelete(message: WellWish) {
    if (!window.confirm(`Delete the note from ${message.fullName}?`)) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", message.id);
    if (error) {
      setErrorMessage("Unable to delete this note.");
      return;
    }
    setReloadToken((value) => value + 1);
  }

  return (
    <section
      id="messages"
      className="scroll-mt-24 border-t border-zinc-200 dark:border-zinc-800"
    >
      <div className="mx-auto w-full max-w-3xl px-6 py-16">
        <p className="text-sm tracking-wide text-zinc-500 uppercase">
          Messages
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          Well-wishes
        </h2>
        <p className="mt-4 max-w-xl text-zinc-600 dark:text-zinc-400">
          Notes from visitors who opened the site without a personal invitation
          link. These are not RSVPs.
        </p>

        {!configured ? (
          <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
            Connect Supabase to read well-wishes.
          </p>
        ) : (
          <>
            {errorMessage ? (
              <p className="mt-6 text-sm text-red-700" role="alert">
                {errorMessage}
              </p>
            ) : null}

            <div className="mt-10 divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              {loading ? (
                <p className="py-6 text-sm text-zinc-500">Loading notes…</p>
              ) : messages.length === 0 ? (
                <p className="py-6 text-sm text-zinc-500">
                  No well-wishes yet.
                </p>
              ) : (
                messages.map((message) => (
                  <article key={message.id} className="py-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-medium tracking-tight">
                          {message.fullName}
                        </h3>
                        {message.contactNumber ? (
                          <p className="mt-1 text-sm text-zinc-500">
                            {message.contactNumber}
                          </p>
                        ) : null}
                        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                          {message.message}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void onDelete(message)}
                        className="text-sm underline underline-offset-4"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
