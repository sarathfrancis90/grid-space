/**
 * Flash Fill — pattern detection and auto-fill.
 *
 * Given examples of input→output transformations, detects patterns
 * like substring extraction, concatenation, case changes, and
 * number extraction, then applies them to remaining rows.
 */

/** A detected transformation pattern */
interface Pattern {
  type:
    | "substring"
    | "concat"
    | "uppercase"
    | "lowercase"
    | "capitalize"
    | "extract-numbers"
    | "extract-before"
    | "extract-after"
    | "constant";
  params: Record<string, number | string>;
}

/** Try to detect a pattern from input/output pairs */
export function detectPattern(
  examples: Array<{ input: string; output: string }>,
): Pattern | null {
  if (examples.length === 0) return null;

  // Check for constant output
  const allSameOutput = examples.every((e) => e.output === examples[0].output);
  if (allSameOutput) {
    return { type: "constant", params: { value: examples[0].output } };
  }

  // Check uppercase
  if (examples.every((e) => e.output === e.input.toUpperCase())) {
    return { type: "uppercase", params: {} };
  }

  // Check lowercase
  if (examples.every((e) => e.output === e.input.toLowerCase())) {
    return { type: "lowercase", params: {} };
  }

  // Check capitalize (first letter of each word)
  if (
    examples.every(
      (e) => e.output === e.input.replace(/\b\w/g, (c) => c.toUpperCase()),
    )
  ) {
    return { type: "capitalize", params: {} };
  }

  // Check number extraction
  if (
    examples.every((e) => {
      const nums = e.input.match(/\d+/g);
      return nums !== null && e.output === nums.join("");
    })
  ) {
    return { type: "extract-numbers", params: {} };
  }

  // Check substring extraction by position
  const firstEx = examples[0];
  const startIdx = firstEx.input.indexOf(firstEx.output);
  if (
    startIdx >= 0 &&
    examples.every((e) => {
      const len = firstEx.output.length;
      return e.input.substring(startIdx, startIdx + len) === e.output;
    })
  ) {
    return {
      type: "substring",
      params: { start: startIdx, length: firstEx.output.length },
    };
  }

  // Check extract-before delimiter
  const delimiters = [" ", ",", "-", "_", ".", "/", "@", ":", ";"];
  for (const delim of delimiters) {
    if (
      examples.every((e) => {
        const idx = e.input.indexOf(delim);
        return idx >= 0 && e.output === e.input.substring(0, idx);
      })
    ) {
      return { type: "extract-before", params: { delimiter: delim } };
    }
  }

  // Check extract-after delimiter
  for (const delim of delimiters) {
    if (
      examples.every((e) => {
        const idx = e.input.indexOf(delim);
        return (
          idx >= 0 && e.output === e.input.substring(idx + delim.length).trim()
        );
      })
    ) {
      return { type: "extract-after", params: { delimiter: delim } };
    }
  }

  // Check concatenation pattern with multiple input columns
  // (handled at a higher level if needed)

  return null;
}

/** Apply a pattern to an input value */
export function applyPattern(pattern: Pattern, input: string): string {
  switch (pattern.type) {
    case "constant":
      return String(pattern.params.value);
    case "uppercase":
      return input.toUpperCase();
    case "lowercase":
      return input.toLowerCase();
    case "capitalize":
      return input.replace(/\b\w/g, (c) => c.toUpperCase());
    case "extract-numbers": {
      const nums = input.match(/\d+/g);
      return nums ? nums.join("") : "";
    }
    case "substring": {
      const start = pattern.params.start as number;
      const len = pattern.params.length as number;
      return input.substring(start, start + len);
    }
    case "extract-before": {
      const delim = pattern.params.delimiter as string;
      const idx = input.indexOf(delim);
      return idx >= 0 ? input.substring(0, idx) : input;
    }
    case "extract-after": {
      const delim = pattern.params.delimiter as string;
      const idx = input.indexOf(delim);
      return idx >= 0 ? input.substring(idx + delim.length).trim() : input;
    }
    default:
      return input;
  }
}

/**
 * Run flash fill: given a column of input values and partial output values,
 * detect the pattern from existing examples and fill the remaining cells.
 *
 * @param inputs - array of input cell values (the source column)
 * @param outputs - array of output cell values (the target column, some may be empty)
 * @returns array of suggested values for ALL rows (including existing ones), or null if no pattern detected
 */
export function runFlashFill(
  inputs: string[],
  outputs: string[],
): string[] | null {
  // Collect examples where both input and output exist
  const examples: Array<{ input: string; output: string; index: number }> = [];
  for (let i = 0; i < inputs.length && i < outputs.length; i++) {
    if (outputs[i] && outputs[i].trim() !== "") {
      examples.push({ input: inputs[i], output: outputs[i], index: i });
    }
  }

  if (examples.length < 1) return null;

  const pattern = detectPattern(examples);
  if (!pattern) return null;

  // Verify the pattern matches all examples
  for (const ex of examples) {
    if (applyPattern(pattern, ex.input) !== ex.output) {
      return null; // Pattern doesn't match all examples
    }
  }

  // Apply pattern to all rows
  return inputs.map((input) => applyPattern(pattern, input));
}
