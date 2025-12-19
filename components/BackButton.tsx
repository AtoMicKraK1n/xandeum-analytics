"use client";

import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="text-neo-teal hover:text-neo-teal/80 text-sm mb-3 inline-flex items-center gap-2 transition-colors cursor-pointer"
    >
      ← Back to Dashboard
    </button>
  );
}
