"use client";

import { useCreateUser } from "@/hooks/use-users";
import AddIcon from "@mui/icons-material/Add";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
  });

  const createUser = useCreateUser();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createUser.mutate(
      {
        ...form,
        permissions: [
          {
            moduleId: 1,
            canView: true,
            canCreate: false,
            canEdit: false,
            canDelete: false,
          },
        ],
      },
      {
        onSuccess: () => {
          setOpen(false);
          setForm({
            name: "",
            username: "",
            email: "",
            phone: "",
            password: "",
          });
        },
      },
    );
  }

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        style={{ display: "inline-block" }}
      >
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          New User
        </Button>
      </motion.div>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle fontWeight={700}>Create User</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <TextField
              label="Full Name"
              size="small"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Username"
              size="small"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              size="small"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Phone"
              size="small"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              size="small"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              fullWidth
              slotProps={{ htmlInput: { minLength: 8 } }}
            />

            <AnimatePresence>
              {createUser.isError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Alert severity="error">
                    Failed to create user. Username or email may already exist.
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createUser.isPending}
            >
              {createUser.isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
