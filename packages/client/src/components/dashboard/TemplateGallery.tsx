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

const TEMPLATE_COLORS: Record<string, string> = {
  Budget: "bg-green-100 text-green-700",
  Invoice: "bg-blue-100 text-blue-700",
  "Project Tracker": "bg-purple-100 text-purple-700",
  Schedule: "bg-orange-100 text-orange-700",
  Gradebook: "bg-red-100 text-red-700",
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
  const colorClass = TEMPLATE_COLORS[name] ?? "bg-gray-100 text-gray-700";

  return (
    <button
      onClick={() => onUse(template.id)}
      className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 p-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer text-center"
      data-testid={`template-card-${template.id}`}
      type="button"
    >
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold ${colorClass}`}
      >
        {icon}
      </div>
      <span className="text-sm font-medium text-gray-800">{name}</span>
      <span className="text-xs text-gray-400">
        {template.owner.name ?? "GridSpace"}
      </span>
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
      <div className="mb-8" data-testid="template-gallery-loading">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Start with a template
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-28 h-28 rounded-lg border border-gray-200 bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (templates.length === 0) return null;

  return (
    <div className="mb-8" data-testid="template-gallery">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">
        Start with a template
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {templates.map((t) => (
          <div key={t.id} className="flex-shrink-0">
            <TemplateCard template={t} onUse={handleUseTemplate} />
          </div>
        ))}
      </div>
    </div>
  );
}
