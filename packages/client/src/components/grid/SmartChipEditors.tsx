import { useState, useCallback } from "react";
import type {
  SmartChip,
  DateChipData,
  DropdownChipData,
  RatingChipData,
  PeopleChipData,
  SmartChipType,
} from "../../types/grid";
import { generateChipId } from "../../stores/smartChipStore";

const DROPDOWN_COLORS = [
  "#34a853",
  "#4285f4",
  "#ea4335",
  "#fbbc04",
  "#ff6d01",
  "#46bdc6",
  "#9334e6",
  "#e8710a",
];

interface ChipEditorProps {
  chipType: SmartChipType;
  position: { x: number; y: number };
  onSave: (chip: SmartChip) => void;
  onCancel: () => void;
}

export function SmartChipEditor({
  chipType,
  position,
  onSave,
  onCancel,
}: ChipEditorProps) {
  switch (chipType) {
    case "date":
      return (
        <DateChipEditor
          position={position}
          onSave={onSave}
          onCancel={onCancel}
        />
      );
    case "dropdown":
      return (
        <DropdownChipEditor
          position={position}
          onSave={onSave}
          onCancel={onCancel}
        />
      );
    case "rating":
      return (
        <RatingChipEditor
          position={position}
          onSave={onSave}
          onCancel={onCancel}
        />
      );
    case "people":
      return (
        <PeopleChipEditor
          position={position}
          onSave={onSave}
          onCancel={onCancel}
        />
      );
  }
}

interface SingleEditorProps {
  position: { x: number; y: number };
  onSave: (chip: SmartChip) => void;
  onCancel: () => void;
}

function DateChipEditor({ position, onSave, onCancel }: SingleEditorProps) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);

  const handleSave = useCallback(() => {
    const chip: DateChipData = {
      id: generateChipId(),
      type: "date",
      date,
    };
    onSave(chip);
  }, [date, onSave]);

  return (
    <div
      data-testid="date-chip-editor"
      style={{
        position: "absolute",
        left: position.x,
        top: position.y + 30,
        zIndex: 60,
        background: "white",
        border: "1px solid #ddd",
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        padding: 16,
        minWidth: 220,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 8,
          color: "#202124",
        }}
      >
        Select Date
      </div>
      <input
        data-testid="date-chip-input"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        style={{
          width: "100%",
          padding: "6px 8px",
          border: "1px solid #ddd",
          borderRadius: 4,
          fontSize: 13,
          boxSizing: "border-box",
        }}
      />
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 12,
          justifyContent: "flex-end",
        }}
      >
        <button
          data-testid="chip-cancel-btn"
          onMouseDown={(e) => {
            e.preventDefault();
            onCancel();
          }}
          style={{
            padding: "4px 12px",
            fontSize: 12,
            border: "1px solid #ddd",
            borderRadius: 4,
            background: "white",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          data-testid="chip-save-btn"
          onMouseDown={(e) => {
            e.preventDefault();
            handleSave();
          }}
          style={{
            padding: "4px 12px",
            fontSize: 12,
            border: "none",
            borderRadius: 4,
            background: "#1a73e8",
            color: "white",
            cursor: "pointer",
          }}
        >
          Insert
        </button>
      </div>
    </div>
  );
}

