"use client";

import {
  useCreateDepartment,
  useDepartments,
  useUpdateDepartmentStatus,
} from "@/hooks/use-departments";
import { DepartmentDto } from "@/types/department";
import AddIcon from "@mui/icons-material/Add";
import {
  Box,
  Chip,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import { useState } from "react";

export function DepartmentList({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { data: departments, isLoading } = useDepartments();
  const createDepartment = useCreateDepartment();
  const updateStatus = useUpdateDepartmentStatus();

  const [newName, setNewName] = useState("");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    createDepartment.mutate(newName.trim(), {
      onSuccess: () => setNewName(""),
    });
  }

  function handleToggle(dept: DepartmentDto) {
    const nextStatus = dept.status === "Active" ? "Inactive" : "Active";
    updateStatus.mutate({ id: dept.id, status: nextStatus });
  }

  return (
    <Box sx={{ width: 280 }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
        Departments
      </Typography>

      <Box
        component="form"
        onSubmit={handleCreate}
        sx={{ display: "flex", gap: 1, mb: 2 }}
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
          disabled={createDepartment.isPending}
        >
          <AddIcon />
        </IconButton>
      </Box>

      {isLoading && (
        <Typography variant="body2" color="text.secondary">
          Loading...
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
                  "&.Mui-selected": { bgcolor: "#E0F2FE" },
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
                  sx={{ mr: 1 }}
                />
                <Switch
                  size="small"
                  checked={dept.status === "Active"}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => handleToggle(dept)}
                />
              </ListItemButton>
            </motion.div>
          );
        })}
      </List>
    </Box>
  );
}
