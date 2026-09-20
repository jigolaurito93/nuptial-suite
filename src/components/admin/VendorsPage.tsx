"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminSectionHeading } from "@/components/admin/AdminSectionHeading";
import {
  adminErrorClassName,
  adminInputClassName,
  adminItemTitleClassName,
  adminLabelClassName,
  adminLinkClassName,
  adminListClassName,
  adminMutedTextClassName,
  adminPrimaryButtonClassName,
  adminSecondaryButtonClassName,
} from "@/components/admin/formStyles";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import {
  OTHER_VENDOR_CATEGORY,
  VENDOR_CATEGORIES,
  compareVendors,
  defaultPaymentLabel,
  formatDisplayDate,
  formatPhp,
  isPresetCategory,
  localDateString,
  mapVendorPaymentRow,
  mapVendorRow,
  parseAmount,
  paymentStatusCopy,
  sortedPayments,
  telHref,
  vendorPaymentTotals,
  vendorStatusLabel,
  vendorsOverview,
} from "@/lib/vendors";
import type {
  VendorPayment,
  VendorPaymentRow,
  VendorRow,
  VendorStatus,
  VendorWithPayments,
} from "@/types";

type FormMode = "create" | "edit";
type CategoryFilter = "all" | string;

type PaymentDraft = {
  key: string;
  id?: string;
  label: string;
  amount: string;
  dueOn: string;
  paidOn: string;
};

function newDraftKey() {
  return crypto.randomUUID();
}

function emptyPaymentDraft(index: number): PaymentDraft {
  return {
    key: newDraftKey(),
    label: defaultPaymentLabel(index),
    amount: "",
    dueOn: "",
    paidOn: "",
  };
}

function draftsFromPayments(payments: VendorPayment[]): PaymentDraft[] {
  return sortedPayments(payments).map((payment) => ({
    key: payment.id,
    id: payment.id,
    label: payment.label,
    amount: String(payment.amount),
    dueOn: payment.dueOn ?? "",
    paidOn: payment.paidOn ?? "",
  }));
}

