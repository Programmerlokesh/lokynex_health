"use client";

import type { RichEditorHandle } from "@/components/report-editor/rich-editor";
import {
    applyFontSize,
    exec,
    FONT_FAMILIES,
    FONT_SIZES,
    insertHtml,
    insertImageFile,
    insertTable,
    notifyInput,
    restoreSelection,
    tableAddColumn,
    tableAddRow,
    tableDelete,
    tableDeleteColumn,
    tableDeleteRow,
} from "@/lib/report-editor/commands";
import type { Snippet } from "@/lib/report-editor/modality";
import BoltIcon from "@mui/icons-material/Bolt";
import FormatAlignCenterIcon from "@mui/icons-material/FormatAlignCenter";
import FormatAlignJustifyIcon from "@mui/icons-material/FormatAlignJustify";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import FormatAlignRightIcon from "@mui/icons-material/FormatAlignRight";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatClearIcon from "@mui/icons-material/FormatClear";
import FormatIndentDecreaseIcon from "@mui/icons-material/FormatIndentDecrease";
import FormatIndentIncreaseIcon from "@mui/icons-material/FormatIndentIncrease";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import RedoIcon from "@mui/icons-material/Redo";
import StrikethroughSIcon from "@mui/icons-material/StrikethroughS";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import UndoIcon from "@mui/icons-material/Undo";
import {
    Box,
    ButtonBase,
    Divider,
    IconButton,
    Menu,
    MenuItem,
    Select,
    Tooltip,
} from "@mui/material";
import { type ReactNode, useRef, useState } from "react";

interface MenuEntry {
  label: string;
  onClick?: () => void;
  hint?: string;
  divider?: boolean;
}

interface Props {
  getActive: () => RichEditorHandle | null;
  snippets: Snippet[];
  zoom: number;
  onZoom: (z: number) => void;
  showHeaderFooter: boolean;
  onToggleHeaderFooter: () => void;
  spellcheck: boolean;
  onToggleSpellcheck: () => void;
  onSave: () => void;
  onSaveTemplate: () => void;
  onPrint: () => void;
  onBack: () => void;
  onWordCount: () => void;
}

function TB({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip title={title}>
      <IconButton
        size="small"
        aria-label={title}
        // keep the selection inside the editor while clicking
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
        sx={{ borderRadius: "10px", flexShrink: 0 }}
      >
        {children}
      </IconButton>
    </Tooltip>
  );
}

const scrollRow = {
  display: "flex",
  alignItems: "center",
  gap: 0.25,
  overflowX: "auto",
  flexWrap: "nowrap",
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": { display: "none" },
} as const;

