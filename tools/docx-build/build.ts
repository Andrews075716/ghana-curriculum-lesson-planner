/**
 * Combines every chapter file under /docs into one professionally formatted
 * .docx (Ghana_Curriculum_Lesson_Planner_Complete_Documentation.docx).
 *
 * This is a one-off documentation-compilation tool, not application code —
 * it lives under tools/, is run manually via `npx tsx`, and its only job is
 * to faithfully reformat existing Markdown into Word. It does not alter the
 * source Markdown files, and it does not invent content: every heading,
 * paragraph, table, code block, and diagram comes directly from /docs.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { execFileSync } from "child_process";
import path from "path";
import { marked } from "marked";
import type { Token, Tokens } from "marked";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  ImageRun,
  Header,
  Footer,
  PageNumber,
  AlignmentType,
  BorderStyle,
  WidthType,
  TableOfContents,
  SectionType,
  PageOrientation,
  ShadingType,
  VerticalAlign,
  ExternalHyperlink,
  PageBreak,
  TabStopType,
  TabStopPosition,
  convertMillimetersToTwip,
  ISectionOptions,
  UnderlineType,
} from "docx";

const ROOT = path.resolve(__dirname, "../..");
const DOCS_DIR = path.join(ROOT, "docs");
const DIAGRAMS_DIR = path.join(__dirname, "diagrams");
const OUTPUT_DIR = path.join(ROOT, "output");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "Ghana_Curriculum_Lesson_Planner_Complete_Documentation.docx");
const CHROME_PATH = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PUPPETEER_CONFIG_PATH = path.join(__dirname, "puppeteer-config.json");
const MMDC_CLI_JS = path.join(ROOT, "node_modules", "@mermaid-js", "mermaid-cli", "src", "cli.js");

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
if (!existsSync(DIAGRAMS_DIR)) mkdirSync(DIAGRAMS_DIR, { recursive: true });

const REPORT: { renderedDiagrams: string[]; failedDiagrams: string[] } = {
  renderedDiagrams: [],
  failedDiagrams: [],
};

// ---------------------------------------------------------------------------
// Chapter manifest — the authoritative order from docs/README.md's own
// "Document index", with docs/README.md itself intentionally excluded
// (it is only a navigation/index page — see the task's instruction not to
// duplicate it).
// ---------------------------------------------------------------------------

interface ChapterDef {
  file: string;
  title: string;
}

const CHAPTERS: ChapterDef[] = [
  { file: "01-product-overview.md", title: "Product Overview" },
  { file: "02-requirements.md", title: "Requirements" },
  { file: "03-user-stories.md", title: "User Stories and Product Epics" },
  { file: "04-curriculum-architecture.md", title: "Ghana Curriculum Architecture and Curriculum Data Management" },
  { file: "05-learning-planner-specification.md", title: "Ghana Learning Planner Structure and User Workflows" },
  { file: "06-system-architecture.md", title: "System Architecture" },
  { file: "07-database-design.md", title: "Database Design" },
  { file: "08-api-documentation.md", title: "API Documentation" },
  { file: "09-ai-architecture.md", title: "AI Architecture" },
  { file: "10-security-and-privacy.md", title: "Security and Privacy" },
  { file: "11-testing-strategy.md", title: "Testing Strategy" },
  { file: "12-installation-guide.md", title: "Installation Guide" },
  { file: "13-deployment-guide.md", title: "Deployment Guide" },
  { file: "14-development-roadmap.md", title: "Development Roadmap" },
  { file: "15-product-backlog.md", title: "Product Backlog" },
  { file: "16-traceability-matrix.md", title: "Traceability Matrix" },
  { file: "17-project-status.md", title: "Project Status" },
  { file: "glossary.md", title: "Glossary" },
];

// Sanity check: every markdown file physically present in /docs (other than
// README.md, the index) must appear in CHAPTERS, and vice versa, so nothing
// is silently omitted or duplicated.
const actualMdFiles = readdirSync(DOCS_DIR)
  .filter((f) => f.endsWith(".md") && f !== "README.md")
  .sort();
const manifestFiles = CHAPTERS.map((c) => c.file).sort();
if (JSON.stringify(actualMdFiles) !== JSON.stringify(manifestFiles)) {
  console.error("Chapter manifest does not match docs/ contents!");
  console.error("In docs/ but not manifest:", actualMdFiles.filter((f) => !manifestFiles.includes(f)));
  console.error("In manifest but not docs/:", manifestFiles.filter((f) => !actualMdFiles.includes(f)));
  process.exit(1);
}

const FILE_TO_CHAPTER = new Map<string, { number: number; title: string }>();
CHAPTERS.forEach((c, i) => FILE_TO_CHAPTER.set(c.file, { number: i + 1, title: c.title }));

// ---------------------------------------------------------------------------
// Diagram captions, in the exact order the mermaid blocks are encountered
// while walking the chapters top to bottom (verified against /docs before
// writing this list — see the accompanying chat summary for the count).
// ---------------------------------------------------------------------------
const DIAGRAM_CAPTIONS: string[] = [
  "Ghana Curriculum Hierarchy",
  "User Workflow \u2014 Registration and Login",
  "User Workflow \u2014 Creating a Planner (7-Step Wizard)",
  "User Workflow \u2014 Selecting Curriculum (Step 2 Detail)",
  "User Workflow \u2014 Generating and Reviewing an AI Suggestion",
  "User Workflow \u2014 Completing Reflection",
  "User Workflow \u2014 Printing and Exporting",
  "User Workflow \u2014 Administering Curriculum",
  "System Architecture",
  "Database Entity Relationship Diagram",
  "AI Generation Workflow",
  "Authentication Sequence",
  "Proposed Deployment Architecture",
];
let diagramCounter = 0;

// ---------------------------------------------------------------------------
// Styling constants
// ---------------------------------------------------------------------------
const BODY_FONT = "Calibri";
const HEADING_FONT = "Calibri";
const CODE_FONT = "Consolas";
const BODY_SIZE = 22; // half-points -> 11pt
const CODE_SIZE = 18; // 9pt
const COLOR_PRIMARY = "1F3864"; // dark blue, headings
const COLOR_ACCENT = "2E5395";
const COLOR_TABLE_HEADER_BG = "1F3864";
const COLOR_TABLE_HEADER_TEXT = "FFFFFF";
const COLOR_CODE_BG = "F2F2F2";
const COLOR_CODE_BORDER = "8496B0";

const A4_WIDTH = convertMillimetersToTwip(210);
const A4_HEIGHT = convertMillimetersToTwip(297);
const MARGIN = convertMillimetersToTwip(25.4); // ~1 inch, professional default

// `docx`'s own createPageSize() already swaps width/height internally when
// orientation is LANDSCAPE (see node_modules/docx/dist/index.iife.js), so
// the logical (portrait) width/height must always be passed here unswapped
// — swapping them ourselves as well would cancel out and silently emit a
// landscape-flagged page with portrait dimensions.
function pageSize(orientation: "portrait" | "landscape") {
  return {
    width: A4_WIDTH,
    height: A4_HEIGHT,
    orientation: orientation === "portrait" ? PageOrientation.PORTRAIT : PageOrientation.LANDSCAPE,
  };
}

// ---------------------------------------------------------------------------
// Header / Footer factories (fresh instances per section, per docx's model)
// ---------------------------------------------------------------------------
function makeHeader(): Header {
  return new Header({
    children: [
      new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF", space: 4 } },
        children: [
          new TextRun({
            text: "Ghana Curriculum Lesson Planner \u2014 Project Documentation",
            size: 16,
            color: "595959",
            font: BODY_FONT,
          }),
        ],
      }),
    ],
  });
}

function makeFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF", space: 4 } },
        children: [
          new TextRun({ text: "Page ", size: 16, color: "595959", font: BODY_FONT }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "595959", font: BODY_FONT }),
          new TextRun({ text: " of ", size: 16, color: "595959", font: BODY_FONT }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: "595959", font: BODY_FONT }),
        ],
      }),
    ],
  });
}

// ---------------------------------------------------------------------------
// Mermaid extraction + rendering
// ---------------------------------------------------------------------------
function renderMermaidToPng(code: string, index: number): { file: string; width: number; height: number } | null {
  const mmdPath = path.join(DIAGRAMS_DIR, `diagram-${index}.mmd`);
  const pngPath = path.join(DIAGRAMS_DIR, `diagram-${index}.png`);
  writeFileSync(mmdPath, code, "utf-8");
  try {
    execFileSync(
      process.execPath,
      [MMDC_CLI_JS, "-i", mmdPath, "-o", pngPath, "-p", PUPPETEER_CONFIG_PATH, "-b", "white", "--scale", "3", "-w", "1400"],
      { stdio: "pipe" },
    );
    const buf = readFileSync(pngPath);
    // PNG IHDR: 8-byte signature + 4-byte length + 4-byte "IHDR" + 4-byte width + 4-byte height
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    REPORT.renderedDiagrams.push(DIAGRAM_CAPTIONS[index] ?? `Diagram ${index + 1}`);
    return { file: pngPath, width, height };
  } catch (err) {
    console.error(`Failed to render diagram ${index + 1}:`, (err as Error).message);
    REPORT.failedDiagrams.push(DIAGRAM_CAPTIONS[index] ?? `Diagram ${index + 1}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Inline token -> docx run conversion
// ---------------------------------------------------------------------------
type RunOpts = { bold?: boolean; italics?: boolean; code?: boolean; size?: number; color?: string };

function flattenInline(tokens: Token[] | undefined, opts: RunOpts = {}): (TextRun | ExternalHyperlink)[] {
  if (!tokens) return [];
  const out: (TextRun | ExternalHyperlink)[] = [];
  for (const t of tokens as Tokens.Generic[]) {
    switch (t.type) {
      case "text": {
        // "text" tokens from list items sometimes carry their own nested
        // .tokens (inline content); plain text tokens don't.
        const nested = (t as { tokens?: Token[] }).tokens;
        if (nested && nested.length) {
          out.push(...flattenInline(nested, opts));
        } else {
          const raw = (t as Tokens.Text).text ?? "";
          if (raw) out.push(new TextRun({ text: raw, font: opts.code ? CODE_FONT : BODY_FONT, ...opts }));
        }
        break;
      }
      case "strong":
        out.push(...flattenInline((t as Tokens.Strong).tokens, { ...opts, bold: true }));
        break;
      case "em":
        out.push(...flattenInline((t as Tokens.Em).tokens, { ...opts, italics: true }));
        break;
      case "del":
        out.push(
          ...flattenInline((t as Tokens.Del).tokens, opts).map((r) =>
            r instanceof TextRun ? r : r,
          ),
        );
        break;
      case "codespan":
        out.push(
          new TextRun({
            text: (t as Tokens.Codespan).text,
            font: CODE_FONT,
            size: (opts.size ?? BODY_SIZE) - 2,
            shading: { type: ShadingType.CLEAR, fill: COLOR_CODE_BG },
            ...{ bold: opts.bold, italics: opts.italics },
          }),
        );
        break;
      case "br":
        out.push(new TextRun({ text: "", break: 1 }));
        break;
      case "link": {
        const link = t as Tokens.Link;
        const href = link.href ?? "";
        const isInternal = /\.md(#.*)?$/i.test(href) || /^#/.test(href);
        if (isInternal) {
          // Internal cross-references no longer resolve to separate files
          // once everything is combined into one document (Step 15) — keep
          // the link's own text, and where we can resolve which chapter it
          // pointed to, append a plain-text chapter pointer instead of a
          // dead hyperlink.
          const fileMatch = href.match(/^([\w.-]+\.md)/);
          const target = fileMatch ? FILE_TO_CHAPTER.get(fileMatch[1]) : undefined;
          const linkText = flattenInline(link.tokens, opts);
          out.push(...linkText);
          if (target) {
            out.push(
              new TextRun({
                text: ` (see Chapter ${target.number}, "${target.title}")`,
                italics: true,
                font: opts.code ? CODE_FONT : BODY_FONT,
                size: opts.size ?? BODY_SIZE,
                color: "595959",
              }),
            );
          }
        } else {
          out.push(
            new ExternalHyperlink({
              link: href,
              children: [
                new TextRun({
                  text: link.text || href,
                  font: BODY_FONT,
                  size: opts.size ?? BODY_SIZE,
                  color: "1155CC",
                  underline: { type: UnderlineType.SINGLE },
                }),
              ],
            }),
          );
        }
        break;
      }
      default: {
        const raw = (t as { raw?: string }).raw ?? "";
        if (raw) out.push(new TextRun({ text: raw, font: BODY_FONT, ...opts }));
      }
    }
  }
  return out;
}

/** True if this paragraph is only the "[<- Back to documentation home](README.md)" nav link every chapter starts with. */
function isBackNavParagraph(tok: Tokens.Paragraph): boolean {
  const raw = tok.raw.trim();
  return /^\[.*(back to documentation home|documentation home).*\]\(README\.md\)$/i.test(raw);
}

