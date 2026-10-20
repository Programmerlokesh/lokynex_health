// Types of the Doctor Clinic module. Field names match the backend DTOs (camelCase JSON).

export interface PagedList<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export type ClinicStatus = "Active" | "Inactive" | "Suspended";

/* ---------- SuperAdmin side ---------- */
export interface ClinicSummary {
  id: string;
  clinicCode: string;
  name: string;
  adminName: string;
  adminUsername: string;
  phone: string;
  userLimit: number;
  userCount: number;
  status: ClinicStatus;
  createdByName?: string | null;
  createdAt: string;
}

export interface ClinicDetail extends ClinicSummary {
  tagline?: string | null;
  address: string;
  email: string;
  pincode: string;
  registrationNo?: string | null;
  adminPhone: string;
  adminAddress?: string | null;
  adminEmail: string;
}

export interface CreateClinicRequest {
  clinicName: string;
  tagline?: string;
  address: string;
  phone: string;
  email: string;
  pincode: string;
  registrationNo?: string;
  adminName: string;
  adminPhone: string;
  adminAddress?: string;
  adminEmail: string;
  adminUsername: string;
  adminPassword: string;
  userLimit: number;
  doctorQualification?: string;
  doctorSpecialization?: string;
  doctorRegistrationNo?: string;
}

export interface UpdateClinicRequest {
  clinicName: string;
  tagline?: string;
  address: string;
  phone: string;
  email: string;
  pincode: string;
  registrationNo?: string;
  adminName: string;
  adminPhone: string;
  adminAddress?: string;
  adminEmail: string;
  userLimit: number;
  status: ClinicStatus;
}

/* ---------- signed-in clinic ---------- */
export interface ClinicMe {
  clinicId: string;
  clinicCode: string;
  clinicName: string;
  tagline?: string | null;
  address: string;
  phone: string;
  email: string;
  pincode: string;
  registrationNo?: string | null;
  logoUrl?: string | null;
  footerNote?: string | null;
  accentColor: string;
  actorName: string;
  actorUsername: string;
  actorRole: string;
  isAdmin: boolean;
  permissions: string[];
  userLimit: number;
  userCount: number;
}

export interface UpdateClinicProfileRequest {
  tagline?: string;
  address: string;
  phone: string;
  email: string;
  pincode: string;
  registrationNo?: string;
  logoUrl?: string;
  footerNote?: string;
  accentColor: string;
}

export interface ClinicDashboard {
  todayBookings: number;
  todayWaiting: number;
  todayPrescriptions: number;
  totalPatients: number;
  totalPrescriptions: number;
  monthIncome: number;
  monthOutflow: number;
  monthNet: number;
  recent: PrescriptionListItem[];
}

/* ---------- users ---------- */
export interface ClinicUser {
  id: string;
  name: string;
  username: string;
  email?: string | null;
  phone: string;
  role: string;
  permissions: string[];
  status: "Active" | "Inactive";
  createdAt: string;
}

export interface ClinicRolesMeta {
  modules: string[];
  moduleLabels: Record<string, string>;
  actions: string[];
  rolePresets: Record<string, string[]>;
}

export interface SaveClinicUserRequest {
  name: string;
  username?: string;
  email?: string;
  phone: string;
  role: string;
  permissions: string[];
  password?: string;
}

/* ---------- doctors / booking ---------- */
export interface ClinicDoctor {
  id: string;
  fullName: string;
  qualification?: string | null;
  specialization?: string | null;
  registrationNo?: string | null;
  phone?: string | null;
  email?: string | null;
  status: "Active" | "Inactive";
}

export interface SaveClinicDoctorRequest {
  fullName: string;
  qualification?: string;
  specialization?: string;
  registrationNo?: string;
  phone?: string;
  email?: string;
  status: "Active" | "Inactive";
}

export interface ClinicSchedule {
  id: string;
  doctorId: string;
  doctorName: string;
  dayOfWeek: number;
  slotMinutes: number;
  timeFrom: string; // HH:mm:ss
  timeTo: string;
  maxPatients: number;
  isActive: boolean;
}

export interface CreateClinicScheduleRequest {
  doctorId: string;
  dayOfWeek: number;
  slotMinutes: number;
  timeFrom: string;
  timeTo: string;
  maxPatients: number;
}

export interface ClinicSlot {
  timeSlot: string;
  maxPatients: number;
  bookedCount: number;
  availableCount: number;
  isFull: boolean;
}

export interface BookClinicAppointmentRequest {
  doctorId: string;
  bookingDate: string;
  timeSlot: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  patientAge?: number;
  patientGender?: string;
  note?: string;
  visitFee: number;
  paymentMethod?: string;
}

