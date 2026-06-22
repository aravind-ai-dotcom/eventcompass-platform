/**
 * Export unified Voice Compass knowledge to XLSX.
 * Run: npm run export:txc-knowledge
 */
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import { txcKnowledgeCategories } from "../src/data/seeds/txcKnowledgeSeed";
import { buildVoiceKnowledgeWorkbook } from "../src/lib/txcKnowledgeExport";
import { TXC_KNOWLEDGE_EXPORT_RELATIVE_PATH, TXC_FAQ_KNOWLEDGE_BASE } from "../src/lib/txcFaqKnowledgePaths";
import type {
  VoiceIntentCategory,
  VoiceKnowledgeCategory,
  VoiceKnowledgeRecord,
  VoiceKnowledgeRedirectType,
} from "../src/types/voiceKnowledge";

function mapVoiceRecord(id: string, data: Record<string, unknown>): VoiceKnowledgeRecord {
  return {
    id,
    category: data.category as VoiceKnowledgeCategory,
    title: String(data.title ?? ""),
    trigger_phrases: Array.isArray(data.trigger_phrases) ? data.trigger_phrases.map(String) : [],
    response: String(data.response ?? ""),
    display_response: typeof data.display_response === "string" ? data.display_response : undefined,
    enabled: data.enabled !== false,
    topic_key: typeof data.topic_key === "string" ? data.topic_key : undefined,
    intent: typeof data.intent === "string" ? data.intent : undefined,
    intent_category: typeof data.intent_category === "string"
      ? data.intent_category as VoiceIntentCategory
      : undefined,
    faq_category_id: typeof data.faq_category_id === "string" ? data.faq_category_id : undefined,
    redirect_type: typeof data.redirect_type === "string"
      ? data.redirect_type as VoiceKnowledgeRedirectType
      : undefined,
    source_url: typeof data.source_url === "string" ? data.source_url : undefined,
    contact_email: typeof data.contact_email === "string" ? data.contact_email : undefined,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : undefined,
    priority: typeof data.priority === "number" ? data.priority : undefined,
    source: typeof data.source === "string" ? data.source : undefined,
    updated_by: typeof data.updated_by === "string" ? data.updated_by : undefined,
    updated_at: typeof data.updated_at === "string" ? data.updated_at : "",
  };
}

async function main() {
  const serviceAccount = require(path.join(process.cwd(), "serviceAccountKey.json"));
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
  const db = admin.firestore();

  const [knowledgeSnap, categorySnap] = await Promise.all([
    db.collection(`${TXC_FAQ_KNOWLEDGE_BASE}/voice_knowledge`).get(),
    db.collection(`${TXC_FAQ_KNOWLEDGE_BASE}/voice_knowledge_categories`).get(),
  ]);

  const records = knowledgeSnap.docs.map(doc =>
    mapVoiceRecord(doc.id, doc.data() as Record<string, unknown>),
  );

  const categories = categorySnap.empty
    ? txcKnowledgeCategories
    : categorySnap.docs.map(doc => ({
        category_id: String(doc.data().category_id ?? doc.id),
        label: String(doc.data().label ?? ""),
        purpose: String(doc.data().purpose ?? ""),
        display_order: Number(doc.data().display_order ?? 0),
      }));

  const workbook = buildVoiceKnowledgeWorkbook(records, categories);
  const outPath = path.join(process.cwd(), TXC_KNOWLEDGE_EXPORT_RELATIVE_PATH);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  XLSX.writeFile(workbook, outPath);

  const faqMigrated = records.filter(r => r.source === "official_txc_faq").length;
  console.log(`Exported ${records.length} voice knowledge records (${faqMigrated} official FAQ-lite migrated).`);
  console.log(`Wrote ${TXC_KNOWLEDGE_EXPORT_RELATIVE_PATH}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
