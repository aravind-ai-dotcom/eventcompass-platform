"use client";

import SkoShell from "@/components/sko/SkoShell";
import SkoPulseView from "@/components/sko/SkoPulseView";

export default function PulsePage() {
  return (
    <SkoShell>
      <SkoPulseView loginPath="/sko/login" />
    </SkoShell>
  );
}
