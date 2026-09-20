"use client";

import { useEffect, useState } from "react";
import { AdminSectionHeading } from "@/components/admin/AdminSectionHeading";
import {
  adminErrorClassName,
  adminItemTitleClassName,
  adminLinkClassName,
  adminListClassName,
  adminMutedTextClassName,
  adminSectionClassName,
  adminSectionInnerClassName,
} from "@/components/admin/formStyles";
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
    <section className={adminSectionClassName}>
      <div className={adminSectionInnerClassName}>
        <AdminSectionHeading
          heading="h1"
          eyebrow="Messages"
          title="Well-wishes"
          description="Notes from visitors who opened the site without a personal invitation link. These are not RSVPs."
        />

        {!configured ? (
          <p className={`mt-8 ${adminMutedTextClassName}`}>
            Connect Supabase to read well-wishes.
          </p>
        ) : (
          <>
            {errorMessage ? (
              <p className={`mt-6 ${adminErrorClassName}`} role="alert">
                {errorMessage}
              </p>
            ) : null}

            <div className={`mt-10 ${adminListClassName}`}>
              {loading ? (
                <p className={`py-6 ${adminMutedTextClassName}`}>
                  Loading notes…
                </p>
              ) : messages.length === 0 ? (
                <p className={`py-6 ${adminMutedTextClassName}`}>
                  No well-wishes yet.
                </p>
              ) : (
                messages.map((message) => (
                  <article key={message.id} className="py-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className={adminItemTitleClassName}>
                          {message.fullName}
                        </h3>
                        {message.contactNumber ? (
                          <p className={`mt-1 ${adminMutedTextClassName}`}>
                            {message.contactNumber}
                          </p>
                        ) : null}
                        <p className={`mt-3 ${adminMutedTextClassName}`}>
                          {message.message}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void onDelete(message)}
                        className={adminLinkClassName}
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
