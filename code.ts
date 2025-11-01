function generateNumericValue(length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

function generateAlphabeticValue(
  length: number,
  caseOptions: readonly string[]
): string {
  const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";

  // Determine available characters based on case options
  let characters = "";
  if (caseOptions.indexOf("uppercase") !== -1) {
    characters += uppercaseChars;
  }
  if (caseOptions.indexOf("lowercase") !== -1) {
    characters += lowercaseChars;
  }

  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function generateAlphanumericValue(
  length: number,
  caseOptions: readonly string[]
): string {
  const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
  const numberChars = "0123456789";

  // Determine available characters based on case options
  let characters = numberChars;
  if (caseOptions.indexOf("uppercase") !== -1) {
    characters += uppercaseChars;
  }
  if (caseOptions.indexOf("lowercase") !== -1) {
    characters += lowercaseChars;
  }

  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function isTextLayerSelected(selectedLayers: readonly SceneNode[]): boolean {
  return (
    selectedLayers.length > 0 &&
    selectedLayers.some((layer) => layer.type === "TEXT")
  );
}

figma.showUI(__html__, { width: 300, height: 510 });

figma.ui.onmessage = async (pluginMessage) => {
  const selectedLayers = figma.currentPage.selection;
  const letterCaseOptions = pluginMessage.letterCaseOptions || ["uppercase"];

  if (!isTextLayerSelected(selectedLayers)) {
    figma.ui.postMessage({
      type: "no-text-layer-selected",
      message: "Please select at least one text layer",
    });
    figma.notify("Please select at least one text layer");
    return;
  }

  try {
    // Get all text layers from selection
    const textLayers = selectedLayers.filter(
      (layer): layer is TextNode => layer.type === "TEXT"
    );

    // Load fonts for all selected text layers
    const fontLoadPromises = textLayers.map(async (textNode) => {
      try {
        await figma.loadFontAsync(textNode.fontName as FontName);
      } catch (error) {
        console.error(
          `Failed to load font for layer "${textNode.name}":`,
          error
        );
        figma.notify(
          `Failed to load font for layer "${textNode.name}". Please ensure the font is available.`
        );
        throw error;
      }
    });

    // Wait for all fonts to load before proceeding
    await Promise.all(fontLoadPromises);
    figma.notify("Text layer selected.");

    function generateValue(
      valueType: "numeric" | "alphanumeric" | "patternbased",
      characterLength: number
    ): string {
      const isNumeric = valueType === "numeric";
      const isAlphaNumeric = valueType === "alphanumeric";
      const patternInputValue: string = pluginMessage.patternInputValue;
      const prefixValue: string = pluginMessage.prefixValue || "";
      const suffixValue: string = pluginMessage.suffixValue || "";

      let result = "";
      if (isNumeric) {
        result = generateNumericValue(characterLength);
      } else if (isAlphaNumeric) {
        result = generateAlphanumericValue(characterLength, letterCaseOptions);
      } else {
        result = patternInputValue.split("").reduce((acc, char) => {
          if (char.toLowerCase() === "x") {
            return acc + generateAlphabeticValue(1, letterCaseOptions);
          }
          if (char.toLowerCase() === "#") {
            return acc + generateNumericValue(1);
          }
          return acc + char;
        }, "");
      }
      return prefixValue + result + suffixValue;
    }

    // Replace text only in text layers
    textLayers.forEach((layer) => {
      const generatedValueCharacterLengthInputValue =
        pluginMessage.generatedValueCharacterLengthInputValue
          ? parseInt(pluginMessage.generatedValueCharacterLengthInputValue)
          : 10;

      const randomValue = generateValue(
        pluginMessage.generatedValueTypeInputValue,
        generatedValueCharacterLengthInputValue
      );

      layer.characters = randomValue;

      // Send success message back to UI
      figma.ui.postMessage({
        type: "random-value",
        randomValue: randomValue,
      });
    });
  } catch (error) {
    console.error("Error processing text layers:", error);
    figma.notify("Error: Failed to process text layers. Please try again.");
    figma.ui.postMessage({
      type: "generation-error",
      message: "Failed to process text layers. Please try again.",
    });
  }
};

// Detect selection change in Figma
figma.on("selectionchange", () => {
  const selection = figma.currentPage.selection;
  if (!isTextLayerSelected(selection)) {
    figma.notify("Error: No text layer selected.");
    figma.ui.postMessage({
      type: "no-text-layer-selected",
      message: "Please select at least one text layer",
    });
  } else {
    figma.ui.postMessage({ type: "clear-error" });
  }
});
