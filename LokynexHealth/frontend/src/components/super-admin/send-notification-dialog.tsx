"use client";

import { useLabs, useSendNotification } from "@/hooks/use-super-admin";
import AddIcon from "@mui/icons-material/Add";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import { useState } from "react";

export function SendNotificationDialog() {
  const [open, setOpen] = useState(false);
  const [tenantId, setTenantId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const { data: labs } = useLabs({});
  const sendNotification = useSendNotification();

  function resetForm() {
    setTenantId("");
    setTitle("");
    setMessage("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !message) return;

    sendNotification.mutate(
      { tenantId: tenantId || undefined, title, message },
      {
        onSuccess: () => {
          setOpen(false);
          resetForm();
        },
      },
    );
  }

  return (
    <>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setOpen(true)}
      >
        Send Notification
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Send Notification</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            {sendNotification.isError && (
              <Alert severity="error">
                Could not send the notification. Please try again.
              </Alert>
            )}

            <TextField
              select
              label="Recipient"
              size="small"
              fullWidth
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
            >
              <MenuItem value="">All Tenants (Broadcast)</MenuItem>
              {labs?.items.map((lab) => (
                <MenuItem key={lab.id} value={lab.id}>
                  {lab.primaryBranchName} ({lab.labCode})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Title"
              size="small"
              fullWidth
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <TextField
              label="Message"
              size="small"
              fullWidth
              required
              multiline
              minRows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={sendNotification.isPending || !title || !message}
            >
              {sendNotification.isPending ? "Sending..." : "Send"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
