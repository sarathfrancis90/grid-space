/**
 * TemplateGallery — display template cards on the dashboard.
 * S15-015: Template gallery on dashboard
 * S15-016: Create spreadsheet from template
 * S15-017: Built-in templates
 */
import React, { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  useTemplateStore,
  type TemplateSummary,
} from "../../stores/templateStore";

/* ------------------------------------------------------------------ */
/*  Mini spreadsheet preview data for each template type               */
/* ------------------------------------------------------------------ */

interface PreviewCell {
  text: string;
  bg?: string;
  color?: string;
  bold?: boolean;
  align?: "left" | "center" | "right";
  checkbox?: boolean;
  checked?: boolean;
}

interface TemplatePreview {
  headerBg: string;
  headerColor: string;
  rows: PreviewCell[][];
}

const TEMPLATE_PREVIEWS: Record<string, TemplatePreview> = {
  Budget: {
    headerBg: "#34a853",
    headerColor: "#fff",
    rows: [
      [
        { text: "Category", bold: true, bg: "#34a853", color: "#fff" },
        { text: "Budget", bold: true, bg: "#34a853", color: "#fff" },
        { text: "Actual", bold: true, bg: "#34a853", color: "#fff" },
      ],
      [
        { text: "Housing", bg: "#e6f4ea" },
        { text: "$1,500", align: "right" },
        { text: "$1,480", align: "right", color: "#34a853" },
      ],
      [
        { text: "Food", bg: "#e6f4ea" },
        { text: "$600", align: "right" },
        { text: "$720", align: "right", color: "#d93025" },
      ],
      [
        { text: "Transport", bg: "#e6f4ea" },
        { text: "$200", align: "right" },
        { text: "$185", align: "right", color: "#34a853" },
      ],
      [
        { text: "Total", bold: true, bg: "#e6f4ea" },
        { text: "$2,300", bold: true, align: "right" },
        { text: "$2,385", bold: true, align: "right" },
      ],
    ],
  },
  Invoice: {
    headerBg: "#4285f4",
    headerColor: "#fff",
    rows: [
      [
        { text: "Item", bold: true, bg: "#4285f4", color: "#fff" },
        { text: "Qty", bold: true, bg: "#4285f4", color: "#fff" },
        { text: "Price", bold: true, bg: "#4285f4", color: "#fff" },
      ],
      [
        { text: "Design", bg: "#e8f0fe" },
        { text: "10", align: "center" },
        { text: "$500", align: "right" },
      ],
      [
        { text: "Dev", bg: "#e8f0fe" },
        { text: "20", align: "center" },
        { text: "$2,000", align: "right" },
      ],
      [
        { text: "QA", bg: "#e8f0fe" },
        { text: "5", align: "center" },
        { text: "$250", align: "right" },
      ],
      [
        { text: "Total", bold: true, bg: "#e8f0fe" },
        { text: "", align: "center" },
        { text: "$2,750", bold: true, align: "right" },
      ],
    ],
  },
  "Project Tracker": {
    headerBg: "#a142f4",
    headerColor: "#fff",
    rows: [
      [
        { text: "Task", bold: true, bg: "#a142f4", color: "#fff" },
        { text: "Status", bold: true, bg: "#a142f4", color: "#fff" },
        { text: "Due", bold: true, bg: "#a142f4", color: "#fff" },
      ],
      [
        { text: "Research", bg: "#f3e8fd" },
        { text: "Done", color: "#34a853", bold: true },
        { text: "Mar 1" },
      ],
      [
        { text: "Design", bg: "#f3e8fd" },
        { text: "Active", color: "#4285f4", bold: true },
        { text: "Mar 10" },
      ],
      [
        { text: "Build", bg: "#f3e8fd" },
        { text: "Todo", color: "#80868b" },
        { text: "Mar 20" },
      ],
      [
        { text: "Launch", bg: "#f3e8fd" },
        { text: "Todo", color: "#80868b" },
        { text: "Apr 1" },
      ],
    ],
  },
  Schedule: {
    headerBg: "#fa7b17",
    headerColor: "#fff",
    rows: [
      [
        { text: "Time", bold: true, bg: "#fa7b17", color: "#fff" },
        { text: "Mon", bold: true, bg: "#fa7b17", color: "#fff" },
        { text: "Tue", bold: true, bg: "#fa7b17", color: "#fff" },
      ],
      [
        { text: "9 AM", bold: true, bg: "#fef7e0" },
        { text: "Standup", bg: "#e8f0fe" },
        { text: "Design", bg: "#f3e8fd" },
      ],
      [
        { text: "10 AM", bold: true, bg: "#fef7e0" },
        { text: "Dev", bg: "#e6f4ea" },
        { text: "Dev", bg: "#e6f4ea" },
      ],
      [
        { text: "12 PM", bold: true, bg: "#fef7e0" },
        { text: "Lunch", bg: "#f1f3f4", color: "#80868b" },
        { text: "Lunch", bg: "#f1f3f4", color: "#80868b" },
      ],
      [
        { text: "2 PM", bold: true, bg: "#fef7e0" },
        { text: "Review", bg: "#fce8e6" },
        { text: "Testing", bg: "#e6f4ea" },
      ],
    ],
  },
  Gradebook: {
    headerBg: "#d93025",
    headerColor: "#fff",
    rows: [
      [
        { text: "Student", bold: true, bg: "#d93025", color: "#fff" },
        { text: "HW1", bold: true, bg: "#d93025", color: "#fff" },
        { text: "Avg", bold: true, bg: "#d93025", color: "#fff" },
      ],
      [
        { text: "Alice", bg: "#fce8e6" },
        { text: "95", align: "center" },
        { text: "A", align: "center", color: "#34a853", bold: true },
      ],
      [
        { text: "Bob", bg: "#fce8e6" },
        { text: "82", align: "center" },
        { text: "B", align: "center", color: "#4285f4", bold: true },
      ],
      [
        { text: "Carol", bg: "#fce8e6" },
        { text: "91", align: "center" },
        { text: "A-", align: "center", color: "#34a853", bold: true },
      ],
      [
        { text: "Dave", bg: "#fce8e6" },
        { text: "78", align: "center" },
        { text: "C+", align: "center", color: "#fa7b17", bold: true },
      ],
    ],
  },
  "To-do List": {
    headerBg: "#1a73e8",
    headerColor: "#fff",
    rows: [
      [
        { text: "Task", bold: true, bg: "#1a73e8", color: "#fff" },
        { text: "Priority", bold: true, bg: "#1a73e8", color: "#fff" },
        { text: "Done", bold: true, bg: "#1a73e8", color: "#fff" },
      ],
      [
        { text: "Buy groceries", bg: "#e8f0fe" },
        { text: "High", color: "#d93025", bold: true },
        { text: "\u2611", align: "center", color: "#34a853" },
      ],
      [
        { text: "Call dentist", bg: "#e8f0fe" },
        { text: "Med", color: "#fa7b17", bold: true },
        { text: "\u2610", align: "center", color: "#80868b" },
      ],
      [
        { text: "Clean house", bg: "#e8f0fe" },
        { text: "Low", color: "#34a853" },
        { text: "\u2610", align: "center", color: "#80868b" },
      ],
      [
        { text: "Send report", bg: "#e8f0fe" },
        { text: "High", color: "#d93025", bold: true },
        { text: "\u2611", align: "center", color: "#34a853" },
      ],
    ],
  },
};

