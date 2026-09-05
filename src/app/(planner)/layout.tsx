import { PlannerNav } from "@/components/planner";

export default function PlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth is enforced in middleware when Supabase env is set.
  return (
    <>
      <PlannerNav />
      <main className="flex-1">{children}</main>
    </>
  );
}