// ---------------------------------------------------------------------------
// Heading numbering
// ---------------------------------------------------------------------------
/** Strips a leading numeric prefix like "6.", "17\u201318.", "20\u201321, 30." etc. from a heading's first text token, in place on a shallow clone. */
function stripLeadingNumber(tokens: Token[]): Token[] {
  if (!tokens.length) return tokens;
  const clone = tokens.map((t) => ({ ...t })) as Tokens.Generic[];
  const first = clone[0];
  if (first.type === "text") {
    const txt = (first as Tokens.Text).text ?? "";
    const stripped = txt.replace(/^\s*\d+(?:\s*[\u2013\u2014,]\s*\d+)*\.?\s*/, "");
    (first as Tokens.Text).text = stripped;
    (first as Tokens.Text).raw = stripped;
  }
  return clone as Token[];
}

// ---------------------------------------------------------------------------
// Table width heuristics
// ---------------------------------------------------------------------------
function computeColumnWidths(colCount: number, header: string[], rows: string[][]): number[] {
  const lens = header.map((h, i) => {
    let max = h.length;
    for (const r of rows) max = Math.max(max, (r[i] ?? "").length);
    return Math.max(max, 4);
  });
  const total = lens.reduce((a, b) => a + b, 0);
  return lens.map((l) => Math.round((l / total) * 10000)); // dxa-independent proportion *100 (pct*100)
}

