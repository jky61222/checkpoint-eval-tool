import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers';

// Configure Transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

// Store the loaded model so we only incur the download cost once per session
let classifier = null;

export async function analyzeTextSentiment(text, onStatusChange = null) {
    if (!text) {
        return null;
    }

    try {
        // Load the model if it hasn't been loaded yet
        if (!classifier) {
            if (onStatusChange) {
                onStatusChange("Loading Sentiment AI model (~60MB download)...");
            }
            // Using the specific, fast model requested by the user
            classifier = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
        }

        if (onStatusChange) {
            onStatusChange("Analyzing CV Tone/Sentiment...");
        }
        
        // Run the model
        const result = await classifier(text);

        // Format the result
        const label = result[0].label;
        const score = (result[0].score * 100).toFixed(1);

        return {
            label: label,
            score: score
        };

    } catch (error) {
        console.error("Transformers.js Error:", error);
        return null;
    }
}
