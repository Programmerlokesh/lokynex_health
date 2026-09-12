"use client";

import { CreateUserDialog } from "@/components/users/create-user-dialog";
import { UsersTable } from "@/components/users/users-table";
import { useUsers } from "@/hooks/use-users";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Box,
  CircularProgress,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

export default function UsersPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useUsers({
    search: search || undefined,
    pageNumber: 1,
    pageSize: 20,
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Users
        </Typography>
        <CreateUserDialog />
      </Box>

      <TextField
        placeholder="Search by name, username, email, or phone..."
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ maxWidth: 400 }}
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

      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      )}
      {isError && <Alert severity="error">Failed to load users.</Alert>}
      {data && <UsersTable users={data.items} />}
    </Box>
  );
}
