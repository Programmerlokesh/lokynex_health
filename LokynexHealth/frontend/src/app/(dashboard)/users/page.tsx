"use client";

import { PageHeader, SearchBar, StatStrip } from "@/components/common/page-kit";
import { CreateUserDialog } from "@/components/users/create-user-dialog";
import { UsersTable } from "@/components/users/users-table";
import { useDebounce } from "@/hooks/use-debounce";
import { useUsers } from "@/hooks/use-users";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import { Alert, Box, CircularProgress } from "@mui/material";
import { useState } from "react";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 400);

  const { data, isLoading, isError } = useUsers({
    search: debounced || undefined,
    pageNumber: 1,
    pageSize: 20,
  });

  const items = data?.items ?? [];
  const active = items.filter((u) => u.status === "Active").length;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <PageHeader
        icon={<PeopleAltOutlinedIcon />}
        tint="#EDE9FE"
        color="#7C3AED"
        title="Users"
        subtitle="Staff accounts, roles and branch access"
        actions={<CreateUserDialog />}
      />

      {data && (
        <StatStrip
          items={[
            { label: "Total users", value: data.totalCount },
            { label: "Active", value: active, color: "#16A34A" },
            { label: "Inactive", value: items.length - active },
          ]}
        />
      )}

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by name, username, email, or phone..."
      />

      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      )}
      {isError && <Alert severity="error">Failed to load users.</Alert>}
      {data && <UsersTable users={items} />}
    </Box>
  );
}