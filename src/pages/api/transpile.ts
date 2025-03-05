import { NextApiRequest, NextApiResponse } from 'next';
import { geminiApi } from '@/services/gemini-api-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { sourceCode, fileName } = req.body;

        try {
            const result = await geminiApi.transpile({ sourceCode, fileName });
            res.status(200).json(result);
        } catch (error) {
            console.error('Error during transpilation:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
}