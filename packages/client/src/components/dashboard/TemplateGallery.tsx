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
import { useCloudStore } from "../../stores/cloudStore";

interface PreviewCell {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  text?: string;
  textColor?: string;
  fontSize?: number;
}

interface TemplatePreviewConfig {
  headerColor: string;
  borderColor: string;
  cells: PreviewCell[];
}

const COLUMN_POSITIONS = [0, 40, 80, 120];
const ROW_HEIGHT = 14;
const GRID_WIDTH = 160;
const GRID_HEIGHT = 100;

function buildBudgetPreview(): TemplatePreviewConfig {
  return {
    headerColor: "#e8f5e9",
    borderColor: "#4caf50",
    cells: [
      {
        x: 0,
        y: 0,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#4caf50",
        text: "Item",
        textColor: "#fff",
        fontSize: 5,
      },
      {
        x: 40,
        y: 0,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#4caf50",
        text: "Budget",
        textColor: "#fff",
        fontSize: 5,
      },
      {
        x: 80,
        y: 0,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#4caf50",
        text: "Actual",
        textColor: "#fff",
        fontSize: 5,
      },
      {
        x: 120,
        y: 0,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#4caf50",
        text: "Diff",
        textColor: "#fff",
        fontSize: 5,
      },
      {
        x: 0,
        y: ROW_HEIGHT,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#f1f8e9",
        text: "Rent",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 40,
        y: ROW_HEIGHT,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#fff",
        text: "$1,200",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 80,
        y: ROW_HEIGHT,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#fff",
        text: "$1,200",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 120,
        y: ROW_HEIGHT,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#fff",
        text: "$0",
        textColor: "#4caf50",
        fontSize: 5,
      },
      {
        x: 0,
        y: ROW_HEIGHT * 2,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#f1f8e9",
        text: "Food",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 40,
        y: ROW_HEIGHT * 2,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#fff",
        text: "$400",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 80,
        y: ROW_HEIGHT * 2,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#fff",
        text: "$450",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 120,
        y: ROW_HEIGHT * 2,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#fff",
        text: "-$50",
        textColor: "#e53935",
        fontSize: 5,
      },
      {
        x: 0,
        y: ROW_HEIGHT * 3,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#f1f8e9",
        text: "Utils",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 40,
        y: ROW_HEIGHT * 3,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#fff",
        text: "$150",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 80,
        y: ROW_HEIGHT * 3,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#fff",
        text: "$130",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 120,
        y: ROW_HEIGHT * 3,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#fff",
        text: "$20",
        textColor: "#4caf50",
        fontSize: 5,
      },
      {
        x: 0,
        y: ROW_HEIGHT * 4,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#e8f5e9",
        text: "Total",
        textColor: "#2e7d32",
        fontSize: 5,
      },
      {
        x: 40,
        y: ROW_HEIGHT * 4,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#e8f5e9",
        text: "$1,750",
        textColor: "#2e7d32",
        fontSize: 5,
      },
      {
        x: 80,
        y: ROW_HEIGHT * 4,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#e8f5e9",
        text: "$1,780",
        textColor: "#2e7d32",
        fontSize: 5,
      },
      {
        x: 120,
        y: ROW_HEIGHT * 4,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#e8f5e9",
        text: "-$30",
        textColor: "#e53935",
        fontSize: 5,
      },
    ],
  };
}

