"use client";

import { invitation } from "@/content/invitation";

export function BankQr() {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(
    invitation.giftGuide.bank.payload,
  )}`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Sample bank transfer QR code"
      width={240}
      height={240}
      className="border border-border bg-surface"
    />
  );
}
