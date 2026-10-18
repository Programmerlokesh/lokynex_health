"use client";

import { DepartmentDto } from "@/types/department";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  ButtonBase,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useMemo, useState } from "react";
import { getDeptMeta } from "./department-meta";
import { DeptIconBadge } from "./dept-icon-badge";

// Popup where the lab picks the departments it needs. Every department is a
// rectangular tile; a selected tile gets its own colour border, tint and shadow.
// A tap applies immediately; "Close" at the bottom just closes the popup.
export function DepartmentSelectDialog({
  open,
  onClose,
  departments,
  selectedIds,
  onToggle,
  onSetMany,
}: {
  open: boolean;
  onClose: () => void;
  departments: DepartmentDto[];
  selectedIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onSetMany: (ids: string[], checked: boolean) => void;
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [query, setQuery] = useState("");

  const sorted = useMemo(
    () => [...departments].sort((a, b) => a.name.localeCompare(b.name)),
    [departments],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? sorted.filter((d) => d.name.toLowerCase().includes(q)) : sorted;
  }, [sorted, query]);

  const selectedCount = departments.filter((d) => selectedIds.has(d.id)).length;
  const filteredIds = filtered.map((d) => d.id);

  function handleClose() {
    setQuery("");
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      fullScreen={fullScreen}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          Select departments
          <Typography
            variant="caption"
            color="text.secondary"
            component="div"
            sx={{ fontWeight: 400 }}
          >
            Only the departments you select are shown on this page.
          </Typography>
        </Box>
        <IconButton aria-label="Close" onClick={handleClose} edge="end">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
      >
        <TextField
          size="small"
          fullWidth
          placeholder="Search departments..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {selectedCount} of {departments.length} selected
          </Typography>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Button
              size="small"
              disabled={filteredIds.length === 0}
              onClick={() => onSetMany(filteredIds, true)}
            >
              Select all{query.trim() ? " shown" : ""}
            </Button>
            <Button
              size="small"
              color="inherit"
              disabled={filteredIds.length === 0}
              onClick={() => onSetMany(filteredIds, false)}
            >
              Clear{query.trim() ? " shown" : ""}
            </Button>
          </Box>
        </Box>

        {departments.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            No departments yet. Add one from the Departments box first.
          </Typography>
        ) : filtered.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            No department matches “{query}”.
          </Typography>
        ) : (
          <Box
            sx={{
              display: "grid",
              gap: 1.25,
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                sm: "repeat(auto-fill, minmax(200px, 1fr))",
              },
              maxHeight: { xs: "none", sm: 440 },
              overflowY: "auto",
              overscrollBehavior: "contain",
              // room so the tile shadows are not clipped by the scroll box
              p: 0.75,
              m: -0.75,
            }}
          >
            {filtered.map((d) => {
              const { Icon, color } = getDeptMeta(d.name);
              const checked = selectedIds.has(d.id);
              const inactive = d.status !== "Active";
              return (
                <ButtonBase
                  key={d.id}
                  onClick={() => onToggle(d.id)}
                  aria-pressed={checked}
                  sx={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    gap: 1.25,
                    textAlign: "left",
                    p: 1.25,
                    pr: 4.5,
                    minHeight: 68,
                    borderRadius: "14px",
                    border: "1.5px solid",
                    borderColor: checked ? color : "divider",
                    bgcolor: checked ? alpha(color, 0.1) : "background.paper",
                    boxShadow: checked
                      ? `0 10px 24px -8px ${alpha(color, 0.6)}`
                      : "none",
                    opacity: inactive && !checked ? 0.7 : 1,
                    transform: checked ? "translateY(-1px)" : "none",
                    transition:
                      "border-color .18s, background-color .18s, box-shadow .18s, transform .18s",
                    "&:hover": {
                      borderColor: color,
                      bgcolor: alpha(color, checked ? 0.14 : 0.06),
                      boxShadow: `0 8px 20px -8px ${alpha(color, 0.5)}`,
                    },
                    "&:active": { transform: "scale(0.985)" },
                  }}
                >
                  <DeptIconBadge Icon={Icon} color={color} size={40} />

                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        lineHeight: 1.25,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {d.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                      component="div"
                    >
                      {d.testCount} test{d.testCount === 1 ? "" : "s"}
                      {inactive ? " · Inactive" : ""}
                    </Typography>
                  </Box>

                  {/* tick badge */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1.5px solid",
                      borderColor: checked ? color : "divider",
                      bgcolor: checked ? color : "transparent",
                      color: "#fff",
                      transition: "all .18s",
                    }}
                  >
                    <CheckIcon
                      sx={{
                        fontSize: 14,
                        opacity: checked ? 1 : 0,
                        transform: checked ? "scale(1)" : "scale(0.4)",
                        transition: "all .18s",
                      }}
                    />
                  </Box>
                </ButtonBase>
              );
            })}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button
          variant="contained"
          onClick={handleClose}
          fullWidth={fullScreen}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
