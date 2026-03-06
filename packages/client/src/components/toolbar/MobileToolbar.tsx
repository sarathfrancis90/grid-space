/**
 * MobileToolbar — collapsible hamburger wrapper around the full Toolbar
 * for screens narrower than 768px.
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { Toolbar } from "./Toolbar";

export function MobileToolbar() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Close when clicking outside the panel
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={panelRef} data-testid="mobile-toolbar">
      <button
        data-testid="mobile-toolbar-toggle"
        className="flex items-center justify-center h-9 w-full bg-[#f3f3f3] border-b border-gray-200 hover:bg-gray-200 transition-colors"
        style={{ height: "36px" }}
        onClick={toggle}
        type="button"
        aria-expanded={isOpen}
        aria-label="Toggle toolbar"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {isOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </>
          )}
        </svg>
        <span className="ml-2 text-xs text-gray-600 font-medium">
          {isOpen ? "Close Toolbar" : "Formatting"}
        </span>
      </button>
      {isOpen && (
        <div
          data-testid="mobile-toolbar-panel"
          className="overflow-x-auto overflow-y-hidden"
        >
          <Toolbar />
        </div>
      )}
    </div>
  );
}
