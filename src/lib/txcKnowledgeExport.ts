import * as XLSX from "xlsx";
import { txcKnowledgeCategories } from "@/data/seeds/txcKnowledgeSeed";
import { voiceKnowledgeNeedsReview } from "@/lib/voiceKnowledgeResponse";
import type {
  VoiceKnowledgeCategoryMeta,
  VoiceKnowledgeRecord,
} from "@/types/voiceKnowledge";

export const REVIEW_NOTES_ROWS: ReadonlyArray<[string, string]> = [
  ["Direct answers", "These are safe for Compass to answer directly."],
  ["Official FAQ redirects", "These should give a compact answer and point to official FAQ."],
  ["Guest Services", "These should route users to ibmtechxchange@gpj.com."],
  ["Missing knowledge", "Use this sheet to identify new questions to add."],
];

export interface VoiceKnowledgeSummary {
  total: number;
  active: number;
  categories: number;
  directAnswer: number;
  officialFaq: number;
  guestServices: number;
  externalSite: number;
  missingUtterances: number;
  lowPriority: number;
  inactive: number;
  bySource: Record<string, number>;
}

export function summarizeVoiceKnowledge(
  records: VoiceKnowledgeRecord[],
  categories: VoiceKnowledgeCategoryMeta[] = txcKnowledgeCategories,
): VoiceKnowledgeSummary {
  const bySource: Record<string, number> = {};
  for (const record of records) {
    const key = record.source ?? "compass_seed";
    bySource[key] = (bySource[key] ?? 0) + 1;
  }

  return {
    total: records.length,
    active: records.filter(r => r.enabled).length,
    categories: new Set(records.map(r => r.intent_category ?? r.faq_category_id ?? r.category)).size,
    directAnswer: records.filter(r => r.redirect_type === "answer" || (!r.redirect_type && r.category === "Event Knowledge")).length,
    officialFaq: records.filter(r => r.redirect_type === "official_faq").length,
    guestServices: records.filter(r => r.redirect_type === "guest_services").length,
    externalSite: records.filter(r => r.redirect_type === "external_site").length,
    missingUtterances: records.filter(r => (r.trigger_phrases?.length ?? 0) < 3).length,
    lowPriority: records.filter(r => (r.priority ?? 50) < 60).length,
    inactive: records.filter(r => !r.enabled).length,
    bySource,
  };
}

export function sortVoiceKnowledgeRecords(
  records: VoiceKnowledgeRecord[],
  categories: VoiceKnowledgeCategoryMeta[] = txcKnowledgeCategories,
): VoiceKnowledgeRecord[] {
  const orderByCategory = new Map(categories.map(c => [c.category_id, c.display_order]));
  return [...records].sort((a, b) => {
    const catA = a.faq_category_id ?? a.intent_category ?? a.category;
    const catB = b.faq_category_id ?? b.intent_category ?? b.category;
    const orderA = orderByCategory.get(String(catA)) ?? 999;
    const orderB = orderByCategory.get(String(catB)) ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    if ((b.priority ?? 50) !== (a.priority ?? 50)) {
      return (b.priority ?? 50) - (a.priority ?? 50);
    }
    return a.title.localeCompare(b.title);
  });
}

export function categoryLabelForRecord(
  record: VoiceKnowledgeRecord,
  categories: VoiceKnowledgeCategoryMeta[] = txcKnowledgeCategories,
): string {
  if (record.faq_category_id) {
    const match = categories.find(c => c.category_id === record.faq_category_id);
    if (match) return match.label;
  }
  return record.intent_category ?? record.category;
}

export function categoryLabelMap(
  categories: VoiceKnowledgeCategoryMeta[] = txcKnowledgeCategories,
): Map<string, string> {
  return new Map(categories.map(c => [c.category_id, c.label]));
}

/** @deprecated Use summarizeVoiceKnowledge */
export const summarizeTxcKnowledge = summarizeVoiceKnowledge;

/** @deprecated Use sortVoiceKnowledgeRecords */
export const sortTxcKnowledgeRecords = sortVoiceKnowledgeRecords;

export function buildVoiceKnowledgeWorkbook(
  records: VoiceKnowledgeRecord[],
  categories: VoiceKnowledgeCategoryMeta[] = txcKnowledgeCategories,
): XLSX.WorkBook {
  const sorted = sortVoiceKnowledgeRecords(records, categories);

  const knowledgeRows = sorted.map(record => ({
    "Knowledge ID": record.id,
    Category: record.intent_category ?? record.faq_category_id ?? record.category,
    "Category Label": categoryLabelForRecord(record, categories),
    Intent: record.intent ?? "",
    "Canonical Question": record.title,
    "Voice Response": record.response,
    "Display Response": record.display_response ?? record.response,
    "Redirect Type": record.redirect_type ?? "answer",
    "Contact Email": record.contact_email ?? "",
    "Source URL": record.source_url ?? "",
    "Sample Utterances": record.trigger_phrases.join(" | "),
    Tags: (record.tags ?? []).join(", "),
    Priority: record.priority ?? 50,
    Source: record.source ?? "compass_seed",
    Active: record.enabled ? "Yes" : "No",
  }));

  const categoryRows = [...categories]
    .sort((a, b) => a.display_order - b.display_order)
    .map(category => ({
      "Category ID": category.category_id,
      Label: category.label,
      Purpose: category.purpose,
      "Display Order": category.display_order,
    }));

  const reviewRows = REVIEW_NOTES_ROWS.map(([area, notes]) => ({
    "Review Area": area,
    Notes: notes,
  }));

  const needsReviewRows = sorted.flatMap(record => {
    const issues = voiceKnowledgeNeedsReview(record);
    if (issues.length === 0) return [];
    return issues.map(issue => ({
      "Knowledge ID": record.id,
      Question: record.title,
      Issue: issue,
      Priority: record.priority ?? 50,
      Source: record.source ?? "compass_seed",
    }));
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(knowledgeRows), "Voice Knowledge");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(categoryRows), "Categories");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(reviewRows), "Review Notes");
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      needsReviewRows.length > 0
        ? needsReviewRows
        : [{ "Knowledge ID": "", Question: "No review issues detected.", Issue: "", Priority: "", Source: "" }],
    ),
    "Needs Review",
  );
  return workbook;
}

export function downloadVoiceKnowledgeWorkbook(
  records: VoiceKnowledgeRecord[],
  categories: VoiceKnowledgeCategoryMeta[] = txcKnowledgeCategories,
  filename = "txc-knowledge.xlsx",
): void {
  const workbook = buildVoiceKnowledgeWorkbook(records, categories);
  XLSX.writeFile(workbook, filename);
}

/** @deprecated Use downloadVoiceKnowledgeWorkbook */
export const downloadTxcKnowledgeWorkbook = downloadVoiceKnowledgeWorkbook;
