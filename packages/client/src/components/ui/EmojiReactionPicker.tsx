/**
 * EmojiReactionPicker — displays emoji reaction badges on a comment
 * and provides a picker to add/remove reactions.
 */
import { useState, useCallback } from "react";
import React from "react";
import type { CommentReaction } from "../../types/grid";

const QUICK_EMOJIS = [
  "\u{1F44D}", // thumbs up
  "\u{1F44E}", // thumbs down
  "\u{2764}\u{FE0F}", // red heart
  "\u{1F604}", // grinning face
  "\u{1F622}", // crying face
  "\u{1F389}", // party popper
  "\u{1F525}", // fire
  "\u{1F440}", // eyes
  "\u{2705}", // check mark
  "\u{1F4AF}", // 100
  "\u{1F64F}", // folded hands
  "\u{1F680}", // rocket
];

interface EmojiReactionPickerProps {
  reactions: CommentReaction[];
  currentUserId: string;
  onToggleReaction: (emoji: string) => void;
}

export const EmojiReactionPicker = React.memo(function EmojiReactionPicker({
  reactions,
  currentUserId,
  onToggleReaction,
}: EmojiReactionPickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      onToggleReaction(emoji);
      setShowPicker(false);
    },
    [onToggleReaction],
  );

  const handlePickerToggle = useCallback(() => {
    setShowPicker((prev) => !prev);
  }, []);

  return (
    <div className="mt-1" data-testid="reaction-container">
      {/* Existing reaction badges */}
      <div className="flex flex-wrap gap-1 items-center">
        {reactions.map((r) => {
          const userReacted = r.userIds.includes(currentUserId);
          return (
            <button
              key={r.emoji}
              type="button"
              data-testid={`reaction-badge-${r.emoji}`}
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border ${
                userReacted
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => onToggleReaction(r.emoji)}
              title={r.userNames.join(", ")}
            >
              <span>{r.emoji}</span>
              <span className="font-medium">{r.userIds.length}</span>
            </button>
          );
        })}

        {/* Add reaction button */}
        <div className="relative">
          <button
            type="button"
            data-testid="reaction-add-btn"
            className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs border border-dashed border-gray-300 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            onClick={handlePickerToggle}
            aria-label="Add reaction"
          >
            +
          </button>

          {/* Emoji picker popup */}
          {showPicker && (
            <div
              data-testid="emoji-picker"
              className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50 w-48"
            >
              <div className="grid grid-cols-6 gap-1">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    data-testid={`emoji-option-${emoji}`}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-base"
                    onClick={() => handleEmojiSelect(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
