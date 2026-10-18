"use client";

import { DepartmentDto } from "@/types/department";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import {
  alpha,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useMemo, useState } from "react";
import { getDeptMeta } from "./department-meta";

// Popup where the lab ticks the departments it needs. A tick applies
// immediately; "Close" at the bottom just closes the popup.
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
      maxWidth="sm"
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
            Only the departments you tick are shown on this page.
          </Typography>
        </Box>
        <IconButton aria-label="Close" onClick={handleClose} edge="end">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}
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
          <List
            dense
            disablePadding
            sx={{
              maxHeight: { xs: "none", sm: 380 },
              overflowY: "auto",
              overscrollBehavior: "contain",
            }}
          >
            {filtered.map((d) => {
              const { Icon, color } = getDeptMeta(d.name);
              const checked = selectedIds.has(d.id);
              return (
                <ListItemButton
                  key={d.id}
                  onClick={() => onToggle(d.id)}
                  sx={{ borderRadius: 2, gap: 1 }}
                >
                  <Checkbox
                    edge="start"
                    size="small"
                    checked={checked}
                    tabIndex={-1}
                    disableRipple
                  />
                  <Box
                    sx={{
                      width: 30,
                      height: 30,
                      flexShrink: 0,
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color,
                      bgcolor: alpha(color, 0.14),
                    }}
                  >
                    <Icon size={16} strokeWidth={2} />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                      {d.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {d.testCount} test{d.testCount === 1 ? "" : "s"}
                      {d.status !== "Active" ? " · Inactive" : ""}
                    </Typography>
                  </Box>
                </ListItemButton>
              );
            })}
          </List>
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
