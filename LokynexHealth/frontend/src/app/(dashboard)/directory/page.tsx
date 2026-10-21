"use client";

import { PageHeader, SearchBar } from "@/components/common/page-kit";
import { CreateDoctorDialog } from "@/components/directory/create-doctor-dialog";
import { CreateReferralDialog } from "@/components/directory/create-referral-dialog";
import { CreateTechnicianDialog } from "@/components/directory/create-technician-dialog";
import { DirectoryTable } from "@/components/directory/directory-table";
import { TeamIcon } from "@/components/icons/lab-icons";
import { useDebounce } from "@/hooks/use-debounce";
import {
  useDoctorsList,
  useReferralsList,
  useTechniciansList,
} from "@/hooks/use-directory";
import { getApiErrorMessage } from "@/lib/api-error";
import HandshakeOutlinedIcon from "@mui/icons-material/HandshakeOutlined";
import MedicalServicesOutlinedIcon from "@mui/icons-material/MedicalServicesOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import { ReactNode, useState } from "react";

const TABS: { label: string; color: string; tint: string; icon: ReactNode }[] = [
  { label: "Doctors", color: "#0EA5E9", tint: "#E0F2FE", icon: <MedicalServicesOutlinedIcon /> },
  { label: "Referrals", color: "#7C3AED", tint: "#EDE9FE", icon: <HandshakeOutlinedIcon /> },
  { label: "Technicians", color: "#00BFA6", tint: "#CCFBF1", icon: <ScienceOutlinedIcon /> },
];

export default function DirectoryPage() {
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  // Only the visible tab hits the API (search is "" for the others -> cached list).
  const doctors = useDoctorsList(tab === 0 ? debouncedSearch : "");
  const referrals = useReferralsList(tab === 1 ? debouncedSearch : "");
  const technicians = useTechniciansList(tab === 2 ? debouncedSearch : "");

  const queries = [doctors, referrals, technicians];
  const activeQuery = queries[tab];
  const t = TABS[tab];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <PageHeader
        icon={<TeamIcon />}
        title="Doctor / Referral / Technician"
        subtitle="People who refer patients or work in your lab"
        actions={
          tab === 0 ? (
            <CreateDoctorDialog />
          ) : tab === 1 ? (
            <CreateReferralDialog />
          ) : (
            <CreateTechnicianDialog />
          )
        }
      />

      {/* three big switch cards, each shows its own count */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
          gap: 1.5,
        }}
      >
        {TABS.map((x, i) => {
          const on = i === tab;
          const count = queries[i].data?.totalCount ?? queries[i].data?.items.length;
          return (
            <Box
              key={x.label}
              component="button"
              type="button"
              onClick={() => {
                setTab(i);
                setSearch("");
              }}
              sx={{
                font: "inherit",
                textAlign: "left",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1.75,
                borderRadius: "18px",
                color: "text.primary",
                bgcolor: on ? x.tint : "background.paper",
                border: "2px solid",
                borderColor: on ? x.color : "divider",
                transition: "border-color .15s, background-color .15s",
              }}
            >
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: "12px",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: on ? x.color : x.tint,
                  color: on ? "#fff" : x.color,
                }}
              >
                {x.icon}
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, color: on ? "#172B4D" : undefined }}>
                  {x.label}
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: on ? "#475569" : "text.secondary" }}>
                  {count !== undefined ? `${count} listed` : "—"}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder={`Search ${t.label.toLowerCase()} by name, email, or phone...`}
        maxWidth={420}
      />

      {activeQuery.isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={26} />
        </Box>
      )}

      {activeQuery.isError && (
        <Alert severity="error">
          {getApiErrorMessage(activeQuery.error, "Could not load the list.")}
        </Alert>
      )}

      {tab === 0 && doctors.data && (
        <DirectoryTable kind="doctor" rows={doctors.data.items} />
      )}
      {tab === 1 && referrals.data && (
        <DirectoryTable kind="referral" rows={referrals.data.items} />
      )}
      {tab === 2 && technicians.data && (
        <DirectoryTable kind="technician" rows={technicians.data.items} />
      )}
    </Box>
  );
}