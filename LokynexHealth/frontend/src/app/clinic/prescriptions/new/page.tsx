"use client";

import { PageTitle } from "@/components/clinic/clinic-shell";
import { PrescriptionEditor } from "@/components/clinic/prescription/prescription-editor";
import { Suspense } from "react";

export default function NewPrescriptionPage() {
  return (
    <>
      <PageTitle
        title="New prescription"
        subtitle="Fill the visit, patient, medicines and tests, then save."
      />
      <Suspense fallback={null}>
        <PrescriptionEditor />
      </Suspense>
    </>
  );
}
