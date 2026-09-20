import type {
  Vendor,
  VendorPayment,
  VendorPaymentRow,
  VendorRow,
  VendorStatus,
  VendorWithPayments,
} from "@/types";

export const VENDOR_CATEGORIES = [
  "Venue",
  "Caterer",
  "Coordinator",
  "Photographer",
  "Videographer",
  "Florist",
  "Makeup / HMUA",
  "Hair",
  "DJ / Entertainment",
  "Host / Emcee",
  "Cake",
  "Attire",
  "Jewelry",
  "Invitations",
  "Transportation",
  "Officiant",
] as const;

export const OTHER_VENDOR_CATEGORY = "Other";

export function isPresetCategory(value: string) {
  return (VENDOR_CATEGORIES as readonly string[]).includes(value);
}

export const VENDOR_STATUSES: VendorStatus[] = [
  "inquiry",
  "booked",
  "completed",
];

const phpFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const displayDateFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export type VendorTotals = {
  contractTotal: number | null;
  paid: number;
  remaining: number;
  nextDue: VendorPayment | null;
  overdue: VendorPayment[];
};

export type VendorsOverview = {
  paid: number;
  remaining: number;
  contracted: number;
  overdueCount: number;
  next: { vendor: VendorWithPayments; payment: VendorPayment } | null;
};

export function parseAmount(value: unknown): number | null {
  if (value == null || value === "") return null;
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? amount : null;
}

export function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatPhp(amount: number) {
  return phpFormatter.format(amount);
}

export function formatDisplayDate(isoDate: string | null) {
  if (!isoDate) return null;
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return displayDateFormatter.format(new Date(year, month - 1, day));
}

export function isVendorStatus(value: unknown): value is VendorStatus {
  return (
    typeof value === "string" &&
    VENDOR_STATUSES.includes(value as VendorStatus)
  );
}

export function vendorStatusLabel(status: VendorStatus) {
  if (status === "booked") return "Booked";
  if (status === "completed") return "Completed";
  return "Inquiry";
}

export function defaultPaymentLabel(index: number) {
  if (index === 0) return "Downpayment";
  if (index === 1) return "Balance";
  return `Payment ${index + 1}`;
}

export function mapVendorPaymentRow(row: VendorPaymentRow): VendorPayment {
  return {
    id: row.id,
    vendorId: row.vendor_id,
    label: row.label,
    amount: parseAmount(row.amount) ?? 0,
    dueOn: row.due_on,
    paidOn: row.paid_on,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export function mapVendorRow(row: VendorRow): Vendor {
  return {
    id: row.id,
    category: row.category,
    companyName: row.company_name,
    contactName: row.contact_name,
    phone: row.phone,
    email: row.email,
    notes: row.notes,
    status: isVendorStatus(row.status) ? row.status : "inquiry",
    contractAmount: parseAmount(row.contract_amount),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function sortedPayments(payments: VendorPayment[]) {
  return [...payments].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }
    return left.createdAt.localeCompare(right.createdAt);
  });
}

export function vendorPaymentTotals(
  vendor: VendorWithPayments,
  today: string,
): VendorTotals {
  const payments = sortedPayments(vendor.payments);
  const paid = payments
    .filter((payment) => payment.paidOn)
    .reduce((sum, payment) => sum + payment.amount, 0);
  const unpaid = payments.filter((payment) => !payment.paidOn);
  const unpaidSum = unpaid.reduce((sum, payment) => sum + payment.amount, 0);
  const remaining =
    vendor.contractAmount != null
      ? Math.max(0, vendor.contractAmount - paid)
      : unpaidSum;
  const overdue = unpaid.filter(
    (payment) => payment.dueOn && payment.dueOn < today,
  );
  const datedUnpaid = unpaid
    .filter((payment) => payment.dueOn)
    .sort((left, right) => (left.dueOn ?? "").localeCompare(right.dueOn ?? ""));
  const nextDue = datedUnpaid[0] ?? unpaid[0] ?? null;
  const paymentSum = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const contractTotal =
    vendor.contractAmount != null
      ? vendor.contractAmount
      : paymentSum > 0
        ? paymentSum
        : null;

  return { contractTotal, paid, remaining, nextDue, overdue };
}

export function vendorsOverview(
  vendors: VendorWithPayments[],
  today: string,
): VendorsOverview {
  let paid = 0;
  let remaining = 0;
  let contracted = 0;
  let overdueCount = 0;
  const upcoming: Array<{
    vendor: VendorWithPayments;
    payment: VendorPayment;
  }> = [];

  for (const vendor of vendors) {
    const totals = vendorPaymentTotals(vendor, today);
    paid += totals.paid;
    remaining += totals.remaining;
    contracted += totals.contractTotal ?? 0;
    overdueCount += totals.overdue.length;
    if (totals.nextDue) {
      upcoming.push({ vendor, payment: totals.nextDue });
    }
  }

  upcoming.sort((left, right) => {
    const leftDue = left.payment.dueOn ?? "9999-12-31";
    const rightDue = right.payment.dueOn ?? "9999-12-31";
    return leftDue.localeCompare(rightDue);
  });

  return {
    paid,
    remaining,
    contracted,
    overdueCount,
    next: upcoming[0] ?? null,
  };
}

export function compareVendors(
  left: VendorWithPayments,
  right: VendorWithPayments,
  today: string,
) {
  const leftTotals = vendorPaymentTotals(left, today);
  const rightTotals = vendorPaymentTotals(right, today);
  const leftOverdue = leftTotals.overdue.length > 0;
  const rightOverdue = rightTotals.overdue.length > 0;
  if (leftOverdue !== rightOverdue) return leftOverdue ? -1 : 1;

  const leftDue = leftTotals.nextDue?.dueOn ?? "9999-12-31";
  const rightDue = rightTotals.nextDue?.dueOn ?? "9999-12-31";
  if (leftDue !== rightDue) return leftDue.localeCompare(rightDue);

  const category = left.category.localeCompare(right.category);
  if (category !== 0) return category;
  return left.companyName.localeCompare(right.companyName);
}

export function paymentStatusCopy(payment: VendorPayment, today: string) {
  if (payment.paidOn) {
    const paid = formatDisplayDate(payment.paidOn);
    return paid ? `Paid ${paid}` : "Paid";
  }
  if (payment.dueOn) {
    const due = formatDisplayDate(payment.dueOn);
    if (payment.dueOn < today) {
      return due ? `Overdue · due ${due}` : "Overdue";
    }
    return due ? `Due ${due}` : "Unpaid";
  }
  return "Unpaid";
}

export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
