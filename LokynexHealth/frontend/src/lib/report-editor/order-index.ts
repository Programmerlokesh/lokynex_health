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

    let hits: Set<number> | null = null;
    for (const w of words) {
      const current = new Set(this.trie.startsWith(w));
      hits = hits ? new Set([...hits].filter((i) => current.has(i))) : current;
      if (hits.size === 0) return [];
    }
    return [...(hits as Set<number>)]
      .sort((a, b) => a - b)
      .map((i) => this.rows[i]);
  }
}