// ---------------------------------------------------------------------------
// Main conversion state
// ---------------------------------------------------------------------------
interface Section {
  orientation: "portrait" | "landscape";
  children: (Paragraph | Table)[];
}

const sections: Section[] = [];
let current: Section = { orientation: "portrait", children: [] };

function pushCurrent() {
  if (current.children.length > 0) sections.push(current);
}

function switchOrientation(target: "portrait" | "landscape", bundleWithLastHeading: boolean) {
  if (current.orientation === target) return;
  let carry: Paragraph | null = null;
  if (bundleWithLastHeading && current.children.length > 0) {
    const last = current.children[current.children.length - 1];
    if (last instanceof Paragraph && (last as unknown as { _isHeading?: boolean })._isHeading) {
      carry = current.children.pop() as Paragraph;
    }
  }
  pushCurrent();
  current = { orientation: target, children: carry ? [carry] : [] };
}

function addChild(child: Paragraph | Table) {
  current.children.push(child);
}

// ---------------------------------------------------------------------------
// Heading paragraph builder
// ---------------------------------------------------------------------------
function headingParagraph(level: 1 | 2 | 3 | 4, numberPrefix: string, tokens: Token[]): Paragraph {
  const headingLevelMap = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
    4: HeadingLevel.HEADING_4,
  } as const;
  const sizeMap = { 1: 36, 2: 28, 3: 24, 4: 22 } as const;
  const runs = flattenInline(tokens, { bold: true, size: sizeMap[level], color: COLOR_PRIMARY });
  const p = new Paragraph({
    heading: headingLevelMap[level],
    pageBreakBefore: level === 1,
    keepNext: true,
    spacing: { before: level === 1 ? 0 : 320, after: 160 },
    children: [
      new TextRun({ text: numberPrefix, bold: true, size: sizeMap[level], color: COLOR_PRIMARY, font: HEADING_FONT }),
      ...runs,
    ],
  });
  (p as unknown as { _isHeading?: boolean })._isHeading = true;
  return p;
}

