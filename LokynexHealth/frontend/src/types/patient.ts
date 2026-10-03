export interface PatientRelativeDto {
  id: string;
  name: string;
  age?: number | null;
  gender?: string | null;
  /** Relation to the guardian (Wife, Son, ...). */
  relationship?: string | null;
}

export interface PatientDto {
  id: string;
  patientCode: string;
  /** The family guardian (first person registered under this phone). */
  fullName: string;
  phone: string;
  age?: number | null;
  gender?: string | null;
  address?: string | null;
  email?: string | null;
  relatives: PatientRelativeDto[];
}