function buildInvoicePreview(): TemplatePreviewConfig {
  return {
    headerColor: "#e3f2fd",
    borderColor: "#1e88e5",
    cells: [
      {
        x: 0,
        y: 0,
        w: 80,
        h: ROW_HEIGHT,
        fill: "#1e88e5",
        text: "INVOICE #1023",
        textColor: "#fff",
        fontSize: 6,
      },
      {
        x: 80,
        y: 0,
        w: 80,
        h: ROW_HEIGHT,
        fill: "#1e88e5",
        text: "Date: 03/11",
        textColor: "#fff",
        fontSize: 5,
      },
      {
        x: 0,
        y: ROW_HEIGHT + 2,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#e3f2fd",
        text: "Item",
        textColor: "#1565c0",
        fontSize: 5,
      },
      {
        x: 40,
        y: ROW_HEIGHT + 2,
        w: 30,
        h: ROW_HEIGHT,
        fill: "#e3f2fd",
        text: "Qty",
        textColor: "#1565c0",
        fontSize: 5,
      },
      {
        x: 70,
        y: ROW_HEIGHT + 2,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#e3f2fd",
        text: "Price",
        textColor: "#1565c0",
        fontSize: 5,
      },
      {
        x: 110,
        y: ROW_HEIGHT + 2,
        w: 50,
        h: ROW_HEIGHT,
        fill: "#e3f2fd",
        text: "Total",
        textColor: "#1565c0",
        fontSize: 5,
      },
      {
        x: 0,
        y: ROW_HEIGHT + 2 + ROW_HEIGHT,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#fff",
        text: "Design",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 40,
        y: ROW_HEIGHT + 2 + ROW_HEIGHT,
        w: 30,
        h: ROW_HEIGHT,
        fill: "#fff",
        text: "10",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 70,
        y: ROW_HEIGHT + 2 + ROW_HEIGHT,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#fff",
        text: "$85",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 110,
        y: ROW_HEIGHT + 2 + ROW_HEIGHT,
        w: 50,
        h: ROW_HEIGHT,
        fill: "#fff",
        text: "$850",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 0,
        y: ROW_HEIGHT + 2 + ROW_HEIGHT * 2,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#f5f5f5",
        text: "Dev",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 40,
        y: ROW_HEIGHT + 2 + ROW_HEIGHT * 2,
        w: 30,
        h: ROW_HEIGHT,
        fill: "#f5f5f5",
        text: "20",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 70,
        y: ROW_HEIGHT + 2 + ROW_HEIGHT * 2,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#f5f5f5",
        text: "$95",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 110,
        y: ROW_HEIGHT + 2 + ROW_HEIGHT * 2,
        w: 50,
        h: ROW_HEIGHT,
        fill: "#f5f5f5",
        text: "$1,900",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 110,
        y: ROW_HEIGHT + 2 + ROW_HEIGHT * 3 + 2,
        w: 50,
        h: ROW_HEIGHT,
        fill: "#1e88e5",
        text: "$2,750",
        textColor: "#fff",
        fontSize: 5,
      },
    ],
  };
}

function buildProjectTrackerPreview(): TemplatePreviewConfig {
  return {
    headerColor: "#f3e5f5",
    borderColor: "#8e24aa",
    cells: [
      {
        x: 0,
        y: 0,
        w: 50,
        h: ROW_HEIGHT,
        fill: "#8e24aa",
        text: "Task",
        textColor: "#fff",
        fontSize: 5,
      },
      {
        x: 50,
        y: 0,
        w: 35,
        h: ROW_HEIGHT,
        fill: "#8e24aa",
        text: "Owner",
        textColor: "#fff",
        fontSize: 5,
      },
      {
        x: 85,
        y: 0,
        w: 35,
        h: ROW_HEIGHT,
        fill: "#8e24aa",
        text: "Status",
        textColor: "#fff",
        fontSize: 5,
      },
      {
        x: 120,
        y: 0,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#8e24aa",
        text: "Due",
        textColor: "#fff",
        fontSize: 5,
      },
      {
        x: 0,
        y: ROW_HEIGHT,
        w: 50,
        h: ROW_HEIGHT,
        fill: "#fff",
        text: "Design",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 50,
        y: ROW_HEIGHT,
        w: 35,
        h: ROW_HEIGHT,
        fill: "#fff",
        text: "Alice",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 85,
        y: ROW_HEIGHT,
        w: 35,
        h: ROW_HEIGHT,
        fill: "#c8e6c9",
        text: "Done",
        textColor: "#2e7d32",
        fontSize: 5,
      },
      {
        x: 120,
        y: ROW_HEIGHT,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#fff",
        text: "Mar 5",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 0,
        y: ROW_HEIGHT * 2,
        w: 50,
        h: ROW_HEIGHT,
        fill: "#fafafa",
        text: "Backend",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 50,
        y: ROW_HEIGHT * 2,
        w: 35,
        h: ROW_HEIGHT,
        fill: "#fafafa",
        text: "Bob",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 85,
        y: ROW_HEIGHT * 2,
        w: 35,
        h: ROW_HEIGHT,
        fill: "#fff9c4",
        text: "In Prog",
        textColor: "#f57f17",
        fontSize: 5,
      },
      {
        x: 120,
        y: ROW_HEIGHT * 2,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#fafafa",
        text: "Mar 12",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 0,
        y: ROW_HEIGHT * 3,
        w: 50,
        h: ROW_HEIGHT,
        fill: "#fff",
        text: "Testing",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 50,
        y: ROW_HEIGHT * 3,
        w: 35,
        h: ROW_HEIGHT,
        fill: "#fff",
        text: "Carol",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 85,
        y: ROW_HEIGHT * 3,
        w: 35,
        h: ROW_HEIGHT,
        fill: "#ffcdd2",
        text: "Todo",
        textColor: "#c62828",
        fontSize: 5,
      },
      {
        x: 120,
        y: ROW_HEIGHT * 3,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#fff",
        text: "Mar 20",
        textColor: "#333",
        fontSize: 5,
      },
    ],
  };
}

