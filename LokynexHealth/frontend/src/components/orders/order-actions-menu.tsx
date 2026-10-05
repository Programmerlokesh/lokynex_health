"use client";

import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import DateRangeIcon from "@mui/icons-material/DateRange";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import GridViewIcon from "@mui/icons-material/GridView";
import ListAltIcon from "@mui/icons-material/ListAlt";
import NorthEastIcon from "@mui/icons-material/NorthEast";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import TableRowsOutlinedIcon from "@mui/icons-material/TableRowsOutlined";
import TodayIcon from "@mui/icons-material/Today";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import { Box, Button, CircularProgress, Popover } from "@mui/material";
import Link from "next/link";
import { useState } from "react";

export type OrderView = "cards" | "table";
export type QuickRange = "day" | "week" | "month";

interface Props {
  showDeleted: boolean;
  view: OrderView;
  downloading: boolean;
  onShowDeleted: (deleted: boolean) => void;
  onView: (view: OrderView) => void;
  onRange: (range: QuickRange) => void;
  onDownload: () => void;
}

const btnSx = {
  justifyContent: "center",
  borderRadius: 3,
  py: 1,
  fontWeight: 700,
} as const;

export function OrderActionsMenu({
  showDeleted,
  view,
  downloading,
  onShowDeleted,
  onView,
  onRange,
  onDownload,
}: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const close = () => setAnchor(null);
  const run = (fn: () => void) => () => {
    fn();
    close();
  };

  return (
    <>
      <Button
        variant="outlined"
        color="inherit"
        startIcon={<GridViewIcon fontSize="small" />}
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{
          borderRadius: 999,
          px: 2,
          borderColor: "divider",
          bgcolor: "background.paper",
          fontWeight: 700,
        }}
      >
        Actions
      </Button>

      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              p: 1.5,
              borderRadius: 4,
              width: { xs: "calc(100vw - 32px)", sm: 380 },
              maxWidth: 380,
              boxShadow: "0 18px 50px rgba(23,43,77,0.18)",
            },
          },
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 1,
          }}
        >
          {/* Deleted list <-> Active list */}
          <Button
            variant={showDeleted ? "outlined" : "contained"}
            color={showDeleted ? "primary" : "error"}
            startIcon={showDeleted ? <ListAltIcon /> : <DeleteOutlinedIcon />}
            onClick={run(() => onShowDeleted(!showDeleted))}
            sx={btnSx}
          >
            {showDeleted ? "Active List" : "Deleted List"}
          </Button>
          <Button
            variant={view === "cards" ? "contained" : "outlined"}
            color={view === "cards" ? "primary" : "inherit"}
            startIcon={<ViewModuleIcon />}
            onClick={run(() => onView("cards"))}
            sx={{ ...btnSx, borderColor: "divider" }}
          >
            Cards
          </Button>

          <Button
            variant="outlined"
            color="inherit"
            startIcon={<TodayIcon />}
            onClick={run(() => onRange("day"))}
            sx={{ ...btnSx, borderColor: "divider" }}
          >
            Day
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<DateRangeIcon />}
            onClick={run(() => onRange("week"))}
            sx={{ ...btnSx, borderColor: "divider" }}
          >
            Week
          </Button>

          <Button
            variant="outlined"
            color="inherit"
            startIcon={<CalendarMonthIcon />}
            onClick={run(() => onRange("month"))}
            sx={{ ...btnSx, borderColor: "divider" }}
          >
            Month
          </Button>
          <Button
            variant={view === "table" ? "contained" : "outlined"}
            color={view === "table" ? "primary" : "inherit"}
            startIcon={<TableRowsOutlinedIcon />}
            onClick={run(() => onView("table"))}
            sx={{ ...btnSx, borderColor: "divider" }}
          >
            Table
          </Button>

          <Button
            variant="contained"
            disabled={downloading}
            startIcon={
              downloading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <PictureAsPdfOutlinedIcon />
              )
            }
            onClick={run(onDownload)}
            sx={{ ...btnSx, gridColumn: "1 / -1" }}
          >
            Download PDF
          </Button>

          <Button
            component={Link}
            href="/dashboard"
            variant="outlined"
            color="inherit"
            startIcon={<DashboardOutlinedIcon />}
            endIcon={<NorthEastIcon sx={{ fontSize: 14 }} />}
            onClick={close}
            sx={{ ...btnSx, gridColumn: "1 / -1", borderColor: "divider" }}
          >
            Dashboard
          </Button>
        </Box>
      </Popover>
    </>
  );
}
