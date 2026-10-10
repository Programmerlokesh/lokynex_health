export interface TestFormatListItemDto {
  testId: string;
  testName: string;
  departmentName: string;
  parameterCount: number;
}

export interface TestFormatRangeDto {
  gender: "Male" | "Female" | "Other" | null;
  ageMinDays: number | null;
  ageMaxDays: number | null;
  lowValue: number | null;
  highValue: number | null;
  criticalLow: number | null;
  criticalHigh: number | null;
  normalText: string | null;
  displayText: string | null;
}

export type ResultType = "Auto" | "Numeric" | "Text";

export interface TestFormatParameterDto {
  id: string | null;
  sectionName: string;
  name: string;
  unit: string | null;
  resultType: ResultType;
  isBold: boolean;
  ranges: TestFormatRangeDto[];
}

export interface TestFormatDto {
  testId: string;
  testName: string;
  departmentName: string;
  specimen: string | null;
  method: string | null;
  machineName: string | null;
  reagentName: string | null;
  interpretation: string | null;
  parameters: TestFormatParameterDto[];
}

export interface SaveTestFormatRequest {
  specimen: string | null;
  method: string | null;
  machineName: string | null;
  reagentName: string | null;
  interpretation: string | null;
  parameters: TestFormatParameterDto[];
}
