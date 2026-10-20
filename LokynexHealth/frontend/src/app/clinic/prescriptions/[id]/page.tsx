"use client";

import { PageTitle } from "@/components/clinic/clinic-shell";
import {
  ConfirmDialog,
  EmptyState,
  useToast,
} from "@/components/clinic/clinic-ui";
import { PrescriptionPreview } from "@/components/clinic/prescription/prescription-preview";
import {
  useClinicMe,
  usePrescription,
  usePrescriptionMutations,
} from "@/hooks/use-clinic";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  downloadBlob,
  normalizePhone,
  shareOnWhatsApp,
} from "@/lib/blood-report/share";
import { canDo } from "@/lib/clinic/permissions";
import {
  buildRxParts,
  fmtRxDate,
  printRx,
  rxToPdf,
} from "@/lib/clinic/prescription-html";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { Box, Button, CircularProgress } from "@mui/material";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function PrescriptionViewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast, toastNode } = useToast();
  const { data: rx, isLoading } = usePrescription(id);
  const { data: me } = useClinicMe();
  const { remove } = usePrescriptionMutations();
  const [busy, setBusy] = useState<"pdf" | "wa" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const parts = useMemo(
    () => (rx && me ? buildRxParts(rx, me) : null),
    [rx, me],
  );

  if (isLoading || !me)
    return (
      <Box sx={{ py: 8, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  if (!rx || !parts) return <EmptyState text="Prescription not found." />;

  const fileName = `Prescription-${rx.rxNo}-${rx.patientName.replace(/[^\w]+/g, "_")}.pdf`;
  const canEdit = canDo(me.permissions, me.isAdmin, "prescriptions", "edit");
  const canDelete = canDo(
    me.permissions,
    me.isAdmin,
    "prescriptions",
    "delete",
  );

  const downloadPdf = async () => {
    setBusy("pdf");
    try {
      downloadBlob(await rxToPdf(parts), fileName);
    } catch (e) {
      toast(
        e instanceof Error ? e.message : "Could not build the PDF.",
        "error",
      );
    } finally {
      setBusy(null);
    }
  };

  const sendWhatsApp = async () => {
    const phone = normalizePhone(rx.patientWhatsapp || rx.patientPhone);
    if (!phone) {
      toast("This patient has no valid WhatsApp number.", "error");
      return;
    }
    setBusy("wa");
    try {
      const blob = await rxToPdf(parts);
      const msg = `Dear ${rx.patientName}, here is your prescription (${rx.rxNo}) dated ${fmtRxDate(rx.visitDate)} from ${me.clinicName}. Get well soon.`;
      const res = await shareOnWhatsApp({
        blob,
        filename: fileName,
        phone,
        message: msg,
      });
      if (res === "opened")
        toast(
          "PDF downloaded and WhatsApp opened — attach the PDF to the chat.",
          "info",
        );
    } catch (e) {
      toast(
        e instanceof Error ? e.message : "Could not share on WhatsApp.",
        "error",
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageTitle
        title={`Prescription ${rx.rxNo}`}
        subtitle={`${rx.patientName} · ${fmtRxDate(rx.visitDate)}`}
        actions={
          <>
            <Button
              variant="contained"
              startIcon={<PrintOutlinedIcon />}
              onClick={() => printRx(parts, `Prescription ${rx.rxNo}`)}
            >
              Print
            </Button>
            <Button
              variant="outlined"
              startIcon={
                busy === "pdf" ? (
                  <CircularProgress size={16} />
                ) : (
                  <PictureAsPdfOutlinedIcon />
                )
              }
              disabled={!!busy}
              onClick={downloadPdf}
            >
              PDF
            </Button>
            <Button
              variant="outlined"
              color="success"
              startIcon={
                busy === "wa" ? (
                  <CircularProgress size={16} />
                ) : (
                  <WhatsAppIcon />
                )
              }
              disabled={!!busy}
              onClick={sendWhatsApp}
            >
              WhatsApp
            </Button>
            {canEdit && (
              <Button
                component={Link}
                href={`/clinic/prescriptions/${rx.id}/edit`}
                startIcon={<EditOutlinedIcon />}
              >
                Edit
              </Button>
            )}
            {canDelete && (
              <Button
                color="error"
                startIcon={<DeleteOutlinedIcon />}
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </Button>
            )}
          </>
        }
      />
      <PrescriptionPreview parts={parts} />
      <ConfirmDialog
        open={confirmDelete}
        title="Delete this prescription?"
        text="This cannot be undone. The appointment (if any) becomes open again."
        confirmLabel="Delete"
        danger
        busy={remove.isPending}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() =>
          remove.mutate(rx.id, {
            onSuccess: () => router.replace("/clinic/prescriptions"),
            onError: (e) => {
              setConfirmDelete(false);
              toast(getApiErrorMessage(e), "error");
            },
          })
        }
      />
      {toastNode}
    </>
  );
}
