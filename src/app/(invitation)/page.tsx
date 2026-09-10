import { cookies } from "next/headers";
import { InvitationShell } from "@/components/invitation/InvitationShell";
import {
  UNLOCK_COOKIE_NAME,
  isSitePasswordEnabled,
  isUnlockTokenValid,
} from "@/lib/site-password";

export default async function InvitationHomePage() {
  let initiallyUnlocked = true;

  if (isSitePasswordEnabled()) {
    const cookieStore = await cookies();
    initiallyUnlocked = await isUnlockTokenValid(
      cookieStore.get(UNLOCK_COOKIE_NAME)?.value,
    );
  }

  return <InvitationShell initiallyUnlocked={initiallyUnlocked} />;
}
