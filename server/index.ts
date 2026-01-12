import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const PORT = 3001;

// Admin Signup
app.post('/api/admin/signup', async (req, res) => {
    const { name, email, orgName } = req.body;
    try {
        const org = await prisma.organization.create({
            data: {
                name: orgName,
                users: {
                    create: {
                        name,
                        email,
                        role: 'ADMIN',
                    },
                },
            },
            include: {
                users: true,
            },
        });
        res.json({ user: org.users[0], org });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create admin/org' });
    }
});

// Get Templates
app.get('/api/templates', async (req, res) => {
    try {
        const templates = await prisma.template.findMany({
            include: { principles: true },
        });
        res.json(templates);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

// Save Org Principles
app.post('/api/org/principles', async (req, res) => {
    const { orgId, principleIds } = req.body;
    try {
        // Clear existing
        await prisma.orgPrinciple.deleteMany({ where: { orgId } });

        // Add new
        const operations = principleIds.map((id: string) =>
            prisma.orgPrinciple.create({
                data: {
                    orgId,
                    principleId: id,
                },
            })
        );
        await prisma.$transaction(operations);

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save principles' });
    }
});

// Reviewer Login
app.post('/api/reviewer/login', async (req, res) => {
    const { orgName } = req.body;
    try {
        const org = await prisma.organization.findUnique({
            where: { name: orgName },
        });
        if (!org) {
            return res.status(404).json({ error: 'Organization not found' });
        }
        res.json({ org });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get Org Principles for Review
app.get('/api/org/:id/principles', async (req, res) => {
    const { id } = req.params;
    try {
        const orgPrinciples = await prisma.orgPrinciple.findMany({
            where: { orgId: id },
            include: { principle: true },
        });
        res.json(orgPrinciples.map(op => op.principle));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch principles' });
    }
});

// Seed Mock Data (Simple endpoint for demo)
app.post('/api/seed', async (req, res) => {
    try {
        // Check if templates exist
        const count = await prisma.template.count();
        if (count > 0) return res.json({ message: 'Already seeded' });

        // Seed from mock data (hardcoded here for simplicity or imported)
        // For now, let's just create a few
        const amazon = await prisma.template.create({
            data: {
                name: 'Amazon Leadership Principles',
                description: 'Customer Obsession, Ownership, etc.',
                companyId: 'amazon',
                principles: {
                    create: [
                        { title: 'Customer Obsession', description: 'Leaders start with the customer and work backwards.' },
                        { title: 'Ownership', description: 'Leaders are owners.' },
                    ],
                },
            },
        });

        const google = await prisma.template.create({
            data: {
                name: 'Googleyness',
                description: 'Focus on the user and all else will follow.',
                companyId: 'google',
                principles: {
                    create: [
                        { title: 'Focus on the user', description: 'Focus on the user and all else will follow.' },
                        { title: 'Fast is better than slow', description: 'Google believes in speed.' },
                    ],
                },
            },
        });

        res.json({ message: 'Seeded', templates: [amazon, google] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Seeding failed' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
