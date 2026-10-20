"use client";

import { useMedicineCompanies, useMedicineSearch } from "@/hooks/use-clinic";
import { useDebounce } from "@/hooks/use-debounce";
import type { ClinicMedicine, RxItem } from "@/types/clinic";
import {
  Autocomplete,
  Box,
  CircularProgress,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

export const fromMedicine = (m: ClinicMedicine): RxItem => ({
  medicineId: m.id,
  name: m.brandName,
  company: m.company,
  composition: m.composition ?? "",
  form: m.form ?? "",
  dosage: m.defaultDosage ?? "",
  duration: m.defaultDuration ?? "",
  instructions: m.defaultInstructions ?? "",
});

const label = (m: ClinicMedicine) =>
  m.company ? `${m.brandName} — ${m.company}` : m.brandName;

function ByName({ onAdd }: { onAdd: (i: RxItem) => void }) {
  const [input, setInput] = useState("");
  const q = useDebounce(input.trim(), 250);
  const { data, isFetching } = useMedicineSearch({ q });
  return (
    <Autocomplete<ClinicMedicine, false, false, true>
      freeSolo
      value={null}
      inputValue={input}
      onInputChange={(_, v, reason) => {
        if (reason !== "reset") setInput(v);
      }}
      options={data ?? []}
      filterOptions={(x) => x}
      getOptionLabel={(o) => (typeof o === "string" ? o : label(o))}
      loading={isFetching}
      clearOnBlur={false}
      onChange={(_, v) => {
        if (!v) return;
        if (typeof v === "string") {
          if (v.trim()) onAdd({ name: v.trim() });
        } else onAdd(fromMedicine(v));
        setInput("");
      }}
      renderOption={(props, m) => (
        <li {...props} key={m.id}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700 }} noWrap>
              {m.brandName}
              {m.form ? ` · ${m.form}` : ""}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              sx={{ display: "block" }}
            >
              {[m.company, m.composition].filter(Boolean).join(" · ")}
            </Typography>
          </Box>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          placeholder="Type a medicine name, then pick it (Enter adds it as typed)"
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              endAdornment: (
                <>
                  {isFetching ? <CircularProgress size={16} /> : null}
                  {params.slotProps.input.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  );
}

function ByCompany({ onAdd }: { onAdd: (i: RxItem) => void }) {
  const [companyInput, setCompanyInput] = useState("");
  const [company, setCompany] = useState<string | null>(null);
  const [medInput, setMedInput] = useState("");
  const cq = useDebounce(companyInput.trim(), 250);
  const mq = useDebounce(medInput.trim(), 250);
  const { data: companies, isFetching: cLoading } = useMedicineCompanies(cq);
  const { data: meds, isFetching: mLoading } = useMedicineSearch(
    { q: mq, company: company ?? undefined },
    !!company,
  );

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "1fr 1.4fr" },
        gap: 1.25,
      }}
    >
      <Autocomplete
        value={company}
        onChange={(_, v) => {
          setCompany(v);
          setMedInput("");
        }}
        inputValue={companyInput}
        onInputChange={(_, v) => setCompanyInput(v)}
        options={(companies ?? []).map((c) => c.company)}
        filterOptions={(x) => x}
        loading={cLoading}
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            label="1. Company"
            placeholder="e.g. Sun Pharma"
          />
        )}
      />
      <Autocomplete<ClinicMedicine, false, false, false>
        key={company ?? "none"}
        disabled={!company}
        value={null}
        inputValue={medInput}
        onInputChange={(_, v, reason) => {
          if (reason !== "reset") setMedInput(v);
        }}
        options={meds ?? []}
        filterOptions={(x) => x}
        getOptionLabel={label}
        loading={mLoading}
        onChange={(_, v) => {
          if (v) {
            onAdd(fromMedicine(v));
            setMedInput("");
          }
        }}
        renderOption={(props, m) => (
          <li {...props} key={m.id}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700 }} noWrap>
                {m.brandName}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                sx={{ display: "block" }}
              >
                {[m.composition, m.defaultDosage].filter(Boolean).join(" · ")}
              </Typography>
            </Box>
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            label="2. Medicine"
            placeholder={
              company ? "Type to narrow, or pick" : "Choose a company first"
            }
          />
        )}
      />
    </Box>
  );
}

/** Two ways to add a medicine: by its name, or company first and then its medicine. */
export function MedicineAdder({ onAdd }: { onAdd: (i: RxItem) => void }) {
  const [tab, setTab] = useState(0);
  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        p: 1.25,
        mb: 1.5,
      }}
    >
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          minHeight: 36,
          mb: 1,
          "& .MuiTab-root": { minHeight: 36, py: 0.5 },
        }}
      >
        <Tab label="By medicine name" />
        <Tab label="By company" />
      </Tabs>
      {tab === 0 ? <ByName onAdd={onAdd} /> : <ByCompany onAdd={onAdd} />}
    </Box>
  );
}