export interface ClinicBooking {
  id: string;
  doctorId: string;
  doctorName: string;
  bookingDate: string;
  timeSlot: string;
  serialNo: number;
  patientName: string;
  patientPhone: string;
  patientEmail?: string | null;
  patientAge?: number | null;
  patientGender?: string | null;
  reason?: string | null;
  visitFee: number;
  paymentMethod?: string | null;
  status: "Booked" | "Cancelled" | "Completed";
  prescriptionId?: string | null;
}

/* ---------- patients ---------- */
export interface ClinicPatient {
  id: string;
  name: string;
  age?: number | null;
  gender?: string | null;
  phone: string;
  whatsappNumber?: string | null;
  email?: string | null;
  address?: string | null;
  pincode?: string | null;
  lastVisitAt?: string | null;
  visitCount: number;
}

export interface ClinicPatientHistory {
  patient: ClinicPatient;
  prescriptions: PrescriptionListItem[];
}

/* ---------- medicines ---------- */
export interface ClinicMedicine {
  id: string;
  brandName: string;
  company: string;
  composition?: string | null;
  form?: string | null;
  defaultDosage?: string | null;
  defaultDuration?: string | null;
  defaultInstructions?: string | null;
  source: string;
  usageCount: number;
  isActive: boolean;
}

export interface SaveClinicMedicineRequest {
  brandName: string;
  company?: string;
  composition?: string;
  form?: string;
  defaultDosage?: string;
  defaultDuration?: string;
  defaultInstructions?: string;
  isActive: boolean;
}

export interface ClinicCompany {
  company: string;
  count: number;
}

export interface ImportMedicineRow {
  brandName: string;
  company?: string;
  composition?: string;
  form?: string;
}

/* ---------- lab test catalog ---------- */
export interface ClinicTest {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
}

export interface ClinicTestDepartment {
  id: string;
  name: string;
  testCount: number;
}

/* ---------- prescriptions ---------- */
export interface RxItem {
  medicineId?: string | null;
  name: string;
  company?: string | null;
  composition?: string | null;
  form?: string | null;
  dosage?: string | null;
  duration?: string | null;
  instructions?: string | null;
}

export interface RxTest {
  testId?: string | null;
  name: string;
  departmentName?: string | null;
  note?: string | null;
}

export interface PrescriptionListItem {
  id: string;
  rxNo: string;
  visitDate: string;
  patientName: string;
  patientAge?: number | null;
  patientPhone: string;
  doctorName: string;
  diagnosis?: string | null;
  medicineCount: number;
  testCount: number;
}

export interface Prescription {
  id: string;
  rxNo: string;
  visitDate: string;
  doctorId?: string | null;
  doctorName: string;
  doctorQualification?: string | null;
  doctorSpecialization?: string | null;
  doctorRegNo?: string | null;
  patientId?: string | null;
  patientName: string;
  patientAge?: number | null;
  patientGender?: string | null;
  patientPhone: string;
  patientWhatsapp?: string | null;
  patientEmail?: string | null;
  patientAddress?: string | null;
  patientPincode?: string | null;
  bookingId?: string | null;
  referral?: string | null;
  chiefComplaints?: string | null;
  diagnosis?: string | null;
  bp?: string | null;
  pulse?: string | null;
  temperature?: string | null;
  weight?: string | null;
  spo2?: string | null;
  generalAdvice?: string | null;
  followUpDate?: string | null;
  followUpNote?: string | null;
  items: RxItem[];
  tests: RxTest[];
  createdAt: string;
  updatedAt?: string | null;
}

export interface SavePrescriptionRequest {
  doctorId: string;
  visitDate: string;
  patientId?: string | null;
  patientName: string;
  patientAge?: number | null;
  patientGender?: string;
  patientPhone: string;
  patientWhatsapp?: string;
  patientEmail?: string;
  patientAddress?: string;
  patientPincode?: string;
  bookingId?: string | null;
  referral?: string;
  chiefComplaints?: string;
  diagnosis?: string;
  bp?: string;
  pulse?: string;
  temperature?: string;
  weight?: string;
  spo2?: string;
  generalAdvice?: string;
  followUpDate?: string | null;
  followUpNote?: string;
  items: RxItem[];
  tests: RxTest[];
}

/* ---------- ledger ---------- */
export type ClinicEntryType = "Income" | "Expense" | "Refund";

export interface ClinicLedgerEntry {
  id: string;
  entryDate: string;
  entryType: ClinicEntryType;
  category?: string | null;
  amount: number;
  paymentMethod?: string | null;
  referenceNo?: string | null;
  description?: string | null;
  source: "Manual" | "Booking" | "BookingRefund";
  createdAt: string;
}

export interface ClinicLedgerEntriesResult extends PagedList<ClinicLedgerEntry> {
  filteredIn: number;
  filteredOut: number;
  filteredNet: number;
}

export interface SaveClinicLedgerEntryRequest {
  entryDate: string;
  entryType: ClinicEntryType;
  category?: string;
  amount: number;
  paymentMethod?: string;
  referenceNo?: string;
  description?: string;
}