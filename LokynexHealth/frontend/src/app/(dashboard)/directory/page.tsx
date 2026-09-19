"use client";

import { CreateDoctorDialog } from "@/components/directory/create-doctor-dialog";
import { CreateReferralDialog } from "@/components/directory/create-referral-dialog";
import { CreateTechnicianDialog } from "@/components/directory/create-technician-dialog";
import { DirectoryTable } from "@/components/directory/directory-table";
import { TeamIcon } from "@/components/icons/lab-icons";
import { brand } from "@/components/providers/mui-theme-provider";
import { useDebounce } from "@/hooks/use-debounce";
import {
  useDoctorsList,
  useReferralsList,
  useTechniciansList,
} from "@/hooks/use-directory";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  CircularProgress,
  InputAdornment,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

export default function DirectoryPage() {
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const doctors = useDoctorsList(tab === 0 ? debouncedSearch : "");
  const referrals = useReferralsList(tab === 1 ? debouncedSearch : "");
  const technicians = useTechniciansList(tab === 2 ? debouncedSearch : "");

  const activeQuery = [doctors, referrals, technicians][tab];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
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
            <TeamIcon fontSize="small" />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Doctor / Referral / Technician
          </Typography>
        </Box>
        {tab === 0 && <CreateDoctorDialog />}
        {tab === 1 && <CreateReferralDialog />}
        {tab === 2 && <CreateTechnicianDialog />}
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Doctors" />
        <Tab label="Referrals" />
        <Tab label="Technicians" />
      </Tabs>

      <TextField
        placeholder="Search by name, email, or phone..."
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ width: "100%", maxWidth: 380 }}
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

      {activeQuery.isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={26} />
        </Box>
      )}

      {tab === 0 && doctors.data && (
        <DirectoryTable rows={doctors.data.items} />
      )}
      {tab === 1 && referrals.data && (
        <DirectoryTable rows={referrals.data.items} />
      )}
      {tab === 2 && technicians.data && (
        <DirectoryTable
          rows={technicians.data.items}
          extraColumn={{ header: "Branch", render: (row) => row.branchName }}
        />
      )}
    </Box>
  );
}
