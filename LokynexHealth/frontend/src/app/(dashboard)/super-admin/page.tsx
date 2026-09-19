"use client";

import { SampleDropIcon } from "@/components/icons/lab-icons";
import { brand } from "@/components/providers/mui-theme-provider";
import { CreateLabDialog } from "@/components/super-admin/create-lab-dialog";
import { CreatePlanDialog } from "@/components/super-admin/create-plan-dialog";
import { CreateSubscriptionDialog } from "@/components/super-admin/create-subscription-dialog";
import { LabsTable } from "@/components/super-admin/labs-table";
import { NotificationsTable } from "@/components/super-admin/notifications-table";
import { PlansTable } from "@/components/super-admin/plans-table";
import { SendNotificationDialog } from "@/components/super-admin/send-notification-dialog";
import { SubscriptionsTable } from "@/components/super-admin/subscriptions-table";
import {
  useLabs,
  useNotifications,
  usePlans,
  useSubscriptions,
} from "@/hooks/use-super-admin";
import { Box, CircularProgress, Tab, Tabs, Typography } from "@mui/material";
import { useState } from "react";

const TABS = ["Labs", "Plans", "Subscriptions", "Notifications"];

export default function SuperAdminPage() {
  const [tab, setTab] = useState(0);

  const { data: labs, isLoading: labsLoading } = useLabs({});
  const { data: plans, isLoading: plansLoading } = usePlans();
  const { data: subscriptions, isLoading: subscriptionsLoading } =
    useSubscriptions({});
  const { data: notifications, isLoading: notificationsLoading } =
    useNotifications({});

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
            <SampleDropIcon fontSize="small" />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            SuperAdmin
          </Typography>
        </Box>

        {tab === 0 && <CreateLabDialog />}
        {tab === 1 && <CreatePlanDialog />}
        {tab === 2 && <CreateSubscriptionDialog />}
        {tab === 3 && <SendNotificationDialog />}
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        {TABS.map((t) => (
          <Tab key={t} label={t} />
        ))}
      </Tabs>

      {tab === 0 &&
        (labsLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <LabsTable rows={labs?.items ?? []} />
        ))}

      {tab === 1 &&
        (plansLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <PlansTable rows={plans ?? []} />
        ))}

      {tab === 2 &&
        (subscriptionsLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <SubscriptionsTable rows={subscriptions ?? []} />
        ))}

      {tab === 3 &&
        (notificationsLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <NotificationsTable rows={notifications ?? []} />
        ))}
    </Box>
  );
}
