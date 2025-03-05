import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { email, name, picture } = req.body;

        try {
            let user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                user = await prisma.user.create({
                    data: { email, name, picture },
                });
            }

            res.status(200).json(user);
        } catch (error) {
            console.error('Error during login:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
}