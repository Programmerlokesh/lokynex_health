"use client";

import {
  SPEC_COLORS,
  specKind,
  type SpecKind,
} from "@/lib/clinic/specializations";
import AirIcon from "@mui/icons-material/Air";
import BiotechIcon from "@mui/icons-material/Biotech";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import CoronavirusIcon from "@mui/icons-material/Coronavirus";
import ElderlyIcon from "@mui/icons-material/Elderly";
import EmergencyIcon from "@mui/icons-material/Emergency";
import Face3Icon from "@mui/icons-material/Face3";
import FavoriteIcon from "@mui/icons-material/Favorite";
import HealingIcon from "@mui/icons-material/Healing";
import HearingIcon from "@mui/icons-material/Hearing";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import PsychologyIcon from "@mui/icons-material/Psychology";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import ScienceIcon from "@mui/icons-material/Science";
import SelfImprovementIcon from "@mui/icons-material/SelfImprovement";
import SpaIcon from "@mui/icons-material/Spa";
import VaccinesIcon from "@mui/icons-material/Vaccines";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import { Box } from "@mui/material";
import type { ElementType } from "react";

const ICONS: Record<SpecKind, ElementType> = {
  heart: FavoriteIcon,
  lungs: AirIcon,
  brain: PsychologyIcon,
  mind: SelfImprovementIcon,
  child: ChildCareIcon,
  woman: Face3Icon,
  eye: RemoveRedEyeIcon,
  ear: HearingIcon,
  bone: HealingIcon,
  stomach: RestaurantIcon,
  kidney: WaterDropIcon,
  hormone: MonitorHeartIcon,
  blood: BloodtypeIcon,
  cancer: BiotechIcon,
  skin: SpaIcon,
  infection: CoronavirusIcon,
  tooth: HealingIcon,
  scan: MonitorHeartIcon,
  lab: ScienceIcon,
  anaesthesia: VaccinesIcon,
  surgery: ContentCutIcon,
  elderly: ElderlyIcon,
  nutrition: RestaurantIcon,
  herbal: SpaIcon,
  emergency: EmergencyIcon,
  general: MedicalServicesIcon,
};

/**
 * Glossy 3D badge for a specialization: lit sphere, inner shading, a soft
 * floor shadow and a glossy highlight. Gently tilts on hover.
 */
export function SpecialtyIcon3D({
  specialization,
  size = 56,
}: {
  specialization: string | null | undefined;
  size?: number;
}) {
  const kind = specKind(specialization);
  const [light, base, dark] = SPEC_COLORS[kind];
  const Icon = ICONS[kind];

  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size + size * 0.18,
        position: "relative",
        flexShrink: 0,
        perspective: 300,
      }}
    >
      {/* floor shadow */}
      <Box
        sx={{
          position: "absolute",
          left: "14%",
          right: "14%",
          bottom: 0,
          height: size * 0.16,
          borderRadius: "50%",
          background: `radial-gradient(ellipse at center, ${dark}66 0%, transparent 70%)`,
          filter: "blur(2px)",
        }}
      />
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: "32%",
          position: "relative",
          display: "grid",
          placeItems: "center",
          color: "#fff",
          background: `radial-gradient(circle at 30% 22%, ${light} 0%, ${base} 55%, ${dark} 100%)`,
          boxShadow: `inset -${size * 0.07}px -${size * 0.1}px ${size * 0.18}px ${dark}99, inset ${size * 0.06}px ${size * 0.06}px ${size * 0.12}px #ffffff88, 0 ${size * 0.12}px ${size * 0.2}px ${base}66`,
          transform: "rotateX(8deg) rotateY(-8deg)",
          transition: "transform .35s ease",
          "&:hover": { transform: "rotateX(0deg) rotateY(0deg) scale(1.06)" },
          "@media (prefers-reduced-motion: reduce)": { transition: "none" },
          // glossy highlight
          "&::after": {
            content: '""',
            position: "absolute",
            top: "6%",
            left: "12%",
            width: "62%",
            height: "34%",
            borderRadius: "50%",
            background: "linear-gradient(180deg, #ffffffcc, #ffffff00)",
            pointerEvents: "none",
          },
        }}
      >
        <Icon
          sx={{
            fontSize: size * 0.52,
            filter: `drop-shadow(0 ${size * 0.04}px ${size * 0.05}px ${dark}cc)`,
            position: "relative",
            zIndex: 1,
          }}
        />
      </Box>
    </Box>
  );
}
