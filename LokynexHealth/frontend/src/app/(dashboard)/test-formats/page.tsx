"use client";

import { Pill } from "@/components/report-builder/report-toolbar-ui";
import { cardSx, HeaderCard } from "@/components/reports/report-shell";
import { FormatEditor } from "@/components/test-format/format-editor";
import { useDebounce } from "@/hooks/use-debounce";
import { useTestFormat, useTestFormats } from "@/hooks/use-test-formats";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

type Filter = "all" | "with" | "none";

function FormatPane({
  testId,
  onBack,
  onDirtyChange,
}: {
  testId: string;
  onBack?: () => void;
  onDirtyChange: (d: boolean) => void;
}) {
  const q = useTestFormat(testId);

  if (q.isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }
  if (q.isError || !q.data) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => void q.refetch()}>
            Retry
          </Button>
        }
      >
        Could not load this test format.
      </Alert>
    );
  }

  // key changes after every save/refetch -> editor restarts from the saved data
  return (
    <FormatEditor
      key={`${testId}:${q.dataUpdatedAt}`}
      format={q.data}
      onBack={onBack}
      onDirtyChange={onDirtyChange}
    />
  );
}

function TestFormatsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const search = useSearchParams();

  const [text, setText] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<string | null>(search.get("test"));
  const [dirty, setDirty] = useState(false);

  const debounced = useDebounce(text, 350);
  const { data, isLoading, isError, refetch } = useTestFormats(
    debounced.trim(),
  );

  const all = data ?? [];
  const items = all.filter((t) =>
    filter === "with"
      ? t.parameterCount > 0
      : filter === "none"
        ? t.parameterCount === 0
        : true,
  );
  const withCount = all.filter((t) => t.parameterCount > 0).length;

  function select(id: string | null) {
    if (id === selected) return;
    if (dirty && !window.confirm("You have unsaved changes. Discard them?"))
      return;
    setDirty(false);
    setSelected(id);
  }

  const list = (
    <Box
      sx={{
        ...cardSx,
        p: 1.5,
        display: "grid",
        gap: 1.25,
        alignContent: "start",
        minWidth: 0,
      }}
    >
      <TextField
        size="small"
        placeholder="Search test or department"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <ToggleButtonGroup
        exclusive
        size="small"
        value={filter}
        onChange={(_, v: Filter | null) => v && setFilter(v)}
        sx={{ flexWrap: "wrap", gap: 0.75 }}
      >
        {(
          [
            ["all", `All ${all.length}`],
            ["with", `With format ${withCount}`],
            ["none", `No format ${all.length - withCount}`],
          ] as [Filter, string][]
        ).map(([v, label]) => (
          <ToggleButton
            key={v}
            value={v}
            sx={{
              borderRadius: "999px !important",
              border: 1,
              px: 1.5,
              py: 0.25,
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            {label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        >
          Could not load tests.
        </Alert>
      ) : items.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          No tests found. Add tests from Departments &amp; Tests first.
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 0.75,
            maxHeight: { md: "calc(100dvh - 300px)" },
            overflowY: "auto",
            pr: 0.5,
          }}
        >
          {items.map((t) => {
            const active = t.testId === selected;
            return (
              <Box
                key={t.testId}
                component="button"
                type="button"
                onClick={() => select(t.testId)}
                sx={{
                  textAlign: "left",
                  cursor: "pointer",
                  font: "inherit",
                  color: "text.primary",
                  bgcolor: active ? "action.selected" : "transparent",
                  border: 1,
                  borderColor: active ? "primary.main" : "divider",
                  borderRadius: 3,
                  px: 1.5,
                  py: 1,
                  display: "flex",
                  gap: 1,
                  alignItems: "center",
                  justifyContent: "space-between",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: 13.5,
                      wordBreak: "break-word",
                    }}
                  >
                    {t.testName}
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>
                    {t.departmentName}
                  </Typography>
                </Box>
                <Pill tone={t.parameterCount > 0 ? "success" : "warning"}>
                  {t.parameterCount > 0
                    ? `${t.parameterCount} params`
                    : "No format"}
                </Pill>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );

  const editor = selected ? (
    <FormatPane
      testId={selected}
      onBack={isMobile ? () => select(null) : undefined}
      onDirtyChange={setDirty}
    />
  ) : (
    <Box sx={{ ...cardSx, p: 4, textAlign: "center" }}>
      <Typography sx={{ fontWeight: 800, mb: 0.5 }}>Select a test</Typography>
      <Typography variant="body2" color="text.secondary">
        Choose a test on the left to edit its report format: parameters, units,
        normal ranges, machine and reagent.
      </Typography>
    </Box>
  );

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 2.5, minWidth: 0 }}
    >
      <HeaderCard
        title="Test Formats"
        subtitle="Parameters, units, normal ranges, machine & chemical details"
        note="Changes apply to new reports. Reports already saved keep their own reference ranges."
      />

      {isMobile ? (
        selected ? (
          editor
        ) : (
          list
        )
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 2.5,
            gridTemplateColumns: "minmax(300px, 380px) minmax(0, 1fr)",
            alignItems: "start",
          }}
        >
          {list}
          {editor}
        </Box>
      )}
    </Box>
  );
}

export default function TestFormatsPageWrapper() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={28} />
        </Box>
      }
    >
      <TestFormatsPage />
    </Suspense>
  );
}