function buildSchedulePreview(): TemplatePreviewConfig {
  return {
    headerColor: "#fff3e0",
    borderColor: "#ef6c00",
    cells: [
      {
        x: 0,
        y: 0,
        w: 32,
        h: ROW_HEIGHT,
        fill: "#ef6c00",
        text: "Time",
        textColor: "#fff",
        fontSize: 5,
      },
      {
        x: 32,
        y: 0,
        w: 32,
        h: ROW_HEIGHT,
        fill: "#ef6c00",
        text: "Mon",
        textColor: "#fff",
        fontSize: 5,
      },
      {
        x: 64,
        y: 0,
        w: 32,
        h: ROW_HEIGHT,
        fill: "#ef6c00",
        text: "Tue",
        textColor: "#fff",
        fontSize: 5,
      },
      {
        x: 96,
        y: 0,
        w: 32,
        h: ROW_HEIGHT,
        fill: "#ef6c00",
        text: "Wed",
        textColor: "#fff",
        fontSize: 5,
      },
      {
        x: 128,
        y: 0,
        w: 32,
        h: ROW_HEIGHT,
        fill: "#ef6c00",
        text: "Thu",
        textColor: "#fff",
        fontSize: 5,
      },
      {
        x: 0,
        y: ROW_HEIGHT,
        w: 32,
        h: ROW_HEIGHT,
        fill: "#fff3e0",
        text: "9 AM",
        textColor: "#666",
        fontSize: 5,
      },
      {
        x: 32,
        y: ROW_HEIGHT,
        w: 64,
        h: ROW_HEIGHT,
        fill: "#bbdefb",
        text: "Team Sync",
        textColor: "#1565c0",
        fontSize: 5,
      },
      {
        x: 96,
        y: ROW_HEIGHT,
        w: 32,
        h: ROW_HEIGHT,
        fill: "#fff",
        text: "",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 128,
        y: ROW_HEIGHT,
        w: 32,
        h: ROW_HEIGHT,
        fill: "#c8e6c9",
        text: "Review",
        textColor: "#2e7d32",
        fontSize: 5,
      },
      {
        x: 0,
        y: ROW_HEIGHT * 2,
        w: 32,
        h: ROW_HEIGHT,
        fill: "#fff3e0",
        text: "10 AM",
        textColor: "#666",
        fontSize: 5,
      },
      {
        x: 32,
        y: ROW_HEIGHT * 2,
        w: 32,
        h: ROW_HEIGHT,
        fill: "#fff",
        text: "",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 64,
        y: ROW_HEIGHT * 2,
        w: 32,
        h: ROW_HEIGHT,
        fill: "#e1bee7",
        text: "Design",
        textColor: "#6a1b9a",
        fontSize: 5,
      },
      {
        x: 96,
        y: ROW_HEIGHT * 2,
        w: 64,
        h: ROW_HEIGHT,
        fill: "#ffccbc",
        text: "Workshop",
        textColor: "#bf360c",
        fontSize: 5,
      },
      {
        x: 0,
        y: ROW_HEIGHT * 3,
        w: 32,
        h: ROW_HEIGHT,
        fill: "#fff3e0",
        text: "11 AM",
        textColor: "#666",
        fontSize: 5,
      },
      {
        x: 32,
        y: ROW_HEIGHT * 3,
        w: 32,
        h: ROW_HEIGHT,
        fill: "#c8e6c9",
        text: "Sprint",
        textColor: "#2e7d32",
        fontSize: 5,
      },
      {
        x: 64,
        y: ROW_HEIGHT * 3,
        w: 32,
        h: ROW_HEIGHT,
        fill: "#e1bee7",
        text: "Design",
        textColor: "#6a1b9a",
        fontSize: 5,
      },
      {
        x: 96,
        y: ROW_HEIGHT * 3,
        w: 32,
        h: ROW_HEIGHT,
        fill: "#fff",
        text: "",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 128,
        y: ROW_HEIGHT * 3,
        w: 32,
        h: ROW_HEIGHT,
        fill: "#bbdefb",
        text: "1:1",
        textColor: "#1565c0",
        fontSize: 5,
      },
    ],
  };
}

