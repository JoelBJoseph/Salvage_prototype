export interface TranspileOptions {
    sourceCode: string;
    fileName: string;
}

export interface TranspileResult {
    success: boolean;
    rustCode?: string;
    errors?: string[];
}