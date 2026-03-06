import { useState, useCallback, useRef, useEffect } from "react";
import type { CommentReaction } from "../../types/grid";

const DEFAULT_EMOJIS = [
  "\u{1F44D}",
  "\u{1F44E}",
  "\u{2764}\u{FE0F}",
  "\u{1F604}",
  "\u{1F622}",
  "\u{1F44F}",
  "\u{1F525}",
  "\u{1F440}",
  "\u{1F389}",
  "\u{1F4AF}",
  "\u{2705}",
  "\u{274C}",
];

interface ReactionPickerProps {
  reactions: CommentReaction[];
  currentUserId: string;
  onToggleReaction: (emoji: string) => void;
}

export function ReactionPicker({
  reactions,
  currentUserId,
  onToggleReaction,
}: ReactionPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
      setShowPicker(false);
    }
  }, []);

  useEffect(() => {
    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showPicker, handleClickOutside]);

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      onToggleReaction(emoji);
      setShowPicker(false);
    },
    [onToggleReaction],
  );

  const handleKeyDown = useCallback(
    (emoji: string, e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleEmojiSelect(emoji);
      }
    },
    [handleEmojiSelect],
  );

  const handlePickerKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setShowPicker((v) => !v);
    } else if (e.key === "Escape") {
      setShowPicker(false);
    }
  }, []);

  return (
    <div className="mt-1" ref={pickerRef}>
      {reactions.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1" data-testid="reaction-list">
          {reactions.map((r) => (
            <button
              key={r.emoji}
              type="button"
              data-testid={`reaction-badge-${r.emoji}`}
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors ${
                r.userIds.includes(currentUserId)
                  ? "border-blue-400 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => onToggleReaction(r.emoji)}
              title={`${r.userIds.length} reaction${r.userIds.length !== 1 ? "s" : ""}`}
            >
              <span>{r.emoji}</span>
              <span>{r.count}</span>
            </button>
          ))}
        </div>
      )}

      <div className="relative inline-block">
        <button
          type="button"
          data-testid="reaction-add-btn"
          className="text-xs text-gray-400 hover:text-gray-600 px-1 py-0.5 rounded hover:bg-gray-100"
          onClick={() => setShowPicker((v) => !v)}
          onKeyDown={handlePickerKeyDown}
          aria-label="Add reaction"
          aria-expanded={showPicker}
        >
          +
        </button>

        {showPicker && (
          <div
            data-testid="reaction-picker-popup"
            className="absolute bottom-full left-0 mb-1 p-1.5 bg-white border border-gray-200 rounded-lg shadow-lg z-50 grid grid-cols-6 gap-1"
            role="grid"
            aria-label="Emoji picker"
          >
            {DEFAULT_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                data-testid={`reaction-emoji-${emoji}`}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-base cursor-pointer"
                onClick={() => handleEmojiSelect(emoji)}
                onKeyDown={(e) => handleKeyDown(emoji, e)}
                role="gridcell"
                tabIndex={0}
                aria-label={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
