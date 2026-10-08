const BLOCKED_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "IFRAME",
  "OBJECT",
  "EMBED",
  "LINK",
  "META",
  "BASE",
  "FORM",
  "INPUT",
  "BUTTON",
  "TEXTAREA",
  "SELECT",
  "SVG",
  "MATH",
]);

export function escapeHtml(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Report HTML is rendered inside the app (editor) and inside a same-origin
 * print iframe, so it is cleaned first: no scripts, no on* handlers, no
 * javascript: links. Browser only (uses DOMParser).
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(
    `<body>${html}</body>`,
    "text/html",
  );

  const walk = (el: Element) => {
    for (const child of Array.from(el.children)) {
      if (BLOCKED_TAGS.has(child.tagName.toUpperCase())) {
        child.remove();
        continue;
      }
      for (const attr of Array.from(child.attributes)) {
        const name = attr.name.toLowerCase();
        const value = attr.value.replace(/\s/g, "").toLowerCase();
        if (name.startsWith("on")) {
          child.removeAttribute(attr.name);
        } else if (
          (name === "href" || name === "src" || name === "xlink:href") &&
          /^(javascript|vbscript|data:text)/.test(value)
        ) {
          child.removeAttribute(attr.name);
        }
      }
      walk(child);
    }
  };

  walk(doc.body);
  return doc.body.innerHTML;
}

/** Cheap tag-stripper for list previews (safe during SSR, no DOM needed). */
export function htmlToText(html: string | null | undefined): string {
  return (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}
