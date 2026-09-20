"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { invitation } from "@/content/invitation";
import { hasSupabaseEnv } from "@/lib/env";
import {
  buildHeadcountPeople,
  headcountSummary,
  mapGuestRow,
  mapHouseholdRow,
  mapWellWishRow,
} from "@/lib/invite";
import { createClient } from "@/lib/supabase/client";
import {
  compareOpenTasks,
  isTaskDone,
  isTaskOverdue,
  mapPlanningTaskRow,
  taskDueCopy,
  tasksOverview,
} from "@/lib/tasks";
import {
  compareVendors,
  formatDisplayDate,
  formatPhp,
  localDateString,
  mapVendorPaymentRow,
  mapVendorRow,
  vendorPaymentTotals,
  vendorStatusLabel,
  vendorsOverview,
} from "@/lib/vendors";
import type {
  GuestRow,
  GuestWithHousehold,
  Household,
  HouseholdRow,
  PlanningTask,
  PlanningTaskRow,
  VendorPaymentRow,
  VendorRow,
  VendorWithPayments,
  WellWish,
  WellWishRow,
} from "@/types";

function daysUntilWedding() {
  const wedding = new Date(invitation.weddingDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weddingDay = new Date(wedding);
  weddingDay.setHours(0, 0, 0, 0);
  return Math.max(
    0,
    Math.round((weddingDay.getTime() - today.getTime()) / 86_400_000),
  );
}

function percent(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function WidgetLink({
  href,
  className,
  label,
  children,
}: {
  href: string;
  className?: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`group flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-[0_10px_28px_-20px_rgba(28,28,26,0.55)] outline-none transition hover:border-accent focus-visible:border-accent motion-safe:hover:-translate-y-0.5 lg:p-4 ${className ?? ""}`}
    >
      {children}
      <span className="mt-auto inline-flex items-center pt-5 text-[0.65rem] tracking-[0.18em] text-muted uppercase transition group-hover:text-foreground lg:pt-3">
        Open
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
          className="ml-1 size-3"
        >
          <path d="M3 8h10M9.5 4.5 13 8l-3.5 3.5" />
        </svg>
      </span>
    </Link>
  );
}

function WidgetEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[0.65rem] tracking-[0.22em] text-muted uppercase">
      {children}
    </p>
  );
}

function WidgetValue({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 text-4xl font-medium tracking-tight text-foreground tabular-nums sm:text-5xl">
      {children}
    </p>
  );
}

