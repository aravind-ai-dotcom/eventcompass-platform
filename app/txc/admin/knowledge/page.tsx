import type { Metadata } from "next";
import TxcKnowledgeAdminView from "@/components/admin/TxcKnowledgeAdminView";

export const metadata: Metadata = {
  title: "TXC Knowledge Admin",
  robots: { index: false, follow: false },
};

export default function TxcKnowledgeAdminPage() {
  return <TxcKnowledgeAdminView />;
}
