import { collection, getDocs, query, where } from "firebase/firestore";
import { tryGetDb } from "@/lib/firebase";

const BASE = "organizations/ibm/events/txc2026";

export async function getFeaturedChampions() {
  const db = tryGetDb();
  if (!db) return [];

  const championsRef = collection(db, `${BASE}/champions`);
  const q = query(championsRef, where("featured", "==", true));
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }))
    .filter((champion: any) =>
      champion?.consent?.featured_champion === true &&
      champion?.consent?.show_photo === true
    )
    .sort(
      (a: any, b: any) =>
        (b.homepage_priority ?? 0) - (a.homepage_priority ?? 0)
    );
}
