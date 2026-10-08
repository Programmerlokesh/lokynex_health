"use client";

import { rememberSelection } from "@/lib/report-editor/commands";
import { UndoHistory } from "@/lib/report-editor/history";
import type { Snippet } from "@/lib/report-editor/modality";
import { escapeHtml, sanitizeHtml } from "@/lib/report-editor/sanitize";
import { Trie } from "@/lib/report-editor/trie";
import { Box, List, ListItemButton, ListItemText, Paper } from "@mui/material";
import {
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

export interface RichEditorHandle {
  undo: () => void;
  redo: () => void;
  getHtml: () => string;
  getText: () => string;
  focus: () => void;
}

interface Suggest {
  items: Snippet[];
  index: number;
  x: number;
  y: number;
}

interface Token {
  query: string;
  node: Text;
  start: number;
  end: number;
}

/** Text typed right before the caret that looks like "/liv". */
function currentToken(): Token | null {
  const sel = window.getSelection();
  if (!sel || !sel.isCollapsed || !sel.anchorNode) return null;
  const node = sel.anchorNode;
  if (node.nodeType !== Node.TEXT_NODE) return null;
  const before = (node.textContent ?? "").slice(0, sel.anchorOffset);
  const m = /(?:^|\s)\/([a-z0-9-]*)$/i.exec(before);
  if (!m) return null;
  return {
    query: m[1],
    node: node as Text,
    start: sel.anchorOffset - m[1].length - 1,
    end: sel.anchorOffset,
  };
}

function caretToEnd(el: HTMLElement) {
  const r = document.createRange();
  r.selectNodeContents(el);
  r.collapse(false);
  const s = window.getSelection();
  s?.removeAllRanges();
  s?.addRange(r);
}

export function RichEditor({
  initialHtml,
  resetKey,
  snippets,
  minHeight = 80,
  spellCheck = true,
  ariaLabel,
  onChange,
  onActivate,
  ref,
}: {
  initialHtml: string;
  /** Editor content is re-seeded only when this changes (never on re-fetch). */
  resetKey: string;
  snippets: Snippet[];
  minHeight?: number;
  spellCheck?: boolean;
  ariaLabel: string;
  onChange: () => void;
  onActivate: () => void;
  ref?: Ref<RichEditorHandle>;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<UndoHistory | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const onChangeRef = useRef(onChange);
  const [suggest, setSuggest] = useState<Suggest | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const trie = useMemo(() => {
    const t = new Trie<Snippet>();
    snippets.forEach((s) => t.insert(s.key, s));
    return t;
  }, [snippets]);

  // Seed once per resetKey. Later prop changes (e.g. after save + refetch) are
  // ignored on purpose so the caret and unsaved typing are never overwritten.
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    el.innerHTML = sanitizeHtml(initialHtml);
    historyRef.current = new UndoHistory(el.innerHTML);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const flush = useCallback(() => {
    window.clearTimeout(timerRef.current);
    const el = elRef.current;
    if (el) historyRef.current?.push(el.innerHTML);
  }, []);

  const applySnapshot = useCallback((html: string | null) => {
    const el = elRef.current;
    if (html === null || !el) return;
    el.innerHTML = html;
    el.focus();
    caretToEnd(el);
    onChangeRef.current();
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      undo: () => {
        flush();
        applySnapshot(historyRef.current?.undo() ?? null);
      },
      redo: () => applySnapshot(historyRef.current?.redo() ?? null),
      getHtml: () => elRef.current?.innerHTML ?? "",
      getText: () => elRef.current?.innerText ?? "",
      focus: () => elRef.current?.focus(),
    }),
    [flush, applySnapshot],
  );

  function updateSuggest() {
    const tok = currentToken();
    if (!tok) return setSuggest(null);
    const items = trie.startsWith(tok.query, 8);
    if (items.length === 0) return setSuggest(null);

    const sel = window.getSelection();
    let rect: DOMRect | null = null;
    if (sel && sel.rangeCount > 0) {
      const r = sel.getRangeAt(0).cloneRange();
      r.collapse(true);
      rect = r.getBoundingClientRect();
    }
    if (!rect || (!rect.top && !rect.height)) {
      rect = elRef.current?.getBoundingClientRect() ?? null;
    }
    setSuggest((prev) => ({
      items,
      index:
        prev && prev.items[0] === items[0]
          ? Math.min(prev.index, items.length - 1)
          : 0,
      x: rect?.left ?? 16,
      y: rect?.bottom ?? 16,
    }));
  }

  function accept(snippet: Snippet) {
    const tok = currentToken();
    if (!tok) return setSuggest(null);
    const range = document.createRange();
    range.setStart(tok.node, tok.start);
    range.setEnd(tok.node, tok.end);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    document.execCommand("insertHTML", false, snippet.html);
    setSuggest(null);
  }

  function handleInput() {
    onChangeRef.current();
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(flush, 400);
    updateSuggest();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (suggest) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const dir = e.key === "ArrowDown" ? 1 : -1;
        setSuggest({
          ...suggest,
          index:
            (suggest.index + dir + suggest.items.length) % suggest.items.length,
        });
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        accept(suggest.items[suggest.index]);
        return;
      }
      if (e.key === "Escape") {
        setSuggest(null);
        return;
      }
    }

    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === "z") {
      e.preventDefault();
      flush();
      applySnapshot(
        e.shiftKey
          ? (historyRef.current?.redo() ?? null)
          : (historyRef.current?.undo() ?? null),
      );
    } else if (mod && e.key.toLowerCase() === "y") {
      e.preventDefault();
      applySnapshot(historyRef.current?.redo() ?? null);
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");
    document.execCommand(
      "insertHTML",
      false,
      html ? sanitizeHtml(html) : escapeHtml(text).replace(/\n/g, "<br>"),
    );
  }

  return (
    <>
      <Box
        ref={elRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        spellCheck={spellCheck}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onFocus={onActivate}
        onBlur={() => {
          if (elRef.current) rememberSelection(elRef.current);
          setSuggest(null);
        }}
        sx={{
          minHeight,
          outline: "none",
          wordBreak: "break-word",
          overflowWrap: "anywhere",
          lineHeight: 1.45,
          "&:focus": { boxShadow: "inset 0 0 0 1px rgba(25,118,210,0.35)" },
          "& p": { m: "2px 0 6px" },
          "& h2": { fontSize: 20, m: "4px 0" },
          "& h3": { fontSize: 16, m: "4px 0" },
          "& h4": {
            fontSize: 13,
            textTransform: "uppercase",
            m: "10px 0 2px",
          },
          "& hr": { border: 0, borderTop: "1px solid #333", my: "6px" },
          "& img": { maxWidth: "100%", height: "auto" },
          "& table": { borderCollapse: "collapse", width: "100%" },
          "& table:not([data-plain]) td, & table:not([data-plain]) th": {
            border: "1px solid #444",
            padding: "4px 6px",
            verticalAlign: "top",
          },
          "& td, & th": { padding: "2px 6px", verticalAlign: "top" },
        }}
      />

      {suggest &&
        createPortal(
          <Paper
            elevation={8}
            sx={{
              position: "fixed",
              zIndex: 1600,
              left: Math.max(8, Math.min(suggest.x, window.innerWidth - 290)),
              top: Math.min(suggest.y + 6, window.innerHeight - 250),
              width: 280,
              maxWidth: "calc(100vw - 16px)",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <List dense disablePadding>
              {suggest.items.map((s, i) => (
                <ListItemButton
                  key={s.key}
                  selected={i === suggest.index}
                  // mousedown keeps the caret in the editor
                  onMouseDown={(e) => {
                    e.preventDefault();
                    accept(s);
                  }}
                >
                  <ListItemText
                    primary={s.label}
                    secondary={`/${s.key}`}
                    slotProps={{
                      primary: { sx: { fontSize: 13, fontWeight: 700 } },
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>,
          document.body,
        )}
    </>
  );
}
