import { Trie } from "@/lib/report-editor/trie";
import { OrderForReportDto } from "@/types/report-builder";

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/**
 * Instant client-side filter for the rows already on screen: every word
 * (order no, patient, phone, test) goes into a Trie -> row index.
 * A multi-word query = intersection of Sets. No per-keystroke full scan.
 */
export class OrderIndex {
  private trie = new Trie<number>();
  private rows: OrderForReportDto[];

  constructor(rows: OrderForReportDto[]) {
    this.rows = rows;
    rows.forEach((r, i) => {
      const words = tokens(
        `${r.orderNumber} ${r.patientName} ${r.patientPhone} ${r.items
          .map((t) => t.testName)
          .join(" ")}`,
      );
      for (const w of words) this.trie.insert(w, i);
    });
  }

  filter(query: string): OrderForReportDto[] {
    const words = tokens(query);
    if (words.length === 0) return this.rows;

    let hits: Set<number> | undefined;
    for (const w of words) {
      const current = new Set<number>(this.trie.startsWith(w));
      if (hits === undefined) {
        hits = current;
      } else {
        const prev: Set<number> = hits;
        const next = new Set<number>();
        prev.forEach((i: number) => {
          if (current.has(i)) next.add(i);
        });
        hits = next;
      }
      if (hits.size === 0) return [];
    }
    if (!hits) return this.rows;
    return Array.from(hits)
      .sort((a, b) => a - b)
      .map((i) => this.rows[i]);
  }
}
