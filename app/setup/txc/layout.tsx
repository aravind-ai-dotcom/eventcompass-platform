import SetupAuthGate from "@/components/setup/SetupAuthGate";

export default function TxcSetupLayout({ children }: { children: React.ReactNode }) {
  return <SetupAuthGate>{children}</SetupAuthGate>;
}
