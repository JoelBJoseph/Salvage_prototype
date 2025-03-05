import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { token } = req.body;

        try {
            // Decode the Google token
            const decoded = JSON.parse(atob(token.split('.')[1]));
            const { email, name, picture } = decoded;

            // Check if the user exists in the database
            let user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                // Create a new user if they don't exist
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