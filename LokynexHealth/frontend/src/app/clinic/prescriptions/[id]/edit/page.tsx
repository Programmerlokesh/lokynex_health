"use client";

import { PageTitle } from "@/components/clinic/clinic-shell";
import { PrescriptionEditor } from "@/components/clinic/prescription/prescription-editor";
import { useParams } from "next/navigation";
import { Suspense } from "react";

export default function EditPrescriptionPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <>
      <PageTitle
        title="Edit prescription"
        subtitle="Changes replace the saved prescription."
      />
      <Suspense fallback={null}>
        <PrescriptionEditor prescriptionId={id} />
      </Suspense>
    </>
  );
}