function bodyParagraph(tokens: Token[], opts: { bullet?: { level: number }; numbering?: { level: number }; ordered?: boolean } = {}): Paragraph {
  const runs = flattenInline(tokens, { size: BODY_SIZE });
  const base: ConstructorParameters<typeof Paragraph>[0] = {
    children: runs.length ? runs : [new TextRun({ text: "", size: BODY_SIZE })],
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 140, line: 276, lineRule: "auto" },
  };
  if (opts.bullet) {
    return new Paragraph({ ...base, bullet: { level: opts.bullet.level } });
  }
  return new Paragraph(base);
}

function codeParagraphs(text: string, lang?: string): Paragraph[] {
  const lines = text.split("\n");
  return lines.map(
    (line, i) =>
      new Paragraph({
        shading: { type: ShadingType.CLEAR, fill: COLOR_CODE_BG },
        border: {
          left: { style: BorderStyle.SINGLE, size: 12, color: COLOR_CODE_BORDER, space: 6 },
          ...(i === 0 ? { top: { style: BorderStyle.SINGLE, size: 2, color: COLOR_CODE_BORDER, space: 4 } } : {}),
          ...(i === lines.length - 1 ? { bottom: { style: BorderStyle.SINGLE, size: 2, color: COLOR_CODE_BORDER, space: 4 } } : {}),
        },
        spacing: { after: i === lines.length - 1 ? 160 : 0, line: 240, lineRule: "auto" },
        keepNext: true,
        children: [
          new TextRun({ text: line.length ? line : " ", font: CODE_FONT, size: CODE_SIZE }),
        ],
      }),
  );
}

