import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/admin");
  }

  return (
    <main className="flex-1">
      <section className="mx-auto w-full max-w-3xl px-6 py-16">
        <p className="text-sm tracking-wide text-zinc-500 uppercase">
          Couple access
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Sign in</h1>
        {hasSupabaseEnv() ? (
          <>
            <p className="mt-4 max-w-xl text-zinc-600 dark:text-zinc-400">
              Use the email and password created for the bride and groom in
              Supabase Authentication.
            </p>
            <LoginForm />
          </>
        ) : (
          <p className="mt-4 max-w-xl text-zinc-600 dark:text-zinc-400">
            Couple login is unavailable until Supabase environment variables are
            configured.
          </p>
        )}
      </section>
      <p className="mx-auto max-w-3xl px-6 pb-16 text-sm text-zinc-500">
        <Link href="/" className="underline underline-offset-4">
          Back to invitation
        </Link>
      </p>
    </main>
  );
}
