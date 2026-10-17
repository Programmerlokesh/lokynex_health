export type ReportOptionKind = "Machine" | "Reagent";

export interface ReportOptionDto {
  id: string;
  kind: ReportOptionKind;
  name: string;
  /** comma separated test categories; null = every test */
  categories: string | null;
}