export function EditorChrome(props: Props) {
  const {
    getActive,
    snippets,
    zoom,
    onZoom,
    showHeaderFooter,
    onToggleHeaderFooter,
    spellcheck,
    onToggleSpellcheck,
    onSave,
    onSaveTemplate,
    onPrint,
    onBack,
    onWordCount,
  } = props;

  const [menu, setMenu] = useState<{ name: string; anchor: HTMLElement } | null>(
    null,
  );
  const [snipAnchor, setSnipAnchor] = useState<HTMLElement | null>(null);
  const [font, setFont] = useState("Arial");
  const [size, setSize] = useState(14);
  const fileRef = useRef<HTMLInputElement>(null);

  /** Restore caret -> run -> tell the editor something changed. */
  const run = (fn: () => void) => () => {
    restoreSelection();
    fn();
    notifyInput();
  };

  const pct = (z: number) => `${z === zoom ? "✓ " : ""}${Math.round(z * 100)}%`;

  const menus: Record<string, MenuEntry[]> = {
    File: [
      { label: "Save", hint: "Ctrl+S", onClick: onSave },
      { label: "Save as Template", onClick: onSaveTemplate },
      { label: "Print", onClick: onPrint, divider: true },
      { label: "Back to order", onClick: onBack },
    ],
    Edit: [
      { label: "Undo", hint: "Ctrl+Z", onClick: () => getActive()?.undo() },
      { label: "Redo", hint: "Ctrl+Y", onClick: () => getActive()?.redo() },
      { label: "Cut", onClick: run(() => exec("cut")), divider: true },
      { label: "Copy", onClick: run(() => exec("copy")) },
      { label: "Select all", onClick: run(() => exec("selectAll")), divider: true },
      { label: "Clear formatting", onClick: run(() => exec("removeFormat")) },
    ],
    View: [
      { label: pct(0.75), onClick: () => onZoom(0.75) },
      { label: pct(1), onClick: () => onZoom(1) },
      { label: pct(1.25), onClick: () => onZoom(1.25) },
      {
        label: `${showHeaderFooter ? "✓ " : ""}Show header & footer`,
        onClick: onToggleHeaderFooter,
        divider: true,
      },
    ],
    Insert: [
      {
        label: "Snippet…",
        onClick: () => setSnipAnchor(menu?.anchor ?? null),
        hint: "type /",
      },
      { label: "Table 3 × 3", onClick: run(() => insertTable(3, 3)), divider: true },
      { label: "Horizontal line", onClick: run(() => exec("insertHorizontalRule")) },
      {
        label: "Date & time",
        onClick: run(() => insertHtml(new Date().toLocaleString("en-IN"))),
      },
      { label: "Image…", onClick: () => fileRef.current?.click() },
      { label: "Symbol: ° × ± µ", onClick: run(() => insertHtml("° × ± µ")), divider: true },
    ],
    Format: [
      { label: "Bold", hint: "Ctrl+B", onClick: run(() => exec("bold")) },
      { label: "Italic", hint: "Ctrl+I", onClick: run(() => exec("italic")) },
      { label: "Underline", hint: "Ctrl+U", onClick: run(() => exec("underline")) },
      { label: "Strikethrough", onClick: run(() => exec("strikeThrough")) },
      { label: "Superscript", onClick: run(() => exec("superscript")) },
      { label: "Subscript", onClick: run(() => exec("subscript")), divider: true },
      { label: "Heading", onClick: run(() => exec("formatBlock", "h4")) },
      { label: "Paragraph", onClick: run(() => exec("formatBlock", "p")), divider: true },
      { label: "Align left", onClick: run(() => exec("justifyLeft")) },
      { label: "Align center", onClick: run(() => exec("justifyCenter")) },
      { label: "Align right", onClick: run(() => exec("justifyRight")) },
      { label: "Justify", onClick: run(() => exec("justifyFull")) },
    ],
    Tools: [
      { label: "Word count", onClick: onWordCount },
      {
        label: `${spellcheck ? "✓ " : ""}Spell check`,
        onClick: onToggleSpellcheck,
      },
    ],
    Table: [
      { label: "Insert 2 × 2", onClick: run(() => insertTable(2, 2)) },
      { label: "Insert 4 × 4", onClick: run(() => insertTable(4, 4)), divider: true },
      { label: "Add row below", onClick: run(() => tableAddRow(true)) },
      { label: "Add row above", onClick: run(() => tableAddRow(false)) },
      { label: "Add column right", onClick: run(tableAddColumn), divider: true },
      { label: "Delete row", onClick: run(tableDeleteRow) },
      { label: "Delete column", onClick: run(tableDeleteColumn) },
      { label: "Delete table", onClick: run(tableDelete) },
    ],
  };

  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 5,
        bgcolor: "background.paper",
      }}
    >
      {/* ───── menu bar (File / Edit / View …) ───── */}
      <Box sx={{ ...scrollRow, px: 1, py: 0.5 }}>
        {Object.keys(menus).map((name) => (
          <ButtonBase
            key={name}
            onClick={(e) => setMenu({ name, anchor: e.currentTarget })}
            sx={{
              px: 1.5,
              py: 0.75,
              borderRadius: "8px",
              fontSize: 13.5,
              fontWeight: 600,
              flexShrink: 0,
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            {name}
          </ButtonBase>
        ))}
      </Box>

      <Menu
        open={!!menu}
        anchorEl={menu?.anchor}
        onClose={() => setMenu(null)}
        slotProps={{ paper: { sx: { borderRadius: 3, minWidth: 210 } } }}
      >
        {menu &&
          menus[menu.name].map((m) => [
            m.divider && <Divider key={`${m.label}-d`} />,
            <MenuItem
              key={m.label}
              onClick={() => {
                const anchor = menu.anchor;
                setMenu(null);
                // let the menu close first so focus can return to the editor
                setTimeout(() => {
                  if (m.label === "Snippet…") setSnipAnchor(anchor);
                  else m.onClick?.();
                }, 0);
              }}
              sx={{ fontSize: 14, gap: 3, justifyContent: "space-between" }}
            >
              {m.label}
              {m.hint && (
                <Box component="span" sx={{ color: "text.secondary", fontSize: 12 }}>
                  {m.hint}
                </Box>
              )}
            </MenuItem>,
          ])}
      </Menu>

      {/* ───── snippet picker (same list as the "/" shortcut) ───── */}
      <Menu
        open={!!snipAnchor}
        anchorEl={snipAnchor}
        onClose={() => setSnipAnchor(null)}
        slotProps={{
          paper: { sx: { borderRadius: 3, maxHeight: 360, minWidth: 250 } },
        }}
      >
        {snippets.map((s) => (
          <MenuItem
            key={s.key}
            onClick={() => {
              setSnipAnchor(null);
              setTimeout(run(() => insertHtml(s.html)), 0);
            }}
            sx={{ fontSize: 14, gap: 2, justifyContent: "space-between" }}
          >
            {s.label}
            <Box component="span" sx={{ color: "text.secondary", fontSize: 12 }}>
              /{s.key}
            </Box>
          </MenuItem>
        ))}
      </Menu>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          if (f.size > 1.5 * 1024 * 1024) {
            window.alert("Image is larger than 1.5 MB. Please use a smaller image.");
            return;
          }
          insertImageFile(f, () => undefined);
        }}
      />

      <Divider />

      {/* ───── formatting toolbar (scrolls sideways on phones) ───── */}
      <Box sx={{ ...scrollRow, px: 1, py: 0.5, gap: 0.5 }}>
        <TB title="Undo" onClick={() => getActive()?.undo()}>
          <UndoIcon fontSize="small" />
        </TB>
        <TB title="Redo" onClick={() => getActive()?.redo()}>
          <RedoIcon fontSize="small" />
        </TB>

        <Tooltip title="Insert snippet (or type / in the text)">
          <IconButton
            size="small"
            aria-label="Insert snippet"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => setSnipAnchor(e.currentTarget)}
            sx={{
              borderRadius: "10px",
              flexShrink: 0,
              color: "primary.main",
            }}
          >
            <BoltIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Select
          size="small"
          value={font}
          onChange={(e) => {
            setFont(e.target.value);
            run(() => exec("fontName", e.target.value))();
          }}
          sx={{ minWidth: 130, flexShrink: 0, fontSize: 13 }}
        >
          {FONT_FAMILIES.map((f) => (
            <MenuItem key={f} value={f} sx={{ fontFamily: f }}>
              {f}
            </MenuItem>
          ))}
        </Select>

        <Select
          size="small"
          value={size}
          onChange={(e) => {
            const px = Number(e.target.value);
            setSize(px);
            run(() => applyFontSize(px))();
          }}
          sx={{ minWidth: 84, flexShrink: 0, fontSize: 13 }}
        >
          {FONT_SIZES.map((s) => (
            <MenuItem key={s} value={s}>
              {s}px
            </MenuItem>
          ))}
        </Select>

        <TB title="Bold" onClick={run(() => exec("bold"))}>
          <FormatBoldIcon fontSize="small" />
        </TB>
        <TB title="Italic" onClick={run(() => exec("italic"))}>
          <FormatItalicIcon fontSize="small" />
        </TB>
        <TB title="Underline" onClick={run(() => exec("underline"))}>
          <FormatUnderlinedIcon fontSize="small" />
        </TB>
        <TB title="Strikethrough" onClick={run(() => exec("strikeThrough"))}>
          <StrikethroughSIcon fontSize="small" />
        </TB>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        <TB title="Align left" onClick={run(() => exec("justifyLeft"))}>
          <FormatAlignLeftIcon fontSize="small" />
        </TB>
        <TB title="Align center" onClick={run(() => exec("justifyCenter"))}>
          <FormatAlignCenterIcon fontSize="small" />
        </TB>
        <TB title="Align right" onClick={run(() => exec("justifyRight"))}>
          <FormatAlignRightIcon fontSize="small" />
        </TB>
        <TB title="Justify" onClick={run(() => exec("justifyFull"))}>
          <FormatAlignJustifyIcon fontSize="small" />
        </TB>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        <TB title="Bulleted list" onClick={run(() => exec("insertUnorderedList"))}>
          <FormatListBulletedIcon fontSize="small" />
        </TB>
        <TB title="Numbered list" onClick={run(() => exec("insertOrderedList"))}>
          <FormatListNumberedIcon fontSize="small" />
        </TB>
        <TB title="Decrease indent" onClick={run(() => exec("outdent"))}>
          <FormatIndentDecreaseIcon fontSize="small" />
        </TB>
        <TB title="Increase indent" onClick={run(() => exec("indent"))}>
          <FormatIndentIncreaseIcon fontSize="small" />
        </TB>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        <TB title="Insert table 3×3" onClick={run(() => insertTable(3, 3))}>
          <TableChartOutlinedIcon fontSize="small" />
        </TB>
        <TB title="Insert image" onClick={() => fileRef.current?.click()}>
          <ImageOutlinedIcon fontSize="small" />
        </TB>
        <TB title="Clear formatting" onClick={run(() => exec("removeFormat"))}>
          <FormatClearIcon fontSize="small" />
        </TB>
      </Box>
      <Divider />
    </Box>
  );
}