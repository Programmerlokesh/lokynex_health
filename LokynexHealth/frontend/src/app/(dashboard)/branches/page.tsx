"use client";

import { BranchesTable } from "@/components/branches/branches-table";
import { BranchIcon } from "@/components/icons/lab-icons";
import { brand } from "@/components/providers/mui-theme-provider";
import { useBranches } from "@/hooks/use-branches";
import { useDebounce } from "@/hooks/use-debounce";
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

export default function BranchesPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400); // typing settles before the API is called

  const { data, isLoading, isError } = useBranches({
    search: debouncedSearch || undefined,
    pageNumber: 1,
    pageSize: 20,
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            bgcolor: "#E0F2FE",
            color: brand.electricBlue,
            p: 1,
            borderRadius: 2,
            display: "flex",
          }}
        >
          <BranchIcon fontSize="small" />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Branches
        </Typography>
      </Box>

      <TextField
        placeholder="Search by branch name or code..."
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ width: "100%", maxWidth: 400 }}
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
      {isError && <Alert severity="error">Failed to load branches.</Alert>}
      {data && <BranchesTable branches={data.items} />}
    </Box>
  );
}