function DropdownChipEditor({ position, onSave, onCancel }: SingleEditorProps) {
  const [options, setOptions] = useState("Option 1, Option 2, Option 3");
  const [selectedColor, setSelectedColor] = useState(DROPDOWN_COLORS[0]);

  const handleSave = useCallback(() => {
    const optionList = options
      .split(",")
      .map((o) => o.trim())
      .filter((o) => o.length > 0);
    if (optionList.length === 0) return;
    const chip: DropdownChipData = {
      id: generateChipId(),
      type: "dropdown",
      value: optionList[0],
      options: optionList,
      color: selectedColor,
    };
    onSave(chip);
  }, [options, selectedColor, onSave]);

  return (
    <div
      data-testid="dropdown-chip-editor"
      style={{
        position: "absolute",
        left: position.x,
        top: position.y + 30,
        zIndex: 60,
        background: "white",
        border: "1px solid #ddd",
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        padding: 16,
        minWidth: 260,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 8,
          color: "#202124",
        }}
      >
        Dropdown Options
      </div>
      <input
        data-testid="dropdown-chip-options-input"
        type="text"
        value={options}
        onChange={(e) => setOptions(e.target.value)}
        placeholder="Comma-separated options"
        style={{
          width: "100%",
          padding: "6px 8px",
          border: "1px solid #ddd",
          borderRadius: 4,
          fontSize: 13,
          boxSizing: "border-box",
        }}
      />
      <div style={{ marginTop: 8, fontSize: 12, color: "#5f6368" }}>Color:</div>
      <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
        {DROPDOWN_COLORS.map((color) => (
          <div
            key={color}
            data-testid={`dropdown-color-${color}`}
            onMouseDown={(e) => {
              e.preventDefault();
              setSelectedColor(color);
            }}
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: color,
              cursor: "pointer",
              border:
                selectedColor === color
                  ? "2px solid #202124"
                  : "2px solid transparent",
            }}
          />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 12,
          justifyContent: "flex-end",
        }}
      >
        <button
          data-testid="chip-cancel-btn"
          onMouseDown={(e) => {
            e.preventDefault();
            onCancel();
          }}
          style={{
            padding: "4px 12px",
            fontSize: 12,
            border: "1px solid #ddd",
            borderRadius: 4,
            background: "white",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          data-testid="chip-save-btn"
          onMouseDown={(e) => {
            e.preventDefault();
            handleSave();
          }}
          style={{
            padding: "4px 12px",
            fontSize: 12,
            border: "none",
            borderRadius: 4,
            background: "#1a73e8",
            color: "white",
            cursor: "pointer",
          }}
        >
          Insert
        </button>
      </div>
    </div>
  );
}

function RatingChipEditor({ position, onSave, onCancel }: SingleEditorProps) {
  const [rating, setRating] = useState(3);

  const handleSave = useCallback(() => {
    const chip: RatingChipData = {
      id: generateChipId(),
      type: "rating",
      value: rating,
    };
    onSave(chip);
  }, [rating, onSave]);

  return (
    <div
      data-testid="rating-chip-editor"
      style={{
        position: "absolute",
        left: position.x,
        top: position.y + 30,
        zIndex: 60,
        background: "white",
        border: "1px solid #ddd",
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        padding: 16,
        minWidth: 200,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 8,
          color: "#202124",
        }}
      >
        Select Rating
      </div>
      <div style={{ display: "flex", gap: 4, fontSize: 24 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            data-testid={`rating-star-${star}`}
            onMouseDown={(e) => {
              e.preventDefault();
              setRating(star);
            }}
            style={{
              cursor: "pointer",
              color: star <= rating ? "#fbbc04" : "#dadce0",
            }}
          >
            {"\u2605"}
          </span>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 12,
          justifyContent: "flex-end",
        }}
      >
        <button
          data-testid="chip-cancel-btn"
          onMouseDown={(e) => {
            e.preventDefault();
            onCancel();
          }}
          style={{
            padding: "4px 12px",
            fontSize: 12,
            border: "1px solid #ddd",
            borderRadius: 4,
            background: "white",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          data-testid="chip-save-btn"
          onMouseDown={(e) => {
            e.preventDefault();
            handleSave();
          }}
          style={{
            padding: "4px 12px",
            fontSize: 12,
            border: "none",
            borderRadius: 4,
            background: "#1a73e8",
            color: "white",
            cursor: "pointer",
          }}
        >
          Insert
        </button>
      </div>
    </div>
  );
}

function PeopleChipEditor({ position, onSave, onCancel }: SingleEditorProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSave = useCallback(() => {
    if (!name.trim()) return;
    const chip: PeopleChipData = {
      id: generateChipId(),
      type: "people",
      name: name.trim(),
      email: email.trim() || undefined,
    };
    onSave(chip);
  }, [name, email, onSave]);

  return (
    <div
      data-testid="people-chip-editor"
      style={{
        position: "absolute",
        left: position.x,
        top: position.y + 30,
        zIndex: 60,
        background: "white",
        border: "1px solid #ddd",
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        padding: 16,
        minWidth: 240,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 8,
          color: "#202124",
        }}
      >
        Add Person
      </div>
      <input
        data-testid="people-chip-name-input"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        style={{
          width: "100%",
          padding: "6px 8px",
          border: "1px solid #ddd",
          borderRadius: 4,
          fontSize: 13,
          marginBottom: 8,
          boxSizing: "border-box",
        }}
      />
      <input
        data-testid="people-chip-email-input"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email (optional)"
        style={{
          width: "100%",
          padding: "6px 8px",
          border: "1px solid #ddd",
          borderRadius: 4,
          fontSize: 13,
          boxSizing: "border-box",
        }}
      />
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 12,
          justifyContent: "flex-end",
        }}
      >
        <button
          data-testid="chip-cancel-btn"
          onMouseDown={(e) => {
            e.preventDefault();
            onCancel();
          }}
          style={{
            padding: "4px 12px",
            fontSize: 12,
            border: "1px solid #ddd",
            borderRadius: 4,
            background: "white",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          data-testid="chip-save-btn"
          onMouseDown={(e) => {
            e.preventDefault();
            handleSave();
          }}
          style={{
            padding: "4px 12px",
            fontSize: 12,
            border: "none",
            borderRadius: 4,
            background: "#1a73e8",
            color: "white",
            cursor: "pointer",
          }}
        >
          Insert
        </button>
      </div>
    </div>
  );
}