function buildGradebookPreview(): TemplatePreviewConfig {
  return {
    headerColor: "#ffebee",
    borderColor: "#e53935",
    cells: [
      {
        x: 0,
        y: 0,
        w: 50,
        h: ROW_HEIGHT,
        fill: "#e53935",
        text: "Student",
        textColor: "#fff",
        fontSize: 5,
      },
      {
        x: 50,
        y: 0,
        w: 28,
        h: ROW_HEIGHT,
        fill: "#e53935",
        text: "HW1",
        textColor: "#fff",
        fontSize: 5,
      },
      {
        x: 78,
        y: 0,
        w: 28,
        h: ROW_HEIGHT,
        fill: "#e53935",
        text: "HW2",
        textColor: "#fff",
        fontSize: 5,
      },
      {
        x: 106,
        y: 0,
        w: 28,
        h: ROW_HEIGHT,
        fill: "#e53935",
        text: "Exam",
        textColor: "#fff",
        fontSize: 5,
      },
      {
        x: 134,
        y: 0,
        w: 26,
        h: ROW_HEIGHT,
        fill: "#e53935",
        text: "Avg",
        textColor: "#fff",
        fontSize: 5,
      },
      {
        x: 0,
        y: ROW_HEIGHT,
        w: 50,
        h: ROW_HEIGHT,
        fill: "#fff",
        text: "Emma S.",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 50,
        y: ROW_HEIGHT,
        w: 28,
        h: ROW_HEIGHT,
        fill: "#fff",
        text: "95",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 78,
        y: ROW_HEIGHT,
        w: 28,
        h: ROW_HEIGHT,
        fill: "#fff",
        text: "88",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 106,
        y: ROW_HEIGHT,
        w: 28,
        h: ROW_HEIGHT,
        fill: "#fff",
        text: "92",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 134,
        y: ROW_HEIGHT,
        w: 26,
        h: ROW_HEIGHT,
        fill: "#c8e6c9",
        text: "92",
        textColor: "#2e7d32",
        fontSize: 5,
      },
      {
        x: 0,
        y: ROW_HEIGHT * 2,
        w: 50,
        h: ROW_HEIGHT,
        fill: "#fafafa",
        text: "Liam K.",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 50,
        y: ROW_HEIGHT * 2,
        w: 28,
        h: ROW_HEIGHT,
        fill: "#fafafa",
        text: "78",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 78,
        y: ROW_HEIGHT * 2,
        w: 28,
        h: ROW_HEIGHT,
        fill: "#fafafa",
        text: "82",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 106,
        y: ROW_HEIGHT * 2,
        w: 28,
        h: ROW_HEIGHT,
        fill: "#fafafa",
        text: "75",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 134,
        y: ROW_HEIGHT * 2,
        w: 26,
        h: ROW_HEIGHT,
        fill: "#fff9c4",
        text: "78",
        textColor: "#f57f17",
        fontSize: 5,
      },
      {
        x: 0,
        y: ROW_HEIGHT * 3,
        w: 50,
        h: ROW_HEIGHT,
        fill: "#fff",
        text: "Noah P.",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 50,
        y: ROW_HEIGHT * 3,
        w: 28,
        h: ROW_HEIGHT,
        fill: "#fff",
        text: "90",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 78,
        y: ROW_HEIGHT * 3,
        w: 28,
        h: ROW_HEIGHT,
        fill: "#fff",
        text: "94",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 106,
        y: ROW_HEIGHT * 3,
        w: 28,
        h: ROW_HEIGHT,
        fill: "#fff",
        text: "88",
        textColor: "#333",
        fontSize: 5,
      },
      {
        x: 134,
        y: ROW_HEIGHT * 3,
        w: 26,
        h: ROW_HEIGHT,
        fill: "#c8e6c9",
        text: "91",
        textColor: "#2e7d32",
        fontSize: 5,
      },
    ],
  };
}

function buildDefaultPreview(): TemplatePreviewConfig {
  return {
    headerColor: "#f5f5f5",
    borderColor: "#9e9e9e",
    cells: [
      {
        x: 0,
        y: 0,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#e0e0e0",
        text: "A",
        textColor: "#666",
        fontSize: 5,
      },
      {
        x: 40,
        y: 0,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#e0e0e0",
        text: "B",
        textColor: "#666",
        fontSize: 5,
      },
      {
        x: 80,
        y: 0,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#e0e0e0",
        text: "C",
        textColor: "#666",
        fontSize: 5,
      },
      {
        x: 120,
        y: 0,
        w: 40,
        h: ROW_HEIGHT,
        fill: "#e0e0e0",
        text: "D",
        textColor: "#666",
        fontSize: 5,
      },
      ...Array.from({ length: 4 }, (_, row) =>
        COLUMN_POSITIONS.map((x) => ({
          x,
          y: (row + 1) * ROW_HEIGHT,
          w: 40,
          h: ROW_HEIGHT,
          fill: row % 2 === 0 ? "#fff" : "#fafafa",
          fontSize: 5,
        })),
      ).flat(),
    ],
  };
}

const TEMPLATE_PREVIEWS: Record<string, () => TemplatePreviewConfig> = {
  Budget: buildBudgetPreview,
  Invoice: buildInvoicePreview,
  "Project Tracker": buildProjectTrackerPreview,
  Schedule: buildSchedulePreview,
  Gradebook: buildGradebookPreview,
};

const TemplateThumbnail = React.memo(function TemplateThumbnail({
  templateName,
}: {
  templateName: string;
}) {
  const builder = TEMPLATE_PREVIEWS[templateName] ?? buildDefaultPreview;
  const config = builder();

  return (
    <svg
      viewBox={`0 0 ${GRID_WIDTH} ${GRID_HEIGHT}`}
      className="w-full h-full"
      role="img"
      aria-label={`${templateName} preview`}
    >
      <rect width={GRID_WIDTH} height={GRID_HEIGHT} fill="#fff" rx="2" />
      {config.cells.map((cell, i) => (
        <g key={i}>
          <rect
            x={cell.x}
            y={cell.y}
            width={cell.w}
            height={cell.h}
            fill={cell.fill}
            stroke="#e0e0e0"
            strokeWidth="0.5"
          />
          {cell.text && (
            <text
              x={cell.x + 3}
              y={cell.y + cell.h / 2 + 2}
              fontSize={cell.fontSize ?? 5}
              fill={cell.textColor ?? "#333"}
              fontFamily="system-ui, sans-serif"
            >
              {cell.text}
            </text>
          )}
        </g>
      ))}
      <rect
        x="0"
        y="0"
        width={GRID_WIDTH}
        height={GRID_HEIGHT}
        fill="none"
        stroke={config.borderColor}
        strokeWidth="1"
        rx="2"
      />
    </svg>
  );
});

function BlankCard({ onCreate }: { onCreate: () => void }) {
  return (
    <button
      onClick={onCreate}
      className="group/card flex min-w-[156px] flex-col items-center rounded-lg border-2 border-dashed border-gray-300 bg-white transition-all hover:border-[#1a73e8] hover:shadow-lg hover:scale-[1.02] cursor-pointer"
      style={{ minWidth: 156, width: 156 }}
      data-testid="template-card-blank"
      type="button"
    >
      <div
        className="flex w-full items-center justify-center rounded-t-md bg-white"
        style={{ height: 100 }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          className="transition-transform group-hover/card:scale-110"
        >
          <rect x="4" y="4" width="40" height="40" rx="8" fill="#e8f5e9" />
          <line
            x1="24"
            y1="14"
            x2="24"
            y2="34"
            stroke="#34a853"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="14"
            y1="24"
            x2="34"
            y2="24"
            stroke="#34a853"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="flex w-full flex-col items-center gap-0.5 border-t border-gray-100 px-3 py-2.5">
        <span className="text-sm font-medium text-gray-800">Blank</span>
        <span className="text-xs text-gray-400">Empty spreadsheet</span>
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

  return (
    <button
      onClick={() => onUse(template.id)}
      className="group/card flex min-w-[156px] flex-col items-center rounded-lg border border-gray-200/80 bg-white transition-all hover:border-[#1a73e8]/40 hover:shadow-lg hover:scale-[1.02] cursor-pointer overflow-hidden"
      style={{ minWidth: 156, width: 156 }}
      data-testid={`template-card-${template.id}`}
      type="button"
    >
      <div
        className="w-full overflow-hidden rounded-t-md"
        style={{ height: 100 }}
      >
        <TemplateThumbnail templateName={name} />
      </div>
      <div className="flex w-full flex-col items-center gap-0.5 border-t border-gray-100 px-3 py-2.5">
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
  const createSpreadsheet = useCloudStore((s) => s.createSpreadsheet);

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
      const spreadsheet = await createSpreadsheet();
      navigate(`/spreadsheet/${spreadsheet.id}`);
    } catch {
      // Error handled in store
    }
  }, [createSpreadsheet, navigate]);

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
              className="flex min-w-[156px] flex-col items-center rounded-lg border border-gray-200 bg-white animate-pulse"
              style={{ minWidth: 156, width: 156 }}
            >
              <div className="w-full bg-gray-200" style={{ height: 100 }} />
              <div className="flex flex-col items-center gap-1 px-3 py-2.5">
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
        <BlankCard onCreate={handleCreateBlank} />
        {templates.map((t) => (
          <TemplateCard key={t.id} template={t} onUse={handleUseTemplate} />
        ))}
      </div>
    </div>
  );
}
