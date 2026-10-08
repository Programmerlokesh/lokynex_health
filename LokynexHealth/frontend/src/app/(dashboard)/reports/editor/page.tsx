"use client";

import { ReportEditorScreen } from "@/components/report-editor/report-editor-screen";
import { Box, CircularProgress } from "@mui/material";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function EditorRoute() {
  const sp = useSearchParams();
  return (
    <ReportEditorScreen
      orderId={sp.get("orderId")}
      itemId={sp.get("itemId")}
      docId={sp.get("docId")}
      type={sp.get("type")}
    />
  );
}

export default function ReportEditorPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={28} />
        </Box>
      }
    >
      <EditorRoute />
    </Suspense>
  );
}