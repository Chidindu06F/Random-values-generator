// =============================================================================
// Random Values Generator — plugin sandbox (main thread)
//
// Responsibilities:
//   1. Generate random values (numeric / alphanumeric / pattern-based) and
//      apply one freshly generated value to each selected text layer.
//   2. Apply pre-formatted random dates (generated in the UI) to selected
//      text layers.
//   3. Keep the UI informed of the current text-layer selection.
//
// Value-generation logic is preserved from the original implementation so the
// existing workflow behaves exactly as before; the UI is purely a redesign.
// =============================================================================

type ValueType = "numeric" | "alphanumeric" | "patternbased";

interface GenerateValuesPayload {
  valueType: ValueType;
  characterLength: number;
  pattern: string;
  prefix: string;
  suffix: string;
  caseOptions: string[];
}

// -----------------------------------------------------------------------------
// Value generators (unchanged behaviour)
// -----------------------------------------------------------------------------

function generateNumericValue(length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

function buildCharacterPool(
  caseOptions: readonly string[],
  includeNumbers: boolean
): string {
  const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";

  let characters = includeNumbers ? "0123456789" : "";
  if (caseOptions.indexOf("uppercase") !== -1) {
    characters += uppercaseChars;
  }
  if (caseOptions.indexOf("lowercase") !== -1) {
    characters += lowercaseChars;
  }
  // Fall back to uppercase so we never read from an empty pool.
  return characters || uppercaseChars;
}

function generateFromPool(length: number, pool: string): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += pool.charAt(Math.floor(Math.random() * pool.length));
  }
  return result;
}

function generateAlphabeticValue(
  length: number,
  caseOptions: readonly string[]
): string {
  return generateFromPool(length, buildCharacterPool(caseOptions, false));
}

function generateAlphanumericValue(
  length: number,
  caseOptions: readonly string[]
): string {
  return generateFromPool(length, buildCharacterPool(caseOptions, true));
}

function buildValue(payload: GenerateValuesPayload): string {
  const caseOptions =
    payload.caseOptions && payload.caseOptions.length > 0
      ? payload.caseOptions
      : ["uppercase"];
  const length =
    Number.isFinite(payload.characterLength) && payload.characterLength > 0
      ? Math.floor(payload.characterLength)
      : 10;

  let result = "";
  if (payload.valueType === "numeric") {
    result = generateNumericValue(length);
  } else if (payload.valueType === "alphanumeric") {
    result = generateAlphanumericValue(length, caseOptions);
  } else {
    result = (payload.pattern || "").split("").reduce((acc, char) => {
      if (char.toLowerCase() === "x") {
        return acc + generateAlphabeticValue(1, caseOptions);
      }
      if (char === "#") {
        return acc + generateNumericValue(1);
      }
      return acc + char;
    }, "");
  }

  return (payload.prefix || "") + result + (payload.suffix || "");
}

// -----------------------------------------------------------------------------
// Selection helpers
// -----------------------------------------------------------------------------

function getSelectedTextLayers(): TextNode[] {
  return figma.currentPage.selection.filter(
    (layer): layer is TextNode => layer.type === "TEXT"
  );
}

async function loadFontsFor(textLayers: readonly TextNode[]): Promise<void> {
  await Promise.all(
    textLayers.map(async (textNode) => {
      try {
        await figma.loadFontAsync(textNode.fontName as FontName);
      } catch (error) {
        console.error(`Failed to load font for layer "${textNode.name}":`, error);
        figma.notify(
          `Failed to load font for layer "${textNode.name}". Please ensure the font is available.`
        );
        throw error;
      }
    })
  );
}

function postSelectionState(): void {
  figma.ui.postMessage({
    type: "selection-state",
    count: getSelectedTextLayers().length,
  });
}

function pluralize(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

// -----------------------------------------------------------------------------
// UI wiring
// -----------------------------------------------------------------------------

figma.showUI(__html__, { width: 360, height: 560, themeColors: false });

interface GenerateValuesMessage {
  type: "generate-values";
  payload: GenerateValuesPayload;
}

interface ApplyDatesMessage {
  type: "apply-dates";
  values: string[];
}

interface RequestSelectionMessage {
  type: "request-selection-state";
}

interface ResizeMessage {
  type: "resize";
  width: number;
  height: number;
}

type IncomingMessage =
  | GenerateValuesMessage
  | ApplyDatesMessage
  | RequestSelectionMessage
  | ResizeMessage;

figma.ui.onmessage = async (message: IncomingMessage) => {
  if (message.type === "request-selection-state") {
    postSelectionState();
    return;
  }

  if (message.type === "resize") {
    const width = Math.max(320, Math.min(720, Math.round(message.width)));
    const height = Math.max(480, Math.min(900, Math.round(message.height)));
    figma.ui.resize(width, height);
    return;
  }

  if (message.type === "generate-values") {
    const textLayers = getSelectedTextLayers();

    if (textLayers.length === 0) {
      figma.notify("Select at least one text layer to generate values.");
      figma.ui.postMessage({ type: "no-text-layers" });
      return;
    }

    try {
      // One freshly generated value per selected text layer.
      await loadFontsFor(textLayers);
      textLayers.forEach((layer) => {
        layer.characters = buildValue(message.payload);
      });
      figma.notify(`Generated values for ${pluralize(textLayers.length, "layer")}.`);
    } catch (error) {
      console.error("Error processing text layers:", error);
      figma.notify("Error: Failed to process text layers. Please try again.");
      figma.ui.postMessage({
        type: "generation-error",
        message: "Failed to process text layers. Please try again.",
      });
    }
    return;
  }

  if (message.type === "apply-dates") {
    const dates = Array.isArray(message.values) ? message.values : [];
    const textLayers = getSelectedTextLayers();

    if (dates.length === 0) {
      return;
    }

    if (textLayers.length === 0) {
      figma.notify("Select at least one text layer to generate dates.");
      figma.ui.postMessage({ type: "no-text-layers" });
      return;
    }

    try {
      // One generated date per selected text layer (cycling defensively in
      // case the selection changed between generation and apply).
      await loadFontsFor(textLayers);
      textLayers.forEach((layer, index) => {
        layer.characters = dates[index % dates.length];
      });
      figma.notify(`Applied dates to ${pluralize(textLayers.length, "layer")}.`);
    } catch (error) {
      console.error("Error applying dates to text layers:", error);
      figma.notify("Error: Failed to apply dates. Please try again.");
      figma.ui.postMessage({
        type: "generation-error",
        message: "Failed to apply dates. Please try again.",
      });
    }
    return;
  }
};

// Keep the UI's selection hint in sync without spamming notifications.
figma.on("selectionchange", postSelectionState);
postSelectionState();