function tableCellPara(tokens: Token[], opts: { header?: boolean } = {}): Paragraph {
  const runs = flattenInline(tokens, {
    size: BODY_SIZE - 2,
    bold: opts.header,
    color: opts.header ? COLOR_TABLE_HEADER_TEXT : undefined,
  });
  return new Paragraph({
    children: runs.length ? runs : [new TextRun({ text: "", size: BODY_SIZE - 2 })],
    spacing: { after: 40, line: 240, lineRule: "auto" },
  });
}

function buildTable(tok: Tokens.Table): Table {
  const headerTexts = tok.header.map((c) => c.text);
  const rowTexts = tok.rows.map((r) => r.map((c) => c.text));
  const widths = computeColumnWidths(tok.header.length, headerTexts, rowTexts);

  const headerRow = new TableRow({
    tableHeader: true,
    children: tok.header.map(
      (cell, i) =>
        new TableCell({
          width: { size: widths[i], type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: COLOR_TABLE_HEADER_BG },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: [tableCellPara(cell.tokens ?? [], { header: true })],
        }),
    ),
  });

  const bodyRows = tok.rows.map(
    (row, rIdx) =>
      new TableRow({
        cantSplit: false,
        children: row.map(
          (cell, i) =>
            new TableCell({
              width: { size: widths[i], type: WidthType.PERCENTAGE },
              shading: rIdx % 2 === 1 ? { type: ShadingType.CLEAR, fill: "F2F5FA" } : undefined,
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 60, bottom: 60, left: 100, right: 100 },
              children: [tableCellPara(cell.tokens ?? [])],
            }),
        ),
      }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...bodyRows],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "D9D9D9" },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "D9D9D9" },
    },
  });
}

// ---------------------------------------------------------------------------
// List rendering (nested bullets, marked gives one 'list' token per level)
// ---------------------------------------------------------------------------
function renderList(tok: Tokens.List, level: number, out: Paragraph[]) {
  let n = typeof tok.start === "number" ? tok.start : 1;
  for (const item of tok.items as Tokens.ListItem[]) {
    // An item's .tokens may itself contain a nested 'list' token (sub-list)
    // alongside its own text token(s).
    const textTokens: Token[] = [];
    const subLists: Tokens.List[] = [];
    for (const it of item.tokens as Tokens.Generic[]) {
      if (it.type === "list") subLists.push(it as Tokens.List);
      else textTokens.push(it as Token);
    }
    // Ordered lists use a manually written "N. " prefix rather than Word's
    // native numbering field — using both at once would double-number
    // (e.g. "1. 1. Initialize version control"). Manual prefixes are also
    // more predictable across the many restarted lists in this document.
    const prefix = tok.ordered ? `${n}. ` : "";
    n++;
    const runs = flattenInline(textTokens, { size: BODY_SIZE });
    out.push(
      new Paragraph({
        bullet: tok.ordered ? undefined : { level },
        indent: tok.ordered ? { left: 360 + level * 360 } : undefined,
        spacing: { after: 60, line: 264, lineRule: "auto" },
        children: prefix
          ? [new TextRun({ text: prefix, size: BODY_SIZE, bold: true }), ...runs]
          : runs.length
            ? runs
            : [new TextRun({ text: "", size: BODY_SIZE })],
      }),
    );
    for (const sub of subLists) renderList(sub, level + 1, out);
  }
}

