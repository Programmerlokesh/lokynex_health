"use client";

import { BranchesTable } from "@/components/branches/branches-table";
import { PageHeader, SearchBar, StatStrip } from "@/components/common/page-kit";
import { BranchIcon } from "@/components/icons/lab-icons";
import { useBranches } from "@/hooks/use-branches";
import { useDebounce } from "@/hooks/use-debounce";
import { Alert, Box, CircularProgress } from "@mui/material";
import { useState } from "react";

export default function BranchesPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isError } = useBranches({
    search: debouncedSearch || undefined,
    pageNumber: 1,
    pageSize: 20,
  });

  const items = data?.items ?? [];
  const activeCount = items.filter((b) => b.status === "Active").length;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <PageHeader
        icon={<BranchIcon />}
        title="Branches"
        subtitle="Your lab locations and their contact details"
      />

      {data && (
        <StatStrip
          items={[
            { label: "Total branches", value: data.totalCount },
            { label: "Active", value: activeCount, color: "#16A34A" },
            { label: "Inactive", value: items.length - activeCount },
          ]}
        />
      )}

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by branch name or code..."
      />

      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      )}
      {isError && <Alert severity="error">Failed to load branches.</Alert>}
      {data && <BranchesTable branches={items} />}
    </Box>
  );
}