import Link from "next/link";
import { PlaceholderPage } from "@/components/ui";

export default function LoginPage() {
  return (
    <main className="flex-1">
      <PlaceholderPage
        title="Couple login"
        description="Bride and groom sign in here, then go to /admin to plan the wedding. Supabase Auth will be wired once env keys are set."
      />
      <p className="mx-auto max-w-3xl px-6 pb-16 text-sm text-zinc-500">
        <Link href="/" className="underline underline-offset-4">
          Back to invitation
        </Link>
      </p>
    </main>
  );
}
