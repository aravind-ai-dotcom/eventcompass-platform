"use client";

import SkoShell from "@/components/sko/SkoShell";
import SkoCompassView from "@/components/sko/SkoCompassView";

export default function ProfilePage() {
  return (
    <SkoShell>
      <SkoCompassView loginPath="/sko/login" enrollPath="/sko/enroll" />
    </SkoShell>
  );
}