function WidgetDetail({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-sm leading-relaxed text-muted">{children}</p>;
}

function StatBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2 text-muted">
        <span className={`size-2.5 rounded-full ${tone}`} />
        {label}
      </span>
      <span className="tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function VendorPreviewCard({
  vendor,
  today,
}: {
  vendor: VendorWithPayments;
  today: string;
}) {
  const totals = vendorPaymentTotals(vendor, today);
  const nextDueLabel = totals.nextDue
    ? `${totals.nextDue.label}${
        totals.nextDue.dueOn
          ? ` · ${formatDisplayDate(totals.nextDue.dueOn)}`
          : ""
      }`
    : null;

  return (
    <Link
      href="/admin/vendors"
      aria-label={`Open ${vendor.companyName}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-background outline-none transition hover:border-accent focus-visible:border-accent motion-safe:hover:-translate-y-0.5"
    >
      <div className="relative flex h-28 items-end bg-accent-soft px-4 py-3">
        <p className="font-display text-2xl font-medium tracking-tight text-foreground">
          {vendor.category}
        </p>
        <span className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full border border-border bg-surface text-muted transition group-hover:border-accent group-hover:text-foreground">
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
            className="size-3.5"
          >
            <path d="M3 8h10M9.5 4.5 13 8l-3.5 3.5" />
          </svg>
        </span>
      </div>
      <div className="flex flex-1 flex-col px-4 py-4">
        <p className="font-display text-xl font-medium tracking-tight text-foreground">
          {vendor.companyName}
        </p>
        <p className="mt-1 text-sm text-muted">{vendor.contactName}</p>
        <p className="mt-4 text-[0.65rem] tracking-[0.16em] text-muted uppercase">
          {vendorStatusLabel(vendor.status)}
          {nextDueLabel ? ` · ${nextDueLabel}` : ""}
        </p>
      </div>
    </Link>
  );
}

export function AdminPage({ displayName }: { displayName: string }) {
  const configured = hasSupabaseEnv();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [guests, setGuests] = useState<GuestWithHousehold[]>([]);
  const [messages, setMessages] = useState<WellWish[]>([]);
  const [vendors, setVendors] = useState<VendorWithPayments[]>([]);
  const [tasks, setTasks] = useState<PlanningTask[]>([]);
  const [loading, setLoading] = useState(configured);
  const daysLeft = daysUntilWedding();

  useEffect(() => {
    if (!configured) return;

    const supabase = createClient();
    let cancelled = false;

    void Promise.all([
      supabase
        .from("households")
        .select("*")
        .order("label", { ascending: true }),
      supabase
        .from("guests")
        .select("*, households(label, invite_code)")
        .order("created_at", { ascending: false }),
      supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("vendors")
        .select("*, vendor_payments(*)")
        .order("created_at", { ascending: false }),
      supabase
        .from("planning_tasks")
        .select("*")
        .order("created_at", { ascending: false }),
    ]).then(
      ([
        householdResult,
        guestResult,
        messageResult,
        vendorResult,
        taskResult,
      ]) => {
        if (cancelled) return;

        if (
          householdResult.error ||
          guestResult.error ||
          messageResult.error ||
          vendorResult.error
        ) {
          setHouseholds([]);
          setGuests([]);
          setMessages([]);
          setVendors([]);
          setTasks([]);
          setLoading(false);
          return;
        }

        const guestRows = (guestResult.data ?? []) as Array<
          GuestRow & {
            households: { label: string; invite_code: string } | null;
          }
        >;

        setHouseholds(
          ((householdResult.data ?? []) as HouseholdRow[]).map(mapHouseholdRow),
        );
        setGuests(
          guestRows.map((row) => ({
            ...mapGuestRow(row),
            householdLabel: row.households?.label ?? "Unknown household",
            householdInviteCode: row.households?.invite_code ?? "",
          })),
        );
        setMessages(
          ((messageResult.data ?? []) as WellWishRow[]).map(mapWellWishRow),
        );
        setVendors(
          (
            (vendorResult.data ?? []) as Array<
              VendorRow & { vendor_payments: VendorPaymentRow[] | null }
            >
          ).map((row) => ({
            ...mapVendorRow(row),
            payments: (row.vendor_payments ?? []).map(mapVendorPaymentRow),
          })),
        );
        setTasks(
          taskResult.error
            ? []
            : ((taskResult.data ?? []) as PlanningTaskRow[]).map(
                mapPlanningTaskRow,
              ),
        );
        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [configured]);

  const summary = useMemo(
    () => headcountSummary(buildHeadcountPeople(guests, households)),
    [guests, households],
  );
  const today = localDateString();
  const overview = useMemo(
    () => vendorsOverview(vendors, today),
    [today, vendors],
  );
  const taskOverview = useMemo(
    () => tasksOverview(tasks, today),
    [tasks, today],
  );
  const previewTasks = useMemo(
    () =>
      tasks
        .filter((task) => !isTaskDone(task))
        .sort((left, right) => compareOpenTasks(left, right, today))
        .slice(0, 5),
    [tasks, today],
  );
  const bookedVendors = vendors.filter(
    (vendor) => vendor.status === "booked" || vendor.status === "completed",
  ).length;
  const previewVendors = useMemo(
    () =>
      [...vendors]
        .sort((left, right) => compareVendors(left, right, today))
        .slice(0, 4),
    [today, vendors],
  );
  const spentPct = percent(overview.paid, overview.contracted);
  const attendingPct = percent(summary.attending, summary.invited);
  const pendingPct = percent(summary.pending, summary.invited);
  const latestMessage = messages[0];
  const display = (value: number) => (loading ? "—" : String(value));

  return (
    <main className="flex-1">
      <div className="mx-auto w-full px-4 py-5 sm:px-5 lg:px-20 lg:py-12">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-3 xl:grid-cols-12">
          <section className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-[0_10px_28px_-20px_rgba(28,28,26,0.55)] md:col-span-2 lg:p-4 xl:col-span-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <WidgetEyebrow>Welcome</WidgetEyebrow>
                <h1 className="font-display mt-3 text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                  Hello {displayName}
                </h1>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
                  {invitation.weddingDateLabel}
                  {" · "}
                  {invitation.venues.ceremony.address}
                </p>
              </div>
              <div className="relative hidden h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-accent-soft sm:block">
                <Image
                  src={invitation.venues.ceremony.image.src}
                  alt={invitation.venues.ceremony.image.alt}
                  fill
                  unoptimized
                  sizes="96px"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-[0.65rem] tracking-[0.18em] uppercase">
              <Link
                href="/"
                className="rounded-lg border border-navy bg-navy px-4 py-2 text-background transition hover:bg-transparent hover:text-navy"
              >
                View invitation
              </Link>
              <Link
                href="/admin/invitation"
                className="inline-flex items-center px-0 py-2 text-muted underline decoration-border underline-offset-4 transition hover:text-foreground hover:decoration-accent"
              >
                Invitation editor
              </Link>
            </div>
          </section>

          <WidgetLink
            href="/admin/tasks"
            label="Open tasks"
            className="bg-accent-soft/80 xl:col-span-2"
          >
            <WidgetEyebrow>Upcoming wedding</WidgetEyebrow>
            <WidgetValue>{daysLeft}</WidgetValue>
            <WidgetDetail>Days to {invitation.weddingDateLabel}</WidgetDetail>
          </WidgetLink>

          <WidgetLink
            href="/admin/budget"
            label="Open budget"
            className="xl:col-span-2"
          >
            <WidgetEyebrow>Budget</WidgetEyebrow>
            <WidgetValue>{loading ? "—" : `${spentPct}%`}</WidgetValue>
            <WidgetDetail>
              {loading
                ? "Vendor spend"
                : overview.contracted > 0
                  ? `${formatPhp(overview.paid)} of ${formatPhp(overview.contracted)}`
                  : "No contracts yet"}
            </WidgetDetail>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-navy"
                style={{ width: `${loading ? 0 : spentPct}%` }}
              />
            </div>
          </WidgetLink>

          <WidgetLink
            href="/admin/guests"
            label="Open guest list"
            className="xl:col-span-3"
          >
            <WidgetEyebrow>Guest list</WidgetEyebrow>
            <WidgetValue>{display(summary.invited)}</WidgetValue>
            <WidgetDetail>
              {loading
                ? "Headcount"
                : `${summary.attending} attending · ${summary.pending} pending`}
            </WidgetDetail>
          </WidgetLink>

          <section className="rounded-2xl border border-border bg-surface p-4 shadow-[0_10px_28px_-20px_rgba(28,28,26,0.55)] md:col-span-2 lg:p-4 xl:col-span-12">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <WidgetEyebrow>Vendor team</WidgetEyebrow>
                <p className="text-sm text-muted">
                  {loading
                    ? "Contacts and payments"
                    : `${bookedVendors}/${vendors.length} booked`}
                </p>
              </div>
              <Link
                href="/admin/vendors"
                className="text-[0.65rem] tracking-[0.18em] text-muted uppercase transition hover:text-foreground"
              >
                View all
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {loading ? (
                Array.from({ length: 4 }, (_, index) => (
                  <div
                    key={index}
                    className="h-52 animate-pulse rounded-xl border border-border bg-background"
                  />
                ))
              ) : previewVendors.length === 0 ? (
                <Link
                  href="/admin/vendors"
                  className="flex min-h-40 flex-col justify-between rounded-xl border border-border bg-background p-4 outline-none transition hover:border-accent focus-visible:border-accent sm:col-span-2 lg:col-span-4"
                >
                  <div>
                    <p className="font-display text-2xl font-medium tracking-tight text-foreground">
                      No vendors yet
                    </p>
                    <p className="mt-2 text-sm text-muted">
                      Add contacts, roles, and payment schedules.
                    </p>
                  </div>
                  <span className="text-[0.65rem] tracking-[0.18em] text-muted uppercase">
                    Open
                  </span>
                </Link>
              ) : (
                previewVendors.map((vendor) => (
                  <VendorPreviewCard
                    key={vendor.id}
                    vendor={vendor}
                    today={today}
                  />
                ))
              )}
            </div>
          </section>

          <WidgetLink
            href="/admin/households"
            label="Open households"
            className="xl:col-span-4"
          >
            <WidgetEyebrow>Households</WidgetEyebrow>
            <WidgetValue>{display(households.length)}</WidgetValue>
            <WidgetDetail>
              Invitation cards with unique links for named guests and plus-ones.
            </WidgetDetail>
          </WidgetLink>

          <WidgetLink
            href="/admin/messages"
            label="Open messages"
            className="xl:col-span-4"
          >
            <WidgetEyebrow>Well-wishes</WidgetEyebrow>
            <WidgetValue>{display(messages.length)}</WidgetValue>
            <WidgetDetail>
              {loading
                ? "Notes from the invitation"
                : latestMessage
                  ? `${latestMessage.fullName}: ${latestMessage.message}`
                  : "No notes yet"}
            </WidgetDetail>
          </WidgetLink>

          <WidgetLink
            href="/admin/tasks"
            label="Open tasks"
            className="h-full bg-accent-soft/80 md:col-span-2 xl:col-span-4 xl:row-span-2"
          >
            <WidgetEyebrow>Tasks</WidgetEyebrow>
            <WidgetValue>{display(taskOverview.openCount)}</WidgetValue>
            <WidgetDetail>
              {loading
                ? "Open checklist items"
                : taskOverview.overdueCount > 0
                  ? `${taskOverview.overdueCount} overdue · ${taskOverview.doneCount} done`
                  : taskOverview.next
                    ? `Next: ${taskOverview.next.title}`
                    : tasks.length === 0
                      ? "No checklist yet"
                      : "All caught up"}
            </WidgetDetail>
            {loading ? (
              <div className="mt-6 space-y-3">
                {Array.from({ length: 4 }, (_, index) => (
                  <div
                    key={index}
                    className="h-10 animate-pulse rounded-lg bg-surface/80"
                  />
                ))}
              </div>
            ) : previewTasks.length > 0 ? (
              <ul className="mt-6 divide-y divide-border border-y border-border">
                {previewTasks.map((task) => {
                  const overdue = isTaskOverdue(task, today);
                  const dueCopy = taskDueCopy(task, today);
                  return (
                    <li key={task.id} className="py-3">
                      <p className="truncate text-sm text-foreground">
                        {task.title}
                      </p>
                      <p
                        className={`mt-1 truncate text-xs ${
                          overdue ? "text-red-800" : "text-muted"
                        }`}
                      >
                        {task.category}
                        {dueCopy ? ` · ${dueCopy}` : ""}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </WidgetLink>

          <WidgetLink
            href="/admin/guests"
            label="Open RSVP breakdown"
            className="xl:col-span-4"
          >
            <div className="px-3 lg:px-6">
              <WidgetEyebrow>Guests</WidgetEyebrow>
              <div className="mt-5 flex items-center gap-6">
                <div
                  className="relative size-28 shrink-0 rounded-full"
                  style={{
                    background:
                      !loading && summary.invited > 0
                        ? `conic-gradient(var(--accent) 0 ${attendingPct}%, #c4b59a ${attendingPct}% ${attendingPct + pendingPct}%, #ddd9d0 ${attendingPct + pendingPct}% 100%)`
                        : "var(--border)",
                  }}
                  aria-hidden="true"
                >
                  <div className="absolute inset-4 rounded-full bg-surface" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <StatBar
                    label="Attending"
                    value={loading ? 0 : summary.attending}
                    tone="bg-accent"
                  />
                  <StatBar
                    label="Pending"
                    value={loading ? 0 : summary.pending}
                    tone="bg-[#c4b59a]"
                  />
                  <StatBar
                    label="Declining"
                    value={loading ? 0 : summary.declining}
                    tone="bg-border"
                  />
                </div>
              </div>
            </div>
          </WidgetLink>

          <WidgetLink
            href="/admin/budget"
            label="Open budget breakdown"
            className="xl:col-span-4"
          >
            <WidgetEyebrow>Spend</WidgetEyebrow>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted">Paid</p>
                <p className="mt-1 text-2xl font-medium tabular-nums">
                  {loading ? "—" : formatPhp(overview.paid)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted">Remaining</p>
                <p className="mt-1 text-2xl font-medium tabular-nums">
                  {loading ? "—" : formatPhp(overview.remaining)}
                </p>
              </div>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-border">
              <div className="flex h-full">
                <div
                  className="h-full bg-navy"
                  style={{ width: `${loading ? 0 : spentPct}%` }}
                />
                <div
                  className="h-full bg-[#c4b59a]"
                  style={{
                    width: `${loading ? 0 : percent(overview.remaining, overview.contracted)}%`,
                  }}
                />
              </div>
            </div>
            <WidgetDetail>
              {overview.overdueCount > 0
                ? `${overview.overdueCount} overdue payment${overview.overdueCount === 1 ? "" : "s"}`
                : "Paid, remaining, and contracted vendor totals"}
            </WidgetDetail>
          </WidgetLink>

          <WidgetLink
            href="/admin/invitation"
            label="Open invitation editor"
            className="xl:col-span-4"
          >
            <WidgetEyebrow>Invitation</WidgetEyebrow>
            <p className="font-display mt-3 text-2xl font-medium tracking-tight text-foreground">
              Public page
            </p>
            <WidgetDetail>
              Copy, venues, and schedule stay in the invitation for now.
            </WidgetDetail>
          </WidgetLink>
        </div>
      </div>
    </main>
  );
}
