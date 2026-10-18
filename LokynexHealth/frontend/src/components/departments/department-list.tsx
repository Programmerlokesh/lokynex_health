"use client";

import {
  useCreateDepartment,
  useDeleteDepartment,
  useDepartments,
  useUpdateDepartmentStatus,
} from "@/hooks/use-departments";
import { getApiErrorMessage } from "@/lib/api-error";
import { DepartmentDto } from "@/types/department";
import AddIcon from "@mui/icons-material/Add";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  alpha,
  Box,
  Button,
  ButtonBase,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Skeleton,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  DEPT_GROUPS,
  DeptGroupId,
  DeptMeta,
  getDeptMeta,
} from "./department-meta";

type GroupFilter = DeptGroupId | "all";

interface DeptItem {
  dept: DepartmentDto;
  meta: DeptMeta;
}

function DepartmentTile({
  item,
  selected,
  index,
  onSelect,
  onMenu,
}: {
  item: DeptItem;
  selected: boolean;
  index: number;
  onSelect: () => void;
  onMenu: (anchor: HTMLElement) => void;
}) {
  const { dept, meta } = item;
  const { Icon, color } = meta;
  const inactive = dept.status !== "Active";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index, 12) * 0.02 }}
      style={{ position: "relative", minWidth: 0 }}
    >
      <ButtonBase
        onClick={onSelect}
        aria-pressed={selected}
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "flex-start",
          gap: { xs: 0.75, sm: 1.25 },
          textAlign: "left",
          p: { xs: 1.25, sm: 1.25 },
          pr: { sm: 5 },
          borderRadius: "14px",
          border: "1.5px solid",
          borderColor: selected ? color : "divider",
          bgcolor: selected ? alpha(color, 0.1) : "background.paper",
          opacity: inactive ? 0.62 : 1,
          transition:
            "border-color .15s, background-color .15s, transform .15s",
          "&:hover": { borderColor: color, bgcolor: alpha(color, 0.06) },
          "&:active": { transform: "scale(0.985)" },
        }}
      >
        <Box
          sx={{
            width: { xs: 32, sm: 38 },
            height: { xs: 32, sm: 38 },
            flexShrink: 0,
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color,
            bgcolor: alpha(color, selected ? 0.22 : 0.14),
          }}
        >
          <Icon size={19} strokeWidth={2} />
        </Box>
        <Box sx={{ minWidth: 0, width: "100%" }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              lineHeight: 1.25,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {dept.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {dept.testCount} test{dept.testCount === 1 ? "" : "s"}
            {inactive ? " · Inactive" : ""}
          </Typography>
        </Box>
      </ButtonBase>

      <IconButton
        size="small"
        aria-label={`Manage ${dept.name}`}
        onClick={(e) => onMenu(e.currentTarget)}
        sx={{
          position: "absolute",
          top: 4,
          right: 2,
          width: 32,
          height: 32,
          minWidth: "32px !important",
          minHeight: "32px !important",
          color: "text.secondary",
        }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
    </motion.div>
  );
}

export function DepartmentList({
  selectedId,
  onSelect,
  onDeleted,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDeleted?: (id: string) => void;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"), { noSsr: true });

  const { data: departments, isLoading, isError } = useDepartments();
  const createDepartment = useCreateDepartment();
  const updateStatus = useUpdateDepartmentStatus();
  const deleteDepartment = useDeleteDepartment();

  const [group, setGroup] = useState<GroupFilter>("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const [menu, setMenu] = useState<{
    anchor: HTMLElement;
    dept: DepartmentDto;
  } | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const [message, setMessage] = useState<{
    severity: "success" | "error";
    text: string;
  } | null>(null);
  const [toDelete, setToDelete] = useState<DepartmentDto | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const items = useMemo<DeptItem[]>(
    () =>
      (departments ?? [])
        .map((dept) => ({ dept, meta: getDeptMeta(dept.name) }))
        .sort((a, b) => a.dept.name.localeCompare(b.dept.name)),
    [departments],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const i of items) c[i.meta.group] = (c[i.meta.group] ?? 0) + 1;
    return c;
  }, [items]);

  // a group that has no departments any more falls back to "All"
  const activeGroup: GroupFilter =
    group !== "all" && counts[group] ? group : "all";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) =>
        (activeGroup === "all" || i.meta.group === activeGroup) &&
        (!q || i.dept.name.toLowerCase().includes(q)),
    );
  }, [items, activeGroup, query]);

  const limit = isMobile ? 6 : 10;
  const collapsible = filtered.length > limit;
  const showAll = expanded || !collapsible;

  let visible = filtered;
  if (!showAll) {
    visible = filtered.slice(0, limit);
    // keep the selected department visible even when it is further down
    const sel = filtered.find((i) => i.dept.id === selectedId);
    if (sel && !visible.includes(sel)) {
      visible = [sel, ...visible.slice(0, limit - 1)];
    }
  }

  function openAdd() {
    setNewName("");
    setAddError(null);
    setAddOpen(true);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setAddError(null);
    createDepartment.mutate(name, {
      onSuccess: () => {
        setAddOpen(false);
        setMessage({
          severity: "success",
          text: `Department "${name}" created.`,
        });
      },
      onError: (err) =>
        setAddError(
          getApiErrorMessage(err, "Could not create the department."),
        ),
    });
  }

  function handleToggle(dept: DepartmentDto) {
    const nextStatus = dept.status === "Active" ? "Inactive" : "Active";
    setMessage(null);
    updateStatus.mutate(
      { id: dept.id, status: nextStatus },
      {
        onError: (err) =>
          setMessage({
            severity: "error",
            text: getApiErrorMessage(err, "Could not change the status."),
          }),
      },
    );
  }

  function confirmDelete() {
    if (!toDelete) return;
    const dept = toDelete;
    setDeleteError(null);
    deleteDepartment.mutate(dept.id, {
      onSuccess: () => {
        setToDelete(null);
        onDeleted?.(dept.id);
        setMessage({
          severity: "success",
          text: `Department "${dept.name}" deleted.`,
        });
      },
      onError: (err) =>
        setDeleteError(
          getApiErrorMessage(err, "Could not delete the department."),
        ),
    });
  }

  return (
    <Box>
      {/* header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
          mb: 1.5,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Departments
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {items.length} total · tap one to see its tests
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={openAdd}
          sx={{ flexShrink: 0 }}
        >
          Department
        </Button>
      </Box>

      {/* search */}
      <TextField
        size="small"
        fullWidth
        placeholder="Search departments (X-Ray, MRI, Blood...)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: query ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                  edge="end"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          },
        }}
        sx={{ mb: 1.25 }}
      />

      {/* group filter chips — swipe sideways on a phone */}
      {items.length > 0 && (
        <Box
          sx={{
            display: "flex",
            gap: 0.75,
            overflowX: "auto",
            pb: 0.75,
            mb: 1,
            mx: { xs: -0.5, sm: 0 },
            px: { xs: 0.5, sm: 0 },
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          <Chip
            label={`All ${counts.all}`}
            clickable
            color={activeGroup === "all" ? "primary" : "default"}
            variant={activeGroup === "all" ? "filled" : "outlined"}
            onClick={() => setGroup("all")}
            sx={{ fontWeight: 600, flexShrink: 0 }}
          />
          {DEPT_GROUPS.filter((g) => counts[g.id]).map((g) => {
            const active = activeGroup === g.id;
            return (
              <Chip
                key={g.id}
                label={`${g.label} ${counts[g.id]}`}
                clickable
                onClick={() => setGroup(g.id)}
                variant={active ? "filled" : "outlined"}
                sx={{
                  fontWeight: 600,
                  flexShrink: 0,
                  borderColor: active ? g.color : alpha(g.color, 0.45),
                  color: active ? "#fff" : g.color,
                  bgcolor: active ? g.color : "transparent",
                  "&:hover": {
                    bgcolor: active ? g.color : alpha(g.color, 0.1),
                  },
                }}
              />
            );
          })}
        </Box>
      )}

      {message && (
        <Alert
          severity={message.severity}
          onClose={() => setMessage(null)}
          sx={{ mb: 1.25 }}
        >
          {message.text}
        </Alert>
      )}
      {isError && (
        <Alert severity="error" sx={{ mb: 1.25 }}>
          Failed to load departments.
        </Alert>
      )}

      {/* tiles */}
      {isLoading ? (
        <Box
          sx={{
            display: "grid",
            gap: 1.25,
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(auto-fill, minmax(190px, 1fr))",
            },
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={64} />
          ))}
        </Box>
      ) : items.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          No departments yet. Press “Department” to add the first one.
        </Typography>
      ) : filtered.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          No department matches “{query}”.
        </Typography>
      ) : (
        <>
          <Box
            sx={{
              display: "grid",
              gap: 1.25,
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                sm: "repeat(auto-fill, minmax(190px, 1fr))",
              },
              // when everything is shown, scroll inside the box — not the page
              ...(expanded && collapsible
                ? {
                    maxHeight: "min(52vh, 440px)",
                    overflowY: "auto",
                    overscrollBehavior: "contain",
                    pr: 0.5,
                    py: 0.25,
                  }
                : {}),
            }}
          >
            {visible.map((item, i) => (
              <DepartmentTile
                key={item.dept.id}
                item={item}
                index={i}
                selected={item.dept.id === selectedId}
                onSelect={() => onSelect(item.dept.id)}
                onMenu={(anchor) => setMenu({ anchor, dept: item.dept })}
              />
            ))}
          </Box>

          {collapsible && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
              <Button
                size="small"
                onClick={() => setExpanded((v) => !v)}
                endIcon={
                  <ExpandMoreIcon
                    sx={{
                      transition: "transform .2s",
                      transform: expanded ? "rotate(180deg)" : "none",
                    }}
                  />
                }
              >
                {expanded ? "Show less" : `Show all ${filtered.length}`}
              </Button>
            </Box>
          )}
        </>
      )}

      {/* per-department menu */}
      <Menu anchorEl={menu?.anchor} open={!!menu} onClose={() => setMenu(null)}>
        <MenuItem
          onClick={() => {
            if (menu) handleToggle(menu.dept);
            setMenu(null);
          }}
        >
          <ListItemIcon>
            {menu?.dept.status === "Active" ? (
              <BlockIcon fontSize="small" />
            ) : (
              <CheckCircleOutlinedIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText>
            {menu?.dept.status === "Active" ? "Mark Inactive" : "Mark Active"}
          </ListItemText>
        </MenuItem>
        <MenuItem
          sx={{ color: "error.main" }}
          onClick={() => {
            if (menu) {
              setDeleteError(null);
              setToDelete(menu.dept);
            }
            setMenu(null);
          }}
        >
          <ListItemIcon sx={{ color: "inherit" }}>
            <DeleteOutlineIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete department</ListItemText>
        </MenuItem>
      </Menu>

      {/* add department */}
      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>New department</DialogTitle>
        <Box component="form" onSubmit={handleCreate}>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
          >
            {addError && <Alert severity="error">{addError}</Alert>}
            <TextField
              autoFocus
              size="small"
              fullWidth
              label="Department name"
              placeholder="e.g. X-Ray, CT Scan, MRI"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setAddOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createDepartment.isPending || !newName.trim()}
            >
              {createDepartment.isPending ? "Adding..." : "Add"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* delete confirmation */}
      <Dialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete department?</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
        >
          {deleteError && <Alert severity="error">{deleteError}</Alert>}
          <DialogContentText>
            &quot;{toDelete?.name}&quot;
            {toDelete && toDelete.testCount > 0
              ? ` and its ${toDelete.testCount} test${toDelete.testCount === 1 ? "" : "s"} (with their commission settings)`
              : ""}{" "}
            will be permanently deleted. A department whose tests are already
            used in orders cannot be deleted — mark it Inactive instead.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setToDelete(null)} color="inherit">
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmDelete}
            disabled={deleteDepartment.isPending}
          >
            {deleteDepartment.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
