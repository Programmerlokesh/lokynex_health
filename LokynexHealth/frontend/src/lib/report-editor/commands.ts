// Thin helpers over document.execCommand + table DOM edits.
// Toolbar clicks steal focus, so the last caret/selection is remembered
// on blur and restored before every command.

let lastEditable: HTMLElement | null = null;
let lastRange: Range | null = null;

export function rememberSelection(el: HTMLElement): void {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
    lastEditable = el;
    lastRange = sel.getRangeAt(0).cloneRange();
  }
}

export function restoreSelection(): HTMLElement | null {
  if (!lastEditable) return null;
  lastEditable.focus();
  if (lastRange) {
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(lastRange);
  }
  return lastEditable;
}

/** execCommand does not always fire `input`; make sure history + dirty flag see it. */
export function notifyInput(): void {
  lastEditable?.dispatchEvent(new Event("input", { bubbles: true }));
}

export function exec(cmd: string, value?: string): void {
  document.execCommand(cmd, false, value);
}

export const FONT_FAMILIES = [
  "Arial",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Verdana",
  "Tahoma",
];
export const FONT_SIZES = [10, 11, 12, 13, 14, 16, 18, 20, 24];

/** execCommand only knows sizes 1-7, so use 7 as a marker and swap it for a px span. */
export function applyFontSize(px: number): void {
  document.execCommand("fontSize", false, "7");
  const root = lastEditable;
  root?.querySelectorAll<HTMLElement>('font[size="7"]').forEach((f) => {
    const span = document.createElement("span");
    span.style.fontSize = `${px}px`;
    span.innerHTML = f.innerHTML;
    f.replaceWith(span);
  });
}

export function insertHtml(html: string): void {
  document.execCommand("insertHTML", false, html);
}

export function insertTable(rows: number, cols: number): void {
  const cell = `<td style="min-width:40px"><br></td>`;
  const row = `<tr>${cell.repeat(cols)}</tr>`;
  insertHtml(
    `<table style="width:100%;border-collapse:collapse"><tbody>${row.repeat(rows)}</tbody></table><p><br></p>`,
  );
}

export function insertImageFile(file: File, onDone: () => void): void {
  const reader = new FileReader();
  reader.onload = () => {
    restoreSelection();
    insertHtml(
      `<img src="${String(reader.result)}" style="max-width:100%;height:auto" alt="">`,
    );
    notifyInput();
    onDone();
  };
  reader.readAsDataURL(file);
}

/* ---------- table editing ---------- */

function currentCell(): HTMLTableCellElement | null {
  const node = window.getSelection()?.anchorNode;
  const el = node instanceof Element ? node : (node?.parentElement ?? null);
  return (el?.closest("td,th") as HTMLTableCellElement | null) ?? null;
}

export function tableAddRow(below = true): void {
  const row = currentCell()?.parentElement as HTMLTableRowElement | null;
  if (!row || !row.parentElement) return;
  const clone = row.cloneNode(true) as HTMLTableRowElement;
  clone.querySelectorAll("td,th").forEach((c) => (c.innerHTML = "<br>"));
  row.parentElement.insertBefore(clone, below ? row.nextSibling : row);
}

export function tableAddColumn(): void {
  const cell = currentCell();
  const table = cell?.closest("table");
  if (!cell || !table) return;
  const idx = cell.cellIndex;
  table.querySelectorAll("tr").forEach((tr) => {
    const c = (tr as HTMLTableRowElement).insertCell(idx + 1);
    c.innerHTML = "<br>";
    const style = cell.getAttribute("style");
    if (style) c.setAttribute("style", style);
  });
}

export function tableDeleteRow(): void {
  const row = currentCell()?.parentElement as HTMLTableRowElement | null;
  const table = row?.closest("table");
  if (!row || !table) return;
  if (table.rows.length <= 1) table.remove();
  else row.remove();
}

export function tableDeleteColumn(): void {
  const cell = currentCell();
  const table = cell?.closest("table");
  if (!cell || !table) return;
  const idx = cell.cellIndex;
  if (
    cell.parentElement &&
    (cell.parentElement as HTMLTableRowElement).cells.length <= 1
  ) {
    table.remove();
    return;
  }
  table.querySelectorAll("tr").forEach((tr) => {
    (tr as HTMLTableRowElement).deleteCell(idx);
  });
}

export function tableDelete(): void {
  currentCell()?.closest("table")?.remove();
}
