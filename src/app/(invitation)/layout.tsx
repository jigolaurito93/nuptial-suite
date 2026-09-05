import { InvitationNav } from "@/components/invitation";

export default function InvitationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <InvitationNav />
      <main className="flex-1">{children}</main>
    </>
  );
}
