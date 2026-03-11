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

/** Mini-spreadsheet preview data for each known template type */
interface PreviewCell {
  text: string;
  bold?: boolean;
  color?: string;
  bg?: string;
}

interface TemplatePreviewConfig {
  headerBg: string;
  headerColor: string;
  borderColor: string;
  rows: PreviewCell[][];
}

const TEMPLATE_PREVIEWS: Record<string, TemplatePreviewConfig> = {
  Budget: {
    headerBg: "#34a853",
    headerColor: "#fff",
    borderColor: "#c8e6c9",
    rows: [
      [
        { text: "Category", bold: true, color: "#fff", bg: "#34a853" },
        { text: "Budget", bold: true, color: "#fff", bg: "#34a853" },
        { text: "Actual", bold: true, color: "#fff", bg: "#34a853" },
      ],
      [
        { text: "Rent" },
        { text: "$1,200" },
        { text: "$1,200", color: "#34a853" },
      ],
      [{ text: "Food" }, { text: "$400" }, { text: "$385", color: "#34a853" }],
      [
        { text: "Transport" },
        { text: "$150" },
        { text: "$172", color: "#ea4335" },
      ],
    ],
  },
  Invoice: {
    headerBg: "#4285f4",
    headerColor: "#fff",
    borderColor: "#bbdefb",
    rows: [
      [
        { text: "Item", bold: true, color: "#fff", bg: "#4285f4" },
        { text: "Qty", bold: true, color: "#fff", bg: "#4285f4" },
        { text: "Price", bold: true, color: "#fff", bg: "#4285f4" },
      ],
      [{ text: "Design" }, { text: "1" }, { text: "$500" }],
      [{ text: "Dev" }, { text: "3" }, { text: "$1,500" }],
      [
        { text: "Total", bold: true },
        { text: "" },
        { text: "$2,000", bold: true },
      ],
    ],
  },
  "Project Tracker": {
    headerBg: "#9334e6",
    headerColor: "#fff",
    borderColor: "#e1bee7",
    rows: [
      [
        { text: "Task", bold: true, color: "#fff", bg: "#9334e6" },
        { text: "Status", bold: true, color: "#fff", bg: "#9334e6" },
        { text: "Due", bold: true, color: "#fff", bg: "#9334e6" },
      ],
      [{ text: "Design" }, { text: "Done", color: "#34a853" }, { text: "3/1" }],
      [
        { text: "Backend" },
        { text: "In Prog", color: "#f9ab00" },
        { text: "3/8" },
      ],
      [
        { text: "Testing" },
        { text: "To Do", color: "#9e9e9e" },
        { text: "3/15" },
      ],
    ],
  },
  Schedule: {
    headerBg: "#fa7b17",
    headerColor: "#fff",
    borderColor: "#ffe0b2",
    rows: [
      [
        { text: "Time", bold: true, color: "#fff", bg: "#fa7b17" },
        { text: "Mon", bold: true, color: "#fff", bg: "#fa7b17" },
        { text: "Tue", bold: true, color: "#fff", bg: "#fa7b17" },
      ],
      [
        { text: "9 AM" },
        { text: "Math", bg: "#e8f5e9" },
        { text: "English", bg: "#e3f2fd" },
      ],
      [
        { text: "10 AM" },
        { text: "Science", bg: "#fce4ec" },
        { text: "Art", bg: "#fff3e0" },
      ],
      [
        { text: "11 AM" },
        { text: "English", bg: "#e3f2fd" },
        { text: "Math", bg: "#e8f5e9" },
      ],
    ],
  },
  Gradebook: {
    headerBg: "#ea4335",
    headerColor: "#fff",
    borderColor: "#ffcdd2",
    rows: [
      [
        { text: "Student", bold: true, color: "#fff", bg: "#ea4335" },
        { text: "Test 1", bold: true, color: "#fff", bg: "#ea4335" },
        { text: "Grade", bold: true, color: "#fff", bg: "#ea4335" },
      ],
      [{ text: "Alice" }, { text: "95" }, { text: "A", color: "#34a853" }],
      [{ text: "Bob" }, { text: "82" }, { text: "B", color: "#4285f4" }],
      [{ text: "Carol" }, { text: "74" }, { text: "C", color: "#fa7b17" }],
    ],
  },
  "To-do List": {
    headerBg: "#1a73e8",
    headerColor: "#fff",
    borderColor: "#bbdefb",
    rows: [
      [
        { text: "Task", bold: true, color: "#fff", bg: "#1a73e8" },
        { text: "Done", bold: true, color: "#fff", bg: "#1a73e8" },
        { text: "Priority", bold: true, color: "#fff", bg: "#1a73e8" },
      ],
      [
        { text: "Research" },
        { text: "\u2713", color: "#34a853" },
        { text: "High", color: "#ea4335" },
      ],
      [
        { text: "Draft" },
        { text: "\u2713", color: "#34a853" },
        { text: "Med", color: "#fa7b17" },
      ],
      [{ text: "Review" }, { text: "" }, { text: "Low", color: "#34a853" }],
    ],
  },
};

