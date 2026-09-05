"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { invitation } from "@/content/invitation";

export function BankQr() {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(invitation.giftGuide.bank.payload, {
      width: 240,
      margin: 1,
      color: { dark: "#1c1c1a", light: "#fffcf8" },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!dataUrl) {
    return (
      <div className="flex h-60 w-60 items-center justify-center border border-border bg-surface text-xs text-muted">
        Generating QR…
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt="Sample bank transfer QR code"
      width={240}
      height={240}
      className="border border-border bg-surface"
    />
  );
}
