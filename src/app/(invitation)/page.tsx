import { cookies } from "next/headers";
import { InvitationShell } from "@/components/invitation/InvitationShell";
import {
  firstSearchParam,
  INVITE_COOKIE_NAME,
  normalizeInviteCode,
} from "@/lib/invite";
import {
  UNLOCK_COOKIE_NAME,
  isSitePasswordEnabled,
  isUnlockTokenValid,
} from "@/lib/site-password";

export default async function InvitationHomePage({
  searchParams,
}: PageProps<"/">) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const inviteCode =
    normalizeInviteCode(firstSearchParam(params.invite)) ??
    normalizeInviteCode(cookieStore.get(INVITE_COOKIE_NAME)?.value);

  let initiallyUnlocked = true;

  if (isSitePasswordEnabled()) {
    initiallyUnlocked = await isUnlockTokenValid(
      cookieStore.get(UNLOCK_COOKIE_NAME)?.value,
    );
  }

  return (
    <InvitationShell
      initiallyUnlocked={initiallyUnlocked}
      inviteCode={inviteCode}
    />
  );
}