const DEFAULT_PREVIEW: TemplatePreviewConfig = {
  headerBg: "#5f6368",
  headerColor: "#fff",
  borderColor: "#e0e0e0",
  rows: [
    [
      { text: "A", bold: true, color: "#fff", bg: "#5f6368" },
      { text: "B", bold: true, color: "#fff", bg: "#5f6368" },
      { text: "C", bold: true, color: "#fff", bg: "#5f6368" },
    ],
    [{ text: "Data 1" }, { text: "100" }, { text: "Yes" }],
    [{ text: "Data 2" }, { text: "200" }, { text: "No" }],
    [{ text: "Data 3" }, { text: "300" }, { text: "Yes" }],
  ],
};

/** Renders a tiny CSS grid that looks like a miniature spreadsheet */
const MiniSpreadsheetPreview = React.memo(function MiniSpreadsheetPreview({
  config,
}: {
  config: TemplatePreviewConfig;
}) {
  return (
    <div
      className="overflow-hidden rounded-md border"
      style={{
        width: 130,
        height: 80,
        borderColor: config.borderColor,
        fontSize: 7,
        lineHeight: "14px",
      }}
      data-testid="template-preview"
    >
      {config.rows.map((row, ri) => (
        <div key={ri} style={{ display: "flex" }}>
          {row.map((cell, ci) => (
            <div
              key={ci}
              style={{
                flex: 1,
                padding: "1px 3px",
                backgroundColor:
                  cell.bg ?? (ri === 0 ? config.headerBg : "#fff"),
                color:
                  cell.color ?? (ri === 0 ? config.headerColor : "#3c4043"),
                fontWeight: cell.bold ? 600 : 400,
                borderBottom: `1px solid ${config.borderColor}`,
                borderRight:
                  ci < row.length - 1
                    ? `1px solid ${config.borderColor}`
                    : "none",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {cell.text}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
});

function BlankSpreadsheetCard({ onCreate }: { onCreate: () => void }) {
  return (
    <button
      onClick={onCreate}
      className="group/card flex min-w-[160px] flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-white px-5 py-5 transition-all hover:border-[#34a853] hover:shadow-lg hover:scale-[1.02] cursor-pointer text-center"
      style={{ padding: "20px", minWidth: 160 }}
      data-testid="template-card-blank"
      type="button"
    >
      <div
        className="flex items-center justify-center rounded-md border border-gray-200 bg-gray-50 transition-colors group-hover/card:border-[#34a853]/40 group-hover/card:bg-green-50"
        style={{ width: 130, height: 80 }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 36 36"
          fill="none"
          className="text-[#34a853]"
        >
          <line
            x1="18"
            y1="8"
            x2="18"
            y2="28"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="8"
            y1="18"
            x2="28"
            y2="18"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-sm font-medium text-gray-800">Blank</span>
        <span className="text-xs text-gray-400">New spreadsheet</span>
      </div>
    </button>
  );
}

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
      className="group/card flex min-w-[160px] flex-col items-center gap-3 rounded-xl border border-gray-200/80 bg-white px-5 py-5 transition-all hover:border-[#1a73e8]/40 hover:shadow-lg hover:scale-[1.02] cursor-pointer text-center"
      style={{ padding: "20px", minWidth: 160 }}
      data-testid={`template-card-${template.id}`}
      type="button"
    >
      <div className="transition-transform group-hover/card:scale-105">
        <MiniSpreadsheetPreview config={preview} />
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-sm font-medium text-gray-800">{name}</span>
        <span className="text-xs text-gray-400">
          {template.owner.name ?? "GridSpace"}
        </span>
      </div>
    </button>
  );
}

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

  const handleCreateBlank = useCallback(async () => {
    try {
      const { useCloudStore } = await import("../../stores/cloudStore");
      const spreadsheet = await useCloudStore.getState().createSpreadsheet();
      navigate(`/spreadsheet/${spreadsheet.id}`);
    } catch {
      // Error handled in store
    }
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
              className="flex min-w-[160px] flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-5 animate-pulse"
            >
              <div
                className="rounded-md bg-gray-200"
                style={{ width: 130, height: 80 }}
              />
              <div className="flex flex-col items-center gap-1">
                <div className="h-4 w-16 rounded bg-gray-200" />
                <div className="h-3 w-12 rounded bg-gray-200" />
              </div>
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
        <BlankSpreadsheetCard onCreate={handleCreateBlank} />
        {templates.map((t) => (
          <TemplateCard key={t.id} template={t} onUse={handleUseTemplate} />
        ))}
      </div>
    </div>
  );
}