// ---------------------------------------------------------------------------
// Chapter processor
// ---------------------------------------------------------------------------
function processChapter(chapter: ChapterDef) {
  const chapterInfo = FILE_TO_CHAPTER.get(chapter.file)!;
  const raw = readFileSync(path.join(DOCS_DIR, chapter.file), "utf-8");
  const tokens = marked.lexer(raw);

  let h2Count = 0;
  let h3Count = 0;
  let h4Count = 0;
  let sawH1 = false;

  // Chapter title (Heading 1) — always our authoritative title, not the
  // file's own (numbered, multi-topic) H1 text.
  addChild(headingParagraph(1, `${chapterInfo.number}. `, [{ type: "text", raw: chapter.title, text: chapter.title } as Token]));

  for (let idx = 0; idx < tokens.length; idx++) {
    const tok = tokens[idx] as Tokens.Generic;

    switch (tok.type) {
      case "heading": {
        const heading = tok as Tokens.Heading;
        if (heading.depth === 1) {
          sawH1 = true; // already emitted our own chapter heading above; skip the file's H1
          continue;
        }
        const cleanedTokens = stripLeadingNumber(heading.tokens ?? []);
        if (heading.depth === 2) {
          h2Count++;
          h3Count = 0;
          h4Count = 0;
          addChild(headingParagraph(2, `${chapterInfo.number}.${h2Count} `, cleanedTokens));
        } else if (heading.depth === 3) {
          h3Count++;
          h4Count = 0;
          addChild(headingParagraph(3, `${chapterInfo.number}.${h2Count || 1}.${h3Count} `, cleanedTokens));
        } else {
          h4Count++;
          addChild(
            headingParagraph(4, `${chapterInfo.number}.${h2Count || 1}.${h3Count || 1}.${h4Count} `, cleanedTokens),
          );
        }
        break;
      }

      case "paragraph": {
        const p = tok as Tokens.Paragraph;
        if (isBackNavParagraph(p)) continue; // Step 15: drop dead in-doc nav links
        addChild(bodyParagraph(p.tokens ?? []));
        break;
      }

      case "blockquote": {
        const bq = tok as Tokens.Blockquote;
        for (const inner of bq.tokens as Tokens.Generic[]) {
          if (inner.type === "paragraph") {
            const runs = flattenInline((inner as Tokens.Paragraph).tokens, { italics: true, size: BODY_SIZE });
            addChild(
              new Paragraph({
                indent: { left: 360 },
                border: { left: { style: BorderStyle.SINGLE, size: 12, color: COLOR_ACCENT, space: 8 } },
                spacing: { after: 140, line: 276, lineRule: "auto" },
                children: runs,
              }),
            );
          }
        }
        break;
      }

      case "list": {
        const items: Paragraph[] = [];
        renderList(tok as Tokens.List, 0, items);
        items.forEach((p) => addChild(p));
        break;
      }

      case "table": {
        const tableTok = tok as Tokens.Table;
        const isWide = tableTok.header.length >= 4;
        switchOrientation(isWide ? "landscape" : "portrait", isWide);
        addChild(buildTable(tableTok));
        addChild(new Paragraph({ spacing: { after: 160 } })); // breathing room after a table
        break;
      }

      case "code": {
        const codeTok = tok as Tokens.Code;
        const rawText = codeTok.text ?? "";
        if (codeTok.lang === "mermaid") {
          diagramCounter++;
          const idx0 = diagramCounter - 1;
          const rendered = renderMermaidToPng(rawText, idx0);
          if (rendered) {
            // Fit within a portrait content area (A4 minus margins) by default.
            const maxWidthTwip =
              current.orientation === "portrait" ? A4_WIDTH - 2 * MARGIN : A4_HEIGHT - 2 * MARGIN;
            const maxWidthPx = maxWidthTwip / 15; // ~20 twip per px at 96dpi is not exact; use twip/15 as a safe conservative px estimate
            const scale = Math.min(1, maxWidthPx / rendered.width);
            const dispW = Math.round(rendered.width * scale);
            const dispH = Math.round(rendered.height * scale);
            addChild(
              new Paragraph({
                alignment: AlignmentType.CENTER,
                keepNext: true,
                spacing: { before: 120, after: 40 },
                children: [
                  new ImageRun({
                    type: "png",
                    data: readFileSync(rendered.file),
                    transformation: { width: dispW, height: dispH },
                  }),
                ],
              }),
            );
            addChild(
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
                children: [
                  new TextRun({
                    text: `Figure ${diagramCounter}: ${DIAGRAM_CAPTIONS[idx0] ?? "Diagram"}`,
                    italics: true,
                    size: BODY_SIZE - 2,
                    color: "595959",
                  }),
                ],
              }),
            );
          } else {
            // Diagram could not be rendered — preserve the Mermaid source
            // clearly rather than silently dropping it (Step 12).
            addChild(
              new Paragraph({
                spacing: { before: 120, after: 40 },
                children: [
                  new TextRun({
                    text: `[Diagram could not be rendered \u2014 Mermaid source below: ${DIAGRAM_CAPTIONS[idx0] ?? ""}]`,
                    italics: true,
                    bold: true,
                    color: "C00000",
                    size: BODY_SIZE,
                  }),
                ],
              }),
            );
            codeParagraphs(rawText).forEach((p) => addChild(p));
          }
        } else {
          codeParagraphs(rawText, codeTok.lang).forEach((p) => addChild(p));
        }
        break;
      }

      case "hr":
        addChild(
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "BFBFBF" } },
            spacing: { after: 200 },
          }),
        );
        break;

      case "space":
      default:
        break;
    }
  }
}

