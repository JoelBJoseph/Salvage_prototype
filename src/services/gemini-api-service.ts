import { TranspileOptions, TranspileResult } from '../types/transpile';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

class GeminiApiService {
    private apiKey: string;

    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY || '';
    }

    async transpile({ sourceCode, fileName }: TranspileOptions): Promise<TranspileResult> {
        try {
            const prompt = `
        Transpile the following C code to Rust:
        File name: ${fileName}
        
        ${sourceCode}
        
        Please provide only the transpiled Rust code without any explanations or comments.
      `;

            const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.2,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }

            const data = await response.json();
            const rustCode = data.candidates[0].content.parts[0].text;

            return {
                success: true,
                rustCode,
            };
        } catch (error) {
            return {
                success: false,
                errors: [(error as Error).message],
            };
        }
    }
}

export const geminiApi = new GeminiApiService();