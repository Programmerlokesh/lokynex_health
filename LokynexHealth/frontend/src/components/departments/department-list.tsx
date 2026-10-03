"use client";

import {
  useCreateDepartment,
  useDeleteDepartment,
  useDepartments,
  useUpdateDepartmentStatus,
} from "@/hooks/use-departments";
import { getApiErrorMessage } from "@/lib/api-error";
import { DepartmentDto } from "@/types/department";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import { useState } from "react";

export function DepartmentList({
  selectedId,
  onSelect,
  onDeleted,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDeleted?: (id: string) => void;
}) {
  const { data: departments, isLoading, isError } = useDepartments();
  const createDepartment = useCreateDepartment();
  const updateStatus = useUpdateDepartmentStatus();
  const deleteDepartment = useDeleteDepartment();

  const [newName, setNewName] = useState("");
  const [message, setMessage] = useState<{
    severity: "success" | "error";
    text: string;
  } | null>(null);
  const [toDelete, setToDelete] = useState<DepartmentDto | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setMessage(null);
    createDepartment.mutate(name, {
      onSuccess: () => {
        setNewName("");
        setMessage({
          severity: "success",
          text: `Department "${name}" created.`,
        });
      },
      onError: (err) =>
        setMessage({
          severity: "error",
          text: getApiErrorMessage(err, "Could not create the department."),
        }),
    });
  }

  function handleToggle(dept: DepartmentDto) {
    const nextStatus = dept.status === "Active" ? "Inactive" : "Active";
    setMessage(null);
    updateStatus.mutate(
      { id: dept.id, status: nextStatus },
      {
        onError: (err) =>
          setMessage({
            severity: "error",
            text: getApiErrorMessage(err, "Could not change the status."),
          }),
      },
    );
  }

  function confirmDelete() {
    if (!toDelete) return;
    const dept = toDelete;
    setDeleteError(null);
    deleteDepartment.mutate(dept.id, {
      onSuccess: () => {
        setToDelete(null);
        onDeleted?.(dept.id);
        setMessage({
          severity: "success",
          text: `Department "${dept.name}" deleted.`,
        });
      },
      onError: (err) =>
        setDeleteError(
          getApiErrorMessage(err, "Could not delete the department."),
        ),
    });
  }

  return (
    <Box sx={{ width: { xs: "100%", md: 300 }, flexShrink: 0 }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
        Departments
      </Typography>

      <Box
        component="form"
        onSubmit={handleCreate}
        sx={{ display: "flex", gap: 1, mb: 1.5 }}
      >
        <TextField
          size="small"
          placeholder="New department"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          fullWidth
        />
        <IconButton
          type="submit"
          color="primary"
          aria-label="Add department"
          disabled={createDepartment.isPending || !newName.trim()}
        >
          <AddIcon />
        </IconButton>
      </Box>

      {message && (
        <Alert
          severity={message.severity}
          onClose={() => setMessage(null)}
          sx={{ mb: 1.5 }}
        >
          {message.text}
        </Alert>
      )}
      {isError && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          Failed to load departments.
        </Alert>
      )}

      {isLoading && (
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      )}
      {!isLoading && departments?.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No departments yet. Type a name above and press +.
        </Typography>
      )}

      <List sx={{ p: 0 }}>
        {departments?.map((dept, i) => {
          const isSelected = selectedId === dept.id;
          return (
            <motion.div
              key={dept.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
            >
              <ListItemButton
                selected={isSelected}
                onClick={() => onSelect(dept.id)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  "&.Mui-selected": { bgcolor: "action.selected" },
                }}
              >
                <ListItemText
                  primary={dept.name}
                  secondary={`${dept.testCount} test${dept.testCount === 1 ? "" : "s"}`}
                />
                <Chip
                  label={dept.status}
                  size="small"
                  color={dept.status === "Active" ? "success" : "default"}
                  variant="outlined"
                  sx={{ mr: 0.5 }}
                />
                <Switch
                  size="small"
                  checked={dept.status === "Active"}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => handleToggle(dept)}
                />
                <Tooltip title="Delete department">
                  <IconButton
                    size="small"
                    aria-label={`Delete ${dept.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteError(null);
                      setToDelete(dept);
                    }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </ListItemButton>
            </motion.div>
          );
        })}
      </List>

      <Dialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete department?</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
        >
          {deleteError && <Alert severity="error">{deleteError}</Alert>}
          <DialogContentText>
            &quot;{toDelete?.name}&quot;
            {toDelete && toDelete.testCount > 0
              ? ` and its ${toDelete.testCount} test${toDelete.testCount === 1 ? "" : "s"} (with their commission settings)`
              : ""}{" "}
            will be permanently deleted. A department whose tests are already
            used in orders cannot be deleted — mark it Inactive instead.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setToDelete(null)} color="inherit">
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmDelete}
            disabled={deleteDepartment.isPending}
          >
            {deleteDepartment.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
