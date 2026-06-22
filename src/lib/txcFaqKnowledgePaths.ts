/** @deprecated Legacy FAQ-lite paths — use voice_knowledge instead */

export const TXC_FAQ_KNOWLEDGE_BASE = "organizations/ibm/events/txc2026";

export const TXC_KNOWLEDGE_EXPORT_FILENAME = "txc-knowledge.xlsx";

export const TXC_KNOWLEDGE_EXPORT_RELATIVE_PATH = `exports/${TXC_KNOWLEDGE_EXPORT_FILENAME}`;

export function txcFaqKnowledgeCollection(): string {
  return `${TXC_FAQ_KNOWLEDGE_BASE}/knowledge`;
}

export function txcFaqKnowledgeCategoriesCollection(): string {
  return `${TXC_FAQ_KNOWLEDGE_BASE}/knowledge_categories`;
}
