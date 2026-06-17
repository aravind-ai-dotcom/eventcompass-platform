import SetupAuthGate from "@/components/setup/SetupAuthGate";

export default function SkoSetupLayout({ children }: { children: React.ReactNode }) {
  return <SetupAuthGate>{children}</SetupAuthGate>;
}