export function VendorsPage() {
  const configured = hasSupabaseEnv();
  const [vendors, setVendors] = useState<VendorWithPayments[]>([]);
  const [loading, setLoading] = useState(configured);
  const [errorMessage, setErrorMessage] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [mode, setMode] = useState<FormMode>("create");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const today = localDateString();

  const [category, setCategory] = useState<string>(VENDOR_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<VendorStatus>("inquiry");
  const [contractAmount, setContractAmount] = useState("");
  const [paymentDrafts, setPaymentDrafts] = useState<PaymentDraft[]>([]);

  useEffect(() => {
    if (!configured) return;

    const supabase = createClient();
    let cancelled = false;

    void supabase
      .from("vendors")
      .select("*, vendor_payments(*)")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setErrorMessage("Unable to load vendors. Sign in and try again.");
          setVendors([]);
          setLoading(false);
          return;
        }

        const rows = (data ?? []) as Array<
          VendorRow & { vendor_payments: VendorPaymentRow[] | null }
        >;
        setVendors(
          rows.map((row) => ({
            ...mapVendorRow(row),
            payments: (row.vendor_payments ?? []).map(mapVendorPaymentRow),
          })),
        );
        setErrorMessage("");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [configured, reloadToken]);

  const usedCategories = useMemo(() => {
    return [...new Set(vendors.map((vendor) => vendor.category))].sort(
      (left, right) => left.localeCompare(right),
    );
  }, [vendors]);

  const activeCategoryFilter =
    categoryFilter === "all" ||
    vendors.some((vendor) => vendor.category === categoryFilter)
      ? categoryFilter
      : "all";

  const filteredVendors = useMemo(() => {
    const list =
      activeCategoryFilter === "all"
        ? vendors
        : vendors.filter((vendor) => vendor.category === activeCategoryFilter);
    return [...list].sort((left, right) => compareVendors(left, right, today));
  }, [activeCategoryFilter, today, vendors]);

  const overview = useMemo(
    () => vendorsOverview(vendors, today),
    [today, vendors],
  );

  function reload() {
    setReloadToken((value) => value + 1);
  }

  function resetForm() {
    setCategory(VENDOR_CATEGORIES[0]);
    setCustomCategory("");
    setCompanyName("");
    setContactName("");
    setPhone("");
    setEmail("");
    setNotes("");
    setStatus("inquiry");
    setContractAmount("");
    setPaymentDrafts([]);
    setMode("create");
    setEditingId(null);
    setFormOpen(false);
  }

  function resolvedCategory() {
    if (category === OTHER_VENDOR_CATEGORY) return customCategory.trim();
    return category.trim();
  }

  function openCreate() {
    setErrorMessage("");
    setCategory(VENDOR_CATEGORIES[0]);
    setCustomCategory("");
    setCompanyName("");
    setContactName("");
    setPhone("");
    setEmail("");
    setNotes("");
    setStatus("inquiry");
    setContractAmount("");
    setPaymentDrafts([]);
    setMode("create");
    setEditingId(null);
    setFormOpen(true);
  }

  function startEdit(vendor: VendorWithPayments) {
    setErrorMessage("");
    if (isPresetCategory(vendor.category)) {
      setCategory(vendor.category);
      setCustomCategory("");
    } else {
      setCategory(OTHER_VENDOR_CATEGORY);
      setCustomCategory(vendor.category);
    }
    setCompanyName(vendor.companyName);
    setContactName(vendor.contactName);
    setPhone(vendor.phone ?? "");
    setEmail(vendor.email ?? "");
    setNotes(vendor.notes ?? "");
    setStatus(vendor.status);
    setContractAmount(
      vendor.contractAmount != null ? String(vendor.contractAmount) : "",
    );
    setPaymentDrafts(draftsFromPayments(vendor.payments));
    setMode("edit");
    setEditingId(vendor.id);
    setFormOpen(true);
  }

  function updateDraft(key: string, patch: Partial<PaymentDraft>) {
    setPaymentDrafts((current) =>
      current.map((draft) =>
        draft.key === key ? { ...draft, ...patch } : draft,
      ),
    );
  }

  function preparedPayments() {
    const rows: Array<{
      id?: string;
      label: string;
      amount: number;
      dueOn: string | null;
      paidOn: string | null;
    }> = [];

    for (const draft of paymentDrafts) {
      const label = draft.label.trim();
      const amountRaw = draft.amount.trim();
      const dueOn = draft.dueOn.trim();
      const paidOn = draft.paidOn.trim();
      const empty = !label && !amountRaw && !dueOn && !paidOn;
      if (empty) continue;
      if (!label) {
        return { error: "Each payment needs a label." };
      }
      const amount = parseAmount(amountRaw);
      if (amount == null || amount < 0) {
        return { error: "Each payment needs a valid amount." };
      }
      rows.push({
        id: draft.id,
        label,
        amount,
        dueOn: dueOn || null,
        paidOn: paidOn || null,
      });
    }

    return { rows };
  }

  async function syncPayments(
    vendorId: string,
    nextPayments: Array<{
      id?: string;
      label: string;
      amount: number;
      dueOn: string | null;
      paidOn: string | null;
    }>,
    existingIds: string[],
  ) {
    const supabase = createClient();
    const keptIds = new Set(
      nextPayments.map((payment) => payment.id).filter(Boolean),
    );
    const toDelete = existingIds.filter((id) => !keptIds.has(id));
    if (toDelete.length > 0) {
      const { error } = await supabase
        .from("vendor_payments")
        .delete()
        .in("id", toDelete);
      if (error) throw error;
    }

    for (let index = 0; index < nextPayments.length; index += 1) {
      const payment = nextPayments[index];
      const payload = {
        vendor_id: vendorId,
        label: payment.label,
        amount: payment.amount,
        due_on: payment.dueOn,
        paid_on: payment.paidOn,
        sort_order: index,
      };
      if (payment.id) {
        const { error } = await supabase
          .from("vendor_payments")
          .update(payload)
          .eq("id", payment.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("vendor_payments").insert(payload);
        if (error) throw error;
      }
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured) return;

    const nextCategory = resolvedCategory();
    if (!nextCategory) {
      setErrorMessage("Please choose a vendor role.");
      return;
    }
    const nextCompany = companyName.trim();
    if (!nextCompany) {
      setErrorMessage("Please enter the company name.");
      return;
    }
    const nextContact = contactName.trim();
    if (!nextContact) {
      setErrorMessage("Please enter the contact person.");
      return;
    }

    const contractRaw = contractAmount.trim();
    let nextContract: number | null = null;
    if (contractRaw) {
      const parsed = parseAmount(contractRaw);
      if (parsed == null || parsed < 0) {
        setErrorMessage("Enter a valid contract total, or leave it blank.");
        return;
      }
      nextContract = parsed;
    }

    const prepared = preparedPayments();
    if ("error" in prepared && prepared.error) {
      setErrorMessage(prepared.error);
      return;
    }
    const nextPayments = prepared.rows ?? [];

    setSaving(true);
    setErrorMessage("");

    try {
      const supabase = createClient();
      const vendorPayload = {
        category: nextCategory,
        company_name: nextCompany,
        contact_name: nextContact,
        phone: phone.trim() || null,
        email: email.trim() || null,
        notes: notes.trim() || null,
        status,
        contract_amount: nextContract,
      };

      if (mode === "edit" && editingId) {
        const { error } = await supabase
          .from("vendors")
          .update(vendorPayload)
          .eq("id", editingId);
        if (error) throw error;

        const existing =
          vendors.find((vendor) => vendor.id === editingId)?.payments ?? [];
        await syncPayments(
          editingId,
          nextPayments,
          existing.map((payment) => payment.id),
        );
      } else {
        const { data, error } = await supabase
          .from("vendors")
          .insert(vendorPayload)
          .select("id")
          .single();
        if (error) throw error;
        const vendorId = data?.id as string | undefined;
        if (!vendorId) throw new Error("Unable to create vendor.");

        try {
          await syncPayments(vendorId, nextPayments, []);
        } catch (paymentError) {
          await supabase.from("vendors").delete().eq("id", vendorId);
          throw paymentError;
        }
      }

      resetForm();
      reload();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save this vendor.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(vendor: VendorWithPayments) {
    if (
      !window.confirm(
        `Delete ${vendor.companyName}? This also removes their payment schedule.`,
      )
    ) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("vendors").delete().eq("id", vendor.id);
    if (error) {
      setErrorMessage("Unable to delete this vendor.");
      return;
    }
    if (editingId === vendor.id) resetForm();
    reload();
  }

  async function onMarkPaid(payment: VendorPayment) {
    setMarkingId(payment.id);
    setErrorMessage("");
    const supabase = createClient();
    const { error } = await supabase
      .from("vendor_payments")
      .update({ paid_on: localDateString() })
      .eq("id", payment.id);
    setMarkingId(null);
    if (error) {
      setErrorMessage("Unable to mark this payment as paid.");
      return;
    }
    reload();
  }

  const nextDueCopy = overview.next
    ? `${overview.next.vendor.companyName} · ${overview.next.payment.label}${
        overview.next.payment.dueOn
          ? ` · ${formatDisplayDate(overview.next.payment.dueOn)}`
          : ""
      }`
    : "No upcoming payments";

  return (
    <main className="flex-1">
      <section className="mx-auto w-full max-w-3xl px-6 py-16">
        <AdminSectionHeading
          heading="h1"
          eyebrow="Vendors"
          title="Contacts and payments"
          description="Keep each vendor’s role, company, and contact in one place. Add a payment schedule when you have a downpayment or remaining balance."
        />

        {!configured ? (
          <p className={`mt-8 ${adminMutedTextClassName}`}>
            Connect Supabase to manage vendors.
          </p>
        ) : (
          <>
            <div className="mt-10">
              <button
                type="button"
                onClick={openCreate}
                className={adminPrimaryButtonClassName}
              >
                Add vendor
              </button>
            </div>

            {errorMessage && !formOpen ? (
              <p className={`mt-6 ${adminErrorClassName}`} role="alert">
                {errorMessage}
              </p>
            ) : null}

            {loading || vendors.length === 0 ? null : (
              <div className="mt-10 border border-border bg-surface px-5 py-4">
                <div className={`space-y-1 ${adminMutedTextClassName}`}>
                  <p>
                    Remaining {formatPhp(overview.remaining)}
                    {" · "}
                    Paid {formatPhp(overview.paid)}
                    {overview.contracted > 0
                      ? ` of ${formatPhp(overview.contracted)}`
                      : ""}
                  </p>
                  <p>
                    {overview.overdueCount > 0
                      ? `${overview.overdueCount} overdue`
                      : "Nothing overdue"}
                    {" · "}
                    Next: {nextDueCopy}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-8">
              <label className="block max-w-xs">
                <span className={adminLabelClassName}>
                  Role
                </span>
                <select
                  value={activeCategoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className={adminInputClassName}
                >
                  <option value="all">All roles</option>
                  {usedCategories.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className={`mt-12 ${adminListClassName}`}>
              {loading ? (
                <p className={`py-6 ${adminMutedTextClassName}`}>
                  Loading vendors…
                </p>
              ) : filteredVendors.length === 0 ? (
                <p className={`py-6 ${adminMutedTextClassName}`}>
                  {vendors.length === 0
                    ? "No vendors yet. Add a photographer, caterer, or venue to keep contacts and payments together."
                    : "No vendors match this role."}
                </p>
              ) : (
                filteredVendors.map((vendor) => {
                  const totals = vendorPaymentTotals(vendor, today);
                  const payments = sortedPayments(vendor.payments);
                  return (
                    <article key={vendor.id} className="py-6">
                      <p className={`${adminLabelClassName} text-accent`}>
                        {vendor.category}
                      </p>
                      <div className="mt-1 flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h2 className={adminItemTitleClassName}>
                            {vendor.companyName}
                          </h2>
                          <p className={`mt-1 ${adminMutedTextClassName}`}>
                            {vendor.contactName}
                            {" · "}
                            {vendorStatusLabel(vendor.status)}
                          </p>
                          {vendor.phone ? (
                            <p className={`mt-1 ${adminMutedTextClassName}`}>
                              <a
                                href={telHref(vendor.phone)}
                                className={adminLinkClassName}
                              >
                                {vendor.phone}
                              </a>
                            </p>
                          ) : null}
                          {vendor.email ? (
                            <p className={`mt-1 ${adminMutedTextClassName}`}>
                              <a
                                href={`mailto:${vendor.email}`}
                                className={adminLinkClassName}
                              >
                                {vendor.email}
                              </a>
                            </p>
                          ) : null}
                          {vendor.notes ? (
                            <p className={`mt-3 max-w-xl ${adminMutedTextClassName}`}>
                              {vendor.notes}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm">
                          <button
                            type="button"
                            onClick={() => startEdit(vendor)}
                            className={adminLinkClassName}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void onDelete(vendor)}
                            className={adminLinkClassName}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {payments.length > 0 || totals.contractTotal != null ? (
                        <div className="mt-4 space-y-2 text-sm">
                          <p className={adminMutedTextClassName}>
                            Paid {formatPhp(totals.paid)}
                            {totals.contractTotal != null
                              ? ` of ${formatPhp(totals.contractTotal)}`
                              : ""}
                            {" · "}
                            Remaining {formatPhp(totals.remaining)}
                            {totals.overdue.length > 0
                              ? ` · ${totals.overdue.length} overdue`
                              : ""}
                          </p>
                          {payments.map((payment) => {
                            const overdue =
                              !payment.paidOn &&
                              Boolean(payment.dueOn && payment.dueOn < today);
                            return (
                              <div
                                key={payment.id}
                                className="flex flex-wrap items-baseline justify-between gap-3"
                              >
                                <p
                                  className={
                                    overdue
                                      ? "text-red-800"
                                      : "text-muted"
                                  }
                                >
                                  {payment.label}
                                  {" · "}
                                  {formatPhp(payment.amount)}
                                  {" · "}
                                  {paymentStatusCopy(payment, today)}
                                </p>
                                {!payment.paidOn ? (
                                  <button
                                    type="button"
                                    disabled={markingId === payment.id}
                                    onClick={() => void onMarkPaid(payment)}
                                    className={`${adminLinkClassName} disabled:opacity-60`}
                                  >
                                    {markingId === payment.id
                                      ? "Saving…"
                                      : "Mark paid"}
                                  </button>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </article>
                  );
                })
              )}
            </div>

            <AdminModal
              open={formOpen}
              title={mode === "edit" ? "Edit vendor" : "Add vendor"}
              onClose={resetForm}
            >
              <form onSubmit={onSubmit} className="space-y-6">
                <label className="block">
                  <span className={adminLabelClassName}>
                    Role
                  </span>
                  <select
                    required
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className={adminInputClassName}
                  >
                    {VENDOR_CATEGORIES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                    <option value={OTHER_VENDOR_CATEGORY}>
                      {OTHER_VENDOR_CATEGORY}
                    </option>
                  </select>
                </label>

                {category === OTHER_VENDOR_CATEGORY ? (
                  <label className="block">
                    <span className={adminLabelClassName}>
                      Custom role
                    </span>
                    <input
                      required
                      value={customCategory}
                      onChange={(event) => setCustomCategory(event.target.value)}
                      placeholder="Videographer"
                      className={adminInputClassName}
                    />
                  </label>
                ) : null}

                <label className="block">
                  <span className={adminLabelClassName}>
                    Company
                  </span>
                  <input
                    required
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    placeholder="Studio name"
                    className={adminInputClassName}
                  />
                </label>

                <label className="block">
                  <span className={adminLabelClassName}>
                    Contact person
                  </span>
                  <input
                    required
                    value={contactName}
                    onChange={(event) => setContactName(event.target.value)}
                    placeholder="Name"
                    className={adminInputClassName}
                  />
                </label>

                <label className="block">
                  <span className={adminLabelClassName}>
                    Phone
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="09XX XXX XXXX"
                    className={adminInputClassName}
                  />
                </label>

                <label className="block">
                  <span className={adminLabelClassName}>
                    Email
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="studio@email.com"
                    className={adminInputClassName}
                  />
                </label>

                <label className="block">
                  <span className={adminLabelClassName}>
                    Description
                  </span>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={3}
                    placeholder="Package notes, inclusions, or anything to remember."
                    className={adminInputClassName}
                  />
                </label>

                <label className="block">
                  <span className={adminLabelClassName}>
                    Status
                  </span>
                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as VendorStatus)
                    }
                    className={adminInputClassName}
                  >
                    <option value="inquiry">Inquiry</option>
                    <option value="booked">Booked</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>

                <label className="block">
                  <span className={adminLabelClassName}>
                    Contract total
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={contractAmount}
                    onChange={(event) => setContractAmount(event.target.value)}
                    placeholder="Optional"
                    className={adminInputClassName}
                  />
                </label>

                <fieldset className="space-y-4">
                  <legend className={adminLabelClassName}>
                    Payment schedule
                  </legend>
                  <p className={adminMutedTextClassName}>
                    Optional. Add a downpayment, remaining balance, or any
                    installment with due and paid dates.
                  </p>
                  {paymentDrafts.map((draft, index) => (
                    <div
                      key={draft.key}
                      className="space-y-4 border border-border bg-background px-4 py-4"
                    >
                      <label className="block">
                        <span className={adminLabelClassName}>
                          Label
                        </span>
                        <input
                          value={draft.label}
                          onChange={(event) =>
                            updateDraft(draft.key, {
                              label: event.target.value,
                            })
                          }
                          placeholder={defaultPaymentLabel(index)}
                          className={adminInputClassName}
                        />
                      </label>
                      <label className="block">
                        <span className={adminLabelClassName}>
                          Amount
                        </span>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={draft.amount}
                          onChange={(event) =>
                            updateDraft(draft.key, {
                              amount: event.target.value,
                            })
                          }
                          className={adminInputClassName}
                        />
                      </label>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className={adminLabelClassName}>
                            Due date
                          </span>
                          <input
                            type="date"
                            value={draft.dueOn}
                            onChange={(event) =>
                              updateDraft(draft.key, {
                                dueOn: event.target.value,
                              })
                            }
                            className={adminInputClassName}
                          />
                        </label>
                        <label className="block">
                          <span className={adminLabelClassName}>
                            Paid date
                          </span>
                          <input
                            type="date"
                            value={draft.paidOn}
                            onChange={(event) =>
                              updateDraft(draft.key, {
                                paidOn: event.target.value,
                              })
                            }
                            className={adminInputClassName}
                          />
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setPaymentDrafts((current) =>
                            current.filter((row) => row.key !== draft.key),
                          )
                        }
                        className={adminLinkClassName}
                      >
                        Remove payment
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setPaymentDrafts((current) => [
                        ...current,
                        emptyPaymentDraft(current.length),
                      ])
                    }
                    className={adminLinkClassName}
                  >
                    Add payment
                  </button>
                </fieldset>

                {errorMessage ? (
                  <p className={adminErrorClassName} role="alert">
                    {errorMessage}
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className={adminPrimaryButtonClassName}
                  >
                    {saving
                      ? "Saving…"
                      : mode === "edit"
                        ? "Save vendor"
                        : "Add vendor"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className={adminSecondaryButtonClassName}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </AdminModal>
          </>
        )}
      </section>
    </main>
  );
}
