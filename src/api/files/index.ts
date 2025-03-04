import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { userId } = req.query;

    if (req.method === 'GET') {
        try {
            const files = await prisma.file.findMany({
                where: { userId: Number(userId) },
            });
            res.status(200).json(files);
        } catch (error) {
            console.error('Error fetching files:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } else if (req.method === 'POST') {
        const { name, content, type, userId } = req.body;

        try {
            const file = await prisma.file.create({
                data: { name, content, type, userId: Number(userId) },
            });
            res.status(201).json(file);
        } catch (error) {
            console.error('Error creating file:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } else if (req.method === 'DELETE') {
        const { id } = req.body;

        try {
            await prisma.file.delete({ where: { id: Number(id) } });
            res.status(200).json({ message: 'File deleted' });
        } catch (error) {
            console.error('Error deleting file:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
}