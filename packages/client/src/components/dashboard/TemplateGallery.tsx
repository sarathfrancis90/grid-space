/**
 * TemplateGallery — display template cards on the dashboard.
 * S15-015: Template gallery on dashboard
 * S15-016: Create spreadsheet from template
 * S15-017: Built-in templates
 */
import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  useTemplateStore,
  type TemplateSummary,
} from "../../stores/templateStore";

const TEMPLATE_ICONS: Record<string, string> = {
  Budget: "$",
  Invoice: "#",
  "Project Tracker": "P",
  Schedule: "S",
  Gradebook: "G",
};

const TEMPLATE_COLORS: Record<string, { bg: string; text: string }> = {
  Budget: { bg: "bg-green-100", text: "text-green-700" },
  Invoice: { bg: "bg-blue-100", text: "text-blue-700" },
  "Project Tracker": { bg: "bg-purple-100", text: "text-purple-700" },
  Schedule: { bg: "bg-orange-100", text: "text-orange-700" },
  Gradebook: { bg: "bg-red-100", text: "text-red-700" },
};

function TemplateCard({
  template,
  onUse,
}: {
  template: TemplateSummary;
  onUse: (id: string) => void;
}) {
  const name = template.templateName ?? template.title;
  const icon = TEMPLATE_ICONS[name] ?? name.charAt(0).toUpperCase();
  const colors = TEMPLATE_COLORS[name] ?? {
    bg: "bg-gray-100",
    text: "text-gray-700",
  };

  return (
    <button
      onClick={() => onUse(template.id)}
      className="group/card flex min-w-[140px] flex-col items-center gap-3 rounded-xl border border-gray-200/80 bg-white px-5 py-5 transition-all hover:border-[#1a73e8]/40 hover:shadow-lg hover:scale-[1.02] cursor-pointer text-center"
      style={{ padding: "20px", minWidth: 140 }}
      data-testid={`template-card-${template.id}`}
      type="button"
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold ${colors.bg} ${colors.text} transition-transform group-hover/card:scale-110`}
        style={{ height: 56, width: 56, fontSize: 22 }}
      >
        {icon}
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

  if (isLoading) {
    return (
      <div data-testid="template-gallery-loading">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">
            Start with a template
          </h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex min-w-[160px] flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-5 animate-pulse"
            >
              <div className="h-12 w-12 rounded-full bg-gray-200" />
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

  if (templates.length === 0) return null;

  return (
    <div data-testid="template-gallery">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">
          Start with a template
        </h2>
        <button
          className="text-sm font-medium text-[#1a73e8] transition-colors hover:text-[#1765cc]"
          type="button"
        >
          View all
          <span className="ml-1">&rarr;</span>
        </button>
      </div>
      <div
        className="flex gap-4 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {templates.map((t) => (
          <TemplateCard key={t.id} template={t} onUse={handleUseTemplate} />
        ))}
      </div>
    </div>
  );
}