// ---------------------------------------------------------------------------
// Cover page + document control + TOC
// ---------------------------------------------------------------------------
const today = new Date();
const dateStr = today.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });

function coverPageChildren(): Paragraph[] {
  return [
    new Paragraph({ spacing: { before: 1800 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: "GHANA CURRICULUM LESSON PLANNER", bold: true, size: 56, color: COLOR_PRIMARY, font: HEADING_FONT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text: "Complete Project Documentation", size: 32, color: COLOR_ACCENT, font: HEADING_FONT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 1200 },
      children: [
        new TextRun({
          text: "Curriculum-First, AI-Assisted Lesson Planning Platform",
          italics: true,
          size: 24,
          color: "595959",
          font: BODY_FONT,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: "Document Version: 1.0", size: 24, font: BODY_FONT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
      children: [new TextRun({ text: `Date: ${dateStr}`, size: 24, font: BODY_FONT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 800, after: 80 },
      children: [new TextRun({ text: "Prepared for:", size: 22, bold: true, font: BODY_FONT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [new TextRun({ text: "Ghana Curriculum Lesson Planner Project", size: 22, font: BODY_FONT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1400, after: 40 },
      children: [new TextRun({ text: "Author / Developer:", size: 20, bold: true, font: BODY_FONT, color: "595959" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "To be confirmed", size: 20, italics: true, font: BODY_FONT, color: "595959" })],
    }),
  ];
}

function simpleTable(headers: string[], rows: string[][]): Table {
  const widths = computeColumnWidths(headers.length, headers, rows);
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(
      (h, i) =>
        new TableCell({
          width: { size: widths[i], type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: COLOR_TABLE_HEADER_BG },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: [
            new Paragraph({
              children: [new TextRun({ text: h, bold: true, color: COLOR_TABLE_HEADER_TEXT, size: BODY_SIZE - 2 })],
            }),
          ],
        }),
    ),
  });
  const bodyRows = rows.map(
    (row, rIdx) =>
      new TableRow({
        children: row.map(
          (cell, i) =>
            new TableCell({
              width: { size: widths[i], type: WidthType.PERCENTAGE },
              shading: rIdx % 2 === 1 ? { type: ShadingType.CLEAR, fill: "F2F5FA" } : undefined,
              margins: { top: 60, bottom: 60, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: cell, size: BODY_SIZE - 2 })] })],
            }),
        ),
      }),
  );
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...bodyRows],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "D9D9D9" },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "D9D9D9" },
    },
  });
}

function heading1Plain(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: true,
    spacing: { after: 200 },
    children: [new TextRun({ text, bold: true, size: 36, color: COLOR_PRIMARY, font: HEADING_FONT })],
  });
}

