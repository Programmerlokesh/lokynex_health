import { CreateOrderRequest } from "@/types/order";
import { PatientDto } from "@/types/patient";

export const RELATIONS = [
  "Wife",
  "Husband",
  "Son",
  "Daughter",
  "Father",
  "Mother",
  "Brother",
  "Sister",
  "Other",
] as const;

export type PatientSubject =
  | { kind: "guardian" }
  | { kind: "relative"; relativeId: string }
  | {
      kind: "newRelative";
      name: string;
      age: string;
      gender: string;
      relationship: string;
    };

export interface PatientFormState {
  phone: string;
  /** Existing guardian picked from the phone search (null = new patient). */
  guardian: PatientDto | null;
  // Used only when registering a NEW guardian:
  name: string;
  age: string;
  gender: string;
  address: string;
  subject: PatientSubject;
}

export const emptyPatientForm: PatientFormState = {
  phone: "",
  guardian: null,
  name: "",
  age: "",
  gender: "Male",
  address: "",
  subject: { kind: "guardian" },
};

/** Digits (plus a leading +) only, so "98300-12345" equals "98300 12345". */
export function normalizePhone(raw: string): string {
  const cleaned = raw.replace(/[^\d+]/g, "");
  return cleaned.replace(/(?!^)\+/g, "");
}

export function validatePatient(s: PatientFormState): string | null {
  if (normalizePhone(s.phone).length < 6)
    return "Enter the patient's phone number.";
  if ((!s.guardian || !s.guardian.fullName) && !s.name.trim())
    return "Enter the patient's name.";
  if (s.subject.kind === "newRelative") {
    if (!s.subject.name.trim()) return "Enter the family member's name.";
    if (!s.subject.relationship.trim())
      return "Select the family member's relation with the guardian.";
  }
  return null;
}

/** Name of the person the bill is actually for. */
export function subjectName(s: PatientFormState): string {
  if (s.subject.kind === "newRelative") return s.subject.name.trim();
  if (s.subject.kind === "relative" && s.guardian) {
    // Linear scan over a handful of family members; a Map would cost more than it saves.
    const id = s.subject.relativeId;
    return s.guardian.relatives.find((r) => r.id === id)?.name ?? "";
  }
  return s.guardian?.fullName ?? s.name.trim();
}

export function buildPatientPayload(
  s: PatientFormState,
): Pick<
  CreateOrderRequest,
  | "patientPhone"
  | "patientName"
  | "patientAge"
  | "patientGender"
  | "patientAddress"
  | "relativeId"
  | "relativeName"
  | "relativeAge"
  | "relativeGender"
  | "relativeRelationship"
> {
  const num = (v: string) => (v.trim() === "" ? undefined : Number(v));
  const base: ReturnType<typeof buildPatientPayload> = {
    patientPhone: normalizePhone(s.phone),
  };

  if (!s.guardian) {
    // Brand-new phone number: this person becomes the family guardian.
    base.patientName = s.name.trim();
    base.patientAge = num(s.age);
    base.patientGender = s.gender;
    base.patientAddress = s.address.trim() || undefined;
  } else if (!s.guardian.fullName && s.name.trim()) {
    // Old record saved without a name: let the server fill the gap.
    base.patientName = s.name.trim();
  }

  if (s.subject.kind === "relative") {
    base.relativeId = s.subject.relativeId;
  } else if (s.subject.kind === "newRelative") {
    base.relativeName = s.subject.name.trim();
    base.relativeAge = num(s.subject.age);
    base.relativeGender = s.subject.gender;
    base.relativeRelationship = s.subject.relationship.trim();
  }
  return base;
}
