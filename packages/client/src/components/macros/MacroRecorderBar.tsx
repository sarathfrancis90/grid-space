/**
 * MacroRecorderBar — thin red bar at the top when macro recording is active.
 * Shows pulsing red dot, macro name, action count, and stop button.
 */
import { useMacroStore } from "../../stores/macroStore";

export function MacroRecorderBar() {
  const isRecording = useMacroStore((s) => s.isRecording);
  const recordingName = useMacroStore((s) => s.recordingName);
  const actionCount = useMacroStore((s) => s.recordedActions.length);
  const stopRecording = useMacroStore((s) => s.stopRecording);

  if (!isRecording) return null;

  return (
    <div
      className="flex items-center gap-3 bg-red-700 px-4 py-1.5 text-white text-sm"
      style={{ padding: "6px 16px", gap: "12px" }}
      data-testid="macro-recorder-bar"
    >
      {/* Pulsing red dot */}
      <span
        className="inline-block h-3 w-3 rounded-full bg-red-300"
        style={{
          width: "12px",
          height: "12px",
          animation: "macro-pulse 1.2s ease-in-out infinite",
        }}
        data-testid="macro-recording-indicator"
      />

      <span className="font-medium" data-testid="macro-recording-name">
        Recording macro: {recordingName}
      </span>

      <span className="text-red-200 text-xs" data-testid="macro-action-count">
        {actionCount} action{actionCount !== 1 ? "s" : ""}
      </span>

      <button
        onClick={stopRecording}
        className="ml-auto rounded bg-white/20 px-3 py-0.5 text-sm font-medium text-white hover:bg-white/30 transition-colors"
        style={{ padding: "2px 12px" }}
        data-testid="macro-stop-recording"
        type="button"
      >
        Stop
      </button>

      <style>{`
        @keyframes macro-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
