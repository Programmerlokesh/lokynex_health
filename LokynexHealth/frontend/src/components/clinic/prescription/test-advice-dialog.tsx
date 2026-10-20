"use client";

import { useDialogFullScreen } from "@/components/clinic/clinic-ui";
import {
  useClinicTestDepartments,
  useClinicTestSearch,
} from "@/hooks/use-clinic";
import { useDebounce } from "@/hooks/use-debounce";
import type { ClinicTest, RxTest } from "@/types/clinic";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

/**
 * "Advise tests" popup. Type a test name -> suggestions from the LAB's own test catalog ->
 * click one and it is added at once. A name that is not in the catalog can be added as a custom test.
 */
export function TestAdviceDialog(props: {
  open: boolean;
  onClose: () => void;
  selected: RxTest[];
  onChange: (next: RxTest[]) => void;
}) {
  const { open, onClose, selected, onChange } = props;
  const fullScreen = useDialogFullScreen();
  const [text, setText] = useState("");
  const [dept, setDept] = useState<string | undefined>(undefined);
  const q = useDebounce(text.trim(), 250);

  const { data: departments } = useClinicTestDepartments(open);
  const { data: results, isFetching } = useClinicTestSearch(
    { q, departmentId: dept },
    open,
  );

  // Set of already-added names (lower case) -> O(1) "is it added?" check per suggestion row
  const chosen = useMemo(
    () => new Set(selected.map((t) => t.name.trim().toLowerCase())),
    [selected],
  );

  const add = (t: ClinicTest) => {
    if (chosen.has(t.name.trim().toLowerCase())) return;
    onChange([
      ...selected,
      {
        testId: t.id,
        name: t.name,
        departmentName: t.departmentName,
        note: "",
      },
    ]);
  };
  const addCustom = () => {
    const name = text.trim();
    if (!name || chosen.has(name.toLowerCase())) return;
    onChange([
      ...selected,
      { testId: null, name, departmentName: null, note: "" },
    ]);
    setText("");
  };
  const remove = (name: string) =>
    onChange(selected.filter((t) => t.name !== name));

  const exact = (results ?? []).some(
    (r) => r.name.trim().toLowerCase() === text.trim().toLowerCase(),
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{ fontWeight: 800 }}>Advise tests</DialogTitle>
      <DialogContent dividers>
        <TextField
          autoFocus
          fullWidth
          size="small"
          placeholder="Type a test name — e.g. CBC, HbA1c, Lipid…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const first = (results ?? []).find(
                (r) => !chosen.has(r.name.trim().toLowerCase()),
              );
              if (first && !exact) add(first);
              else if (!exact) addCustom();
            }
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: isFetching ? (
                <CircularProgress size={16} />
              ) : undefined,
            },
          }}
        />

        {!!departments?.length && (
          <Box
            sx={{
              display: "flex",
              gap: 0.75,
              overflowX: "auto",
              py: 1.25,
              scrollbarWidth: "thin",
            }}
          >
            <Chip
              label="All"
              size="small"
              color={dept ? "default" : "primary"}
              onClick={() => setDept(undefined)}
            />
            {departments.map((d) => (
              <Chip
                key={d.id}
                size="small"
                label={`${d.name} (${d.testCount})`}
                color={dept === d.id ? "primary" : "default"}
                onClick={() => setDept(dept === d.id ? undefined : d.id)}
              />
            ))}
          </Box>
        )}

        <List
          dense
          disablePadding
          sx={{
            maxHeight: { xs: "36dvh", sm: 280 },
            overflowY: "auto",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          {text.trim() && !exact && (
            <ListItemButton onClick={addCustom} sx={{ color: "primary.main" }}>
              <AddCircleOutlineIcon fontSize="small" sx={{ mr: 1 }} />
              <ListItemText primary={`Add “${text.trim()}” as a custom test`} />
            </ListItemButton>
          )}
          {(results ?? []).map((t) => {
            const added = chosen.has(t.name.trim().toLowerCase());
            return (
              <ListItemButton
                key={t.id}
                onClick={() => add(t)}
                disabled={added}
              >
                <ListItemText primary={t.name} secondary={t.departmentName} />
                {added && <CheckCircleIcon color="success" fontSize="small" />}
              </ListItemButton>
            );
          })}
          {!isFetching && !(results ?? []).length && !text.trim() && (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
              No tests in the lab catalog yet. Type a name to add a custom test.
            </Typography>
          )}
        </List>

        <Typography
          variant="subtitle2"
          sx={{ mt: 2, mb: 0.75, fontWeight: 800 }}
        >
          Selected ({selected.length})
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          {selected.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Nothing selected yet.
            </Typography>
          )}
          {selected.map((t) => (
            <Chip
              key={t.name}
              label={t.name}
              onDelete={() => remove(t.name)}
              color="primary"
              variant="outlined"
            />
          ))}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button variant="contained" onClick={onClose}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
