import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { AdminSectionHeading } from "@/components/admin/AdminSectionHeading";
import { adminLinkClassName } from "@/components/admin/formStyles";
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
    <div className="admin-shell flex min-h-full flex-1 flex-col">
      <main className="flex-1">
        <section className="mx-auto w-full max-w-3xl px-6 py-16">
          <AdminSectionHeading
            heading="h1"
            eyebrow="Couple access"
            title="Sign in"
            description={
              hasSupabaseEnv()
                ? "Use the email and password created for the bride and groom in Supabase Authentication."
                : "Couple login is unavailable until Supabase environment variables are configured."
            }
          />
          {hasSupabaseEnv() ? <LoginForm /> : null}
        </section>
        <p className="mx-auto max-w-3xl px-6 pb-16">
          <Link href="/" className={adminLinkClassName}>
            Back to invitation
          </Link>
        </p>
      </main>
    </div>
  );
}
