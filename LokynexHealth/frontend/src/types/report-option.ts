export type ReportOptionKind = "Machine" | "Reagent";

export interface ReportOptionDto {
  id: string;
  kind: ReportOptionKind;
  name: string;
}
