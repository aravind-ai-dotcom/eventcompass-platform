import { collection, getDocs } from "firebase/firestore";
import { tryGetDb } from "@/lib/firebase";
import {
  voiceKnowledgeCategoriesCollection,
  voiceKnowledgeCollection,
  TXC_EVENT_ID,
} from "@/lib/compassEventPaths";
import { loadVoiceKnowledgeRecords } from "@/services/voice/voiceKnowledgeService";
import { txcKnowledgeCategories } from "@/data/seeds/txcKnowledgeSeed";
import type { VoiceKnowledgeCategoryMeta, VoiceKnowledgeRecord } from "@/types/voiceKnowledge";

export async function loadUnifiedVoiceKnowledge(): Promise<{
  records: VoiceKnowledgeRecord[];
  categories: VoiceKnowledgeCategoryMeta[];
}> {
  const db = tryGetDb();
  if (!db) {
    throw new Error("Firebase is not configured.");
  }

  const [records, categorySnap] = await Promise.all([
    loadVoiceKnowledgeRecords(TXC_EVENT_ID),
    getDocs(collection(db, voiceKnowledgeCategoriesCollection(TXC_EVENT_ID))),
  ]);

  const categories = categorySnap.empty
    ? txcKnowledgeCategories
    : categorySnap.docs.map(doc => {
        const data = doc.data();
        return {
          category_id: String(data.category_id ?? doc.id),
          label: String(data.label ?? ""),
          purpose: String(data.purpose ?? ""),
          display_order: Number(data.display_order ?? 0),
        };
      });

  return { records, categories };
}

/** @deprecated Use loadUnifiedVoiceKnowledge — reads legacy knowledge collection */
export async function loadTxcFaqKnowledge(): Promise<{
  records: VoiceKnowledgeRecord[];
  categories: VoiceKnowledgeCategoryMeta[];
}> {
  return loadUnifiedVoiceKnowledge();
}
