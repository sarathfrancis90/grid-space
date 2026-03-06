/**
 * ReactionPicker — emoji reaction picker and display for comment threads.
 * Shows a small picker with common emojis and displays reaction counts.
 */
import { useState, useCallback, memo } from "react";
import type { ReactionSummary } from "../../types/grid";

const QUICK_EMOJIS = [
  "\u{1F44D}", // thumbs up
  "\u{1F44E}", // thumbs down
  "\u{2764}\u{FE0F}", // heart
  "\u{1F604}", // smile
  "\u{1F389}", // party
  "\u{1F914}", // thinking
  "\u{1F44F}", // clap
  "\u{1F525}", // fire
];

interface ReactionPickerProps {
  commentId: string;
  reactions: ReactionSummary[];
  onToggleReaction: (commentId: string, emoji: string) => void;
}

export const ReactionPicker = memo(function ReactionPicker({
  commentId,
  reactions,
  onToggleReaction,
}: ReactionPickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleEmojiClick = useCallback(
    (emoji: string) => {
      onToggleReaction(commentId, emoji);
      setShowPicker(false);
    },
    [commentId, onToggleReaction],
  );

  const handleTogglePicker = useCallback(() => {
    setShowPicker((prev) => !prev);
  }, []);

  return (
    <div className="mt-1">
      {/* Existing reactions display */}
      {reactions.length > 0 && (
        <div
          className="flex flex-wrap gap-1 mb-1"
          data-testid={`reactions-display-${commentId}`}
        >
          {reactions.map((r) => (
            <button
              key={r.emoji}
              type="button"
              data-testid={`reaction-badge-${commentId}-${r.emoji}`}
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors ${
                r.currentUserReacted
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => handleEmojiClick(r.emoji)}
              title={r.users.map((u) => u.userName).join(", ")}
            >
              <span>{r.emoji}</span>
              <span>{r.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Add reaction button */}
      <div className="relative inline-block">
        <button
          type="button"
          data-testid={`reaction-add-btn-${commentId}`}
          className="text-xs text-gray-400 hover:text-gray-600 px-1 py-0.5 rounded hover:bg-gray-100"
          onClick={handleTogglePicker}
          aria-label="Add reaction"
        >
          +
        </button>

        {showPicker && (
          <div
            data-testid={`reaction-picker-${commentId}`}
            className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1.5 flex flex-wrap gap-1 z-50 w-48"
          >
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                data-testid={`reaction-emoji-${commentId}-${emoji}`}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-base cursor-pointer"
                onClick={() => handleEmojiClick(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
