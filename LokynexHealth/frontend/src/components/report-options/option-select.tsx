"use client";

import {
  useCreateReportOption,
  useDeleteReportOption,
  useReportOptions,
} from "@/hooks/use-report-options";
import { ReportOptionKind } from "@/types/report-option";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import {
  Autocomplete,
  Box,
  IconButton,
  TextField,
  Tooltip,
} from "@mui/material";

/**
 * Dropdown of the lab's machines / reagents.
 *  - pick one from the list, OR
 *  - type a new name: it is added to the list automatically when the report /
 *    format is saved (or press the + button to add it right now).
 *  - the bin icon removes a name from the list (old reports keep their text).
 */
export function OptionSelect({
  kind,
  label,
  value,
  onChange,
}: {
  kind: ReportOptionKind;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const { data, isLoading, isError, refetch } = useReportOptions(kind);
  const create = useCreateReportOption();
  const remove = useDeleteReportOption();

  const options = data ?? [];
  const idByName = new Map(options.map((o) => [o.name.toLowerCase(), o.id]));
  const typed = value.trim();
  const canAdd = typed.length > 0 && !idByName.has(typed.toLowerCase());

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}>
      <Autocomplete
        freeSolo
        forcePopupIcon
        openOnFocus
        size="small"
        fullWidth
        loading={isLoading}
        options={options.map((o) => o.name)}
        value={value || null}
        inputValue={value}
        onInputChange={(_, v) => onChange(v)}
        onChange={(_, v) => onChange(typeof v === "string" ? v : "")}
        renderOption={(props, option) => {
          const { key, ...rest } = props;
          const id = idByName.get(option.toLowerCase());
          return (
            <li key={key} {...rest}>
              <Box
                sx={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <span>{option}</span>
                {id && (
                  <Tooltip title="Remove from list">
                    <IconButton
                      size="small"
                      edge="end"
                      aria-label={`Remove ${option}`}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          window.confirm(
                            `Remove "${option}" from the ${label.toLowerCase()} list?`,
                          )
                        )
                          remove.mutate(id);
                      }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </li>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            error={isError}
            helperText={
              isError ? (
                <span>
                  Could not load the list.{" "}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      void refetch();
                    }}
                  >
                    Retry
                  </a>
                </span>
              ) : (
                "Pick from the list or type a new one"
              )
            }
          />
        )}
      />
      {canAdd && (
        <Tooltip title="Add to list now">
          <span>
            <IconButton
              size="small"
              color="primary"
              aria-label={`Add ${typed} to list`}
              disabled={create.isPending}
              onClick={() => create.mutate({ kind, name: typed })}
            >
              <AddIcon />
            </IconButton>
          </span>
        </Tooltip>
      )}
    </Box>
  );
}