// ---------------------------------------------------------------------------
// Assemble document
// ---------------------------------------------------------------------------
async function main() {
  // Front matter section (cover, no header/footer, portrait)
  const frontMatterChildren: (Paragraph | Table)[] = [...coverPageChildren()];

  const frontSection: ISectionOptions = {
    properties: {
      page: { size: pageSize("portrait"), margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } },
      titlePage: true,
      type: SectionType.NEXT_PAGE,
    },
    headers: { default: new Header({ children: [] }), first: new Header({ children: [] }) },
    footers: { default: new Footer({ children: [] }), first: new Footer({ children: [] }) },
    children: frontMatterChildren,
  };

  // Document Control section
  const docControlChildren: (Paragraph | Table)[] = [
    heading1Plain("Document Control"),
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 120, after: 120 },
      children: [new TextRun({ text: "Document Information", bold: true, size: 28, color: COLOR_PRIMARY, font: HEADING_FONT })],
    }),
    simpleTable(
      ["Field", "Value"],
      [
        ["Document Title", "Ghana Curriculum Lesson Planner \u2014 Complete Project Documentation"],
        ["Project", "Ghana Curriculum Lesson Planner"],
        ["Version", "1.0"],
        ["Date", dateStr],
        ["Status", "Draft \u2014 compiled from the project's /docs documentation set"],
      ],
    ),
    new Paragraph({ spacing: { after: 300 }, children: [] }),
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 120, after: 120 },
      children: [new TextRun({ text: "Revision History", bold: true, size: 28, color: COLOR_PRIMARY, font: HEADING_FONT })],
    }),
    simpleTable(
      ["Version", "Date", "Description", "Author"],
      [["1.0", dateStr, "Initial compiled edition, combining all 18 chapters of the project documentation set into a single Word document.", "To be confirmed"]],
    ),
  ];

  const docControlSection: ISectionOptions = {
    properties: {
      page: { size: pageSize("portrait"), margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } },
      type: SectionType.NEXT_PAGE,
    },
    headers: { default: makeHeader() },
    footers: { default: makeFooter() },
    children: docControlChildren,
  };

  // TOC section
  const tocChildren: (Paragraph | Table)[] = [
    heading1Plain("Table of Contents"),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: "This table of contents is generated from the document's heading styles. In Microsoft Word, right-click it and choose \u201cUpdate Field\u201d (or press F9) if it does not display automatically on open.",
          italics: true,
          size: BODY_SIZE - 2,
          color: "595959",
        }),
      ],
    }),
    new TableOfContents("Table of Contents", {
      hyperlink: true,
      headingStyleRange: "1-3",
    }),
  ];

  const tocSection: ISectionOptions = {
    properties: {
      page: { size: pageSize("portrait"), margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } },
      type: SectionType.NEXT_PAGE,
    },
    headers: { default: makeHeader() },
    footers: { default: makeFooter() },
    children: tocChildren,
  };

  // Chapters
  current = { orientation: "portrait", children: [] };
  for (const chapter of CHAPTERS) {
    processChapter(chapter);
  }
  pushCurrent();

  const chapterSections: ISectionOptions[] = sections.map((s) => ({
    properties: {
      page: { size: pageSize(s.orientation), margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } },
      type: SectionType.NEXT_PAGE,
    },
    headers: { default: makeHeader() },
    footers: { default: makeFooter() },
    children: s.children,
  }));

  const doc = new Document({
    creator: "Ghana Curriculum Lesson Planner \u2014 Documentation Compilation",
    title: "Ghana Curriculum Lesson Planner \u2014 Complete Project Documentation",
    description: "Combined project documentation compiled from the /docs Markdown source set.",
    styles: {
      default: {
        document: {
          run: { font: BODY_FONT, size: BODY_SIZE },
          paragraph: { spacing: { line: 276, lineRule: "auto" } },
        },
        heading1: {
          run: { font: HEADING_FONT, size: 36, bold: true, color: COLOR_PRIMARY },
          paragraph: { spacing: { before: 0, after: 200 } },
        },
        heading2: {
          run: { font: HEADING_FONT, size: 28, bold: true, color: COLOR_PRIMARY },
          paragraph: { spacing: { before: 320, after: 160 } },
        },
        heading3: {
          run: { font: HEADING_FONT, size: 24, bold: true, color: COLOR_ACCENT },
          paragraph: { spacing: { before: 240, after: 120 } },
        },
        heading4: {
          run: { font: HEADING_FONT, size: 22, bold: true, italics: true, color: COLOR_ACCENT },
          paragraph: { spacing: { before: 200, after: 100 } },
        },
        title: {
          run: { font: HEADING_FONT, size: 56, bold: true, color: COLOR_PRIMARY },
        },
      },
      paragraphStyles: [
        {
          id: "Caption",
          name: "Caption",
          basedOn: "Normal",
          next: "Normal",
          run: { italics: true, size: BODY_SIZE - 2, color: "595959", font: BODY_FONT },
        },
        {
          id: "Code",
          name: "Code",
          basedOn: "Normal",
          next: "Code",
          run: { font: CODE_FONT, size: CODE_SIZE },
        },
      ],
    },
    sections: [frontSection, docControlSection, tocSection, ...chapterSections],
  });

  const buffer = await Packer.toBuffer(doc);
  writeFileSync(OUTPUT_PATH, buffer);

  console.log("\n=== BUILD REPORT ===");
  console.log("Output:", OUTPUT_PATH);
  console.log("Chapters included:", CHAPTERS.length);
  console.log("Diagrams rendered:", REPORT.renderedDiagrams.length, REPORT.renderedDiagrams);
  console.log("Diagrams failed:", REPORT.failedDiagrams.length, REPORT.failedDiagrams);
  writeFileSync(path.join(__dirname, "build-report.json"), JSON.stringify(REPORT, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