/* Default preview for unknown template names */
const DEFAULT_PREVIEW: TemplatePreview = {
  headerBg: "#5f6368",
  headerColor: "#fff",
  rows: [
    [
      { text: "A", bold: true, bg: "#5f6368", color: "#fff" },
      { text: "B", bold: true, bg: "#5f6368", color: "#fff" },
      { text: "C", bold: true, bg: "#5f6368", color: "#fff" },
    ],
    [{ text: "Data" }, { text: "123", align: "right" }, { text: "Yes" }],
    [{ text: "Item" }, { text: "456", align: "right" }, { text: "No" }],
    [{ text: "Row 3" }, { text: "789", align: "right" }, { text: "Yes" }],
    [
      { text: "Total", bold: true },
      { text: "1,368", bold: true, align: "right" },
      { text: "" },
    ],
  ],
};

/* ------------------------------------------------------------------ */
/*  MiniSpreadsheet — CSS-rendered preview thumbnail                   */
/* ------------------------------------------------------------------ */

const MiniSpreadsheet = React.memo(function MiniSpreadsheet({
  preview,
}: {
  preview: TemplatePreview;
}) {
  return (
    <div
      className="w-full overflow-hidden rounded border border-gray-200"
      style={{
        width: 152,
        height: 100,
        fontSize: 7,
        lineHeight: "14px",
      }}
      aria-hidden="true"
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
        }}
      >
        <tbody>
          {preview.rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  style={{
                    backgroundColor: cell.bg ?? "#fff",
                    color: cell.color ?? "#3c4043",
                    fontWeight: cell.bold ? 600 : 400,
                    textAlign: cell.align ?? "left",
                    padding: "2px 4px",
                    borderBottom: "1px solid #e0e0e0",
                    borderRight:
                      ci < row.length - 1 ? "1px solid #e0e0e0" : "none",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                  }}
                >
                  {cell.text}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/*  BlankCard — "Blank spreadsheet" with green + icon                  */
/* ------------------------------------------------------------------ */

function BlankCard({ onCreate }: { onCreate: () => void }) {
  return (
    <button
      onClick={onCreate}
      className="group/card flex min-w-[160px] flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-white px-4 py-4 transition-all hover:border-[#34a853] hover:shadow-md hover:scale-[1.02] cursor-pointer text-center"
      style={{ padding: "16px", minWidth: 160 }}
      data-testid="template-blank-card"
      type="button"
    >
      <div
        className="flex items-center justify-center rounded border border-gray-200 bg-white"
        style={{ width: 152, height: 100 }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          className="text-[#34a853] transition-transform group-hover/card:scale-110"
        >
          <rect
            x="8"
            y="8"
            width="32"
            height="32"
            rx="4"
            fill="#e6f4ea"
            stroke="#34a853"
            strokeWidth="2"
          />
          <line
            x1="24"
            y1="16"
            x2="24"
            y2="32"
            stroke="#34a853"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1="16"
            y1="24"
            x2="32"
            y2="24"
            stroke="#34a853"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span className="text-sm font-medium text-gray-800">Blank</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  TemplateCard — card with mini spreadsheet preview                  */
/* ------------------------------------------------------------------ */

function TemplateCard({
  template,
  onUse,
}: {
  template: TemplateSummary;
  onUse: (id: string) => void;
}) {
  const name = template.templateName ?? template.title;
  const preview = TEMPLATE_PREVIEWS[name] ?? DEFAULT_PREVIEW;

  return (
    <button
      onClick={() => onUse(template.id)}
      className="group/card flex min-w-[160px] flex-col items-center gap-2 rounded-lg border border-gray-200/80 bg-white px-4 py-4 transition-all hover:border-[#1a73e8]/40 hover:shadow-lg hover:scale-[1.02] cursor-pointer text-center"
      style={{ padding: "16px", minWidth: 160 }}
      data-testid={`template-card-${template.id}`}
      type="button"
    >
      <div className="transition-transform group-hover/card:scale-[1.03]">
        <MiniSpreadsheet preview={preview} />
      </div>
      <span className="text-sm font-medium text-gray-800">{name}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  TemplateGallery — main exported component                          */
/* ------------------------------------------------------------------ */

export function TemplateGallery() {
  const navigate = useNavigate();
  const templates = useTemplateStore((s) => s.templates);
  const isLoading = useTemplateStore((s) => s.isLoading);
  const fetchTemplates = useTemplateStore((s) => s.fetchTemplates);
  const createFromTemplate = useTemplateStore((s) => s.createFromTemplate);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleUseTemplate = useCallback(
    async (templateId: string) => {
      try {
        const spreadsheet = await createFromTemplate(templateId);
        navigate(`/spreadsheet/${spreadsheet.id}`);
      } catch {
        // Error handled in store
      }
    },
    [createFromTemplate, navigate],
  );

  const handleCreateBlank = useCallback(() => {
    navigate("/spreadsheet/new");
  }, [navigate]);

  if (isLoading) {
    return (
      <div data-testid="template-gallery-loading">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">
            Start with a template
          </h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex min-w-[160px] flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-4 animate-pulse"
            >
              <div
                className="rounded bg-gray-200"
                style={{ width: 152, height: 100 }}
              />
              <div className="h-4 w-16 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div data-testid="template-gallery">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">
          Start with a template
        </h2>
        {templates.length > 0 && (
          <button
            className="text-sm font-medium text-[#1a73e8] transition-colors hover:text-[#1765cc]"
            type="button"
          >
            View all
            <span className="ml-1">&rarr;</span>
          </button>
        )}
      </div>
      <div
        className="flex gap-4 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <BlankCard onCreate={handleCreateBlank} />
        {templates.map((t) => (
          <TemplateCard key={t.id} template={t} onUse={handleUseTemplate} />
        ))}
      </div>
    </div>
  );
}
