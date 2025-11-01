figma.showUI(__html__, { width: 450, height: 450 }); 

// Function to check if the selected layer is a text layer
function isTextLayerSelected(selectedLayers: readonly SceneNode[]): boolean {
    return selectedLayers.length > 0 && selectedLayers.some(layer => layer.type === 'TEXT');
}

// Listen for messages from the UI
figma.ui.onmessage = (msg) => {
    if (msg.type === 'generate-random') {
        const selectedLayers = figma.currentPage.selection;
        
        // Check if text layer is selected
        if (!isTextLayerSelected(selectedLayers)) {
            // Send error message if no text layer is selected
            figma.ui.postMessage({
                type: 'generation-error',
                message: 'Please select at least one text layer'
            });
            return;
        }

        let randomValue: string;
        const length = msg.length ? parseInt(msg.length) : 10;
        
        if (msg.valueType === 'numeric') {
            randomValue = generateNumericValue(length);
        } else {
            randomValue = generateAlphanumericValue(length);
        }
        
        // Replace text only in text layers
        selectedLayers.forEach((layer) => {
            if (layer.type === 'TEXT') {
                (layer as TextNode).characters = randomValue;
            }
        });

        // Send success message back to UI
        figma.ui.postMessage({
            type: 'random-value',
            randomValue: randomValue
        });
    }
};

// Random value generation functions
function generateNumericValue(length: number): string {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += Math.floor(Math.random() * 10).toString();
    }
    return result;
}

function generateAlphanumericValue(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}