import type { Company, Template, LeadershipPrinciple } from '../types';

export const COMPANIES: Company[] = [
    {
        id: 'amazon',
        name: 'Amazon',
        description: 'E-commerce and Cloud Computing Giant',
        cultureDescription: 'Customer Obsession, Ownership, Bias for Action',
    },
    {
        id: 'google',
        name: 'Google',
        description: 'Search Engine and Technology Company',
        cultureDescription: 'Focus on the user, Innovation, "Don\'t be evil"',
    },
    {
        id: 'netflix',
        name: 'Netflix',
        description: 'Streaming Service and Production Company',
        cultureDescription: 'Freedom and Responsibility, Context not Control',
    },
    {
        id: 'facebook',
        name: 'Meta (Facebook)',
        description: 'Social Media and Technology',
        cultureDescription: 'Move Fast, Focus on Impact, Be Bold',
    },
    {
        id: 'apple',
        name: 'Apple',
        description: 'Consumer Electronics and Software',
        cultureDescription: 'Innovation, Design Perfection, Secrecy',
    },
];

const AMAZON_PRINCIPLES: LeadershipPrinciple[] = [
    {
        id: 'amz-1',
        title: 'Customer Obsession',
        description: 'Leaders start with the customer and work backwards. They work vigorously to earn and keep customer trust.',
        suitedFor: ['amazon'],
    },
    {
        id: 'amz-2',
        title: 'Ownership',
        description: 'Leaders are owners. They think long term and don’t sacrifice long-term value for short-term results.',
        suitedFor: ['amazon', 'netflix'],
    },
    {
        id: 'amz-3',
        title: 'Bias for Action',
        description: 'Speed matters in business. Many decisions and actions are reversible and do not need extensive study.',
        suitedFor: ['amazon', 'facebook', 'uber'],
    },
];

const GOOGLE_PRINCIPLES: LeadershipPrinciple[] = [
    {
        id: 'goog-1',
        title: 'Focus on the User',
        description: 'Focus on the user and all else will follow.',
        suitedFor: ['google'],
    },
    {
        id: 'goog-2',
        title: 'Fast is better than slow',
        description: 'We know your time is valuable, so when you’re seeking an answer on the web you want it right away.',
        suitedFor: ['google', 'facebook'],
    },
];

const NETFLIX_PRINCIPLES: LeadershipPrinciple[] = [
    {
        id: 'nflx-1',
        title: 'Context Not Control',
        description: 'Provide the insight and understanding to enable sound decisions, rather than giving orders.',
        suitedFor: ['netflix'],
    },
    {
        id: 'nflx-2',
        title: 'Highly Aligned, Loosely Coupled',
        description: 'Teams spend less time coordinating and more time executing.',
        suitedFor: ['netflix', 'amazon'],
    },
];

export const TEMPLATES: Template[] = [
    {
        id: 'tpl-amazon',
        name: 'Amazon Leadership Principles',
        description: 'Customer Obsession, Ownership, etc.',
        companyId: 'amazon',
        tags: ['Tech', 'E-commerce', 'Cloud'],
        principles: AMAZON_PRINCIPLES,
    },
    {
        id: 'tpl-google',
        name: 'Google Philosophy',
        description: 'Focus on the user and all else will follow.',
        companyId: 'google',
        tags: ['Tech', 'Search', 'Innovation'],
        principles: GOOGLE_PRINCIPLES,
    },
    {
        id: 'tpl-netflix',
        name: 'Netflix Culture',
        description: 'Freedom and Responsibility.',
        companyId: 'netflix',
        tags: ['Tech', 'Streaming', 'Media'],
        principles: NETFLIX_PRINCIPLES,
    },
];
