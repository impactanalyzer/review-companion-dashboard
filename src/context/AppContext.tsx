import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, Review, Template } from '../types';
import { API_BASE_URL } from '../config';


interface AppState {
    user: UserProfile | null;
    reviews: Review[];
    templates: Template[];
    login: (name: string, email: string, orgName: string, password?: string) => Promise<void>; // Corrected return type
    loginReviewer: (email: string, orgName: string) => void;
    logout: () => void;
    updateProfile: (profile: Partial<UserProfile>) => void;
    addReview: (review: Review) => void;
    setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const AppContext = createContext<AppState | undefined>(undefined);

const STORAGE_KEY_USER = 'review_companion_user';
const STORAGE_KEY_REVIEWS = 'review_companion_reviews';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);

    // Load from local storage on mount
    // Load from local storage on mount and fetch templates
    // Load from local storage on mount and fetch templates
    useEffect(() => {
        const storedUser = localStorage.getItem(STORAGE_KEY_USER);
        const storedReviews = localStorage.getItem(STORAGE_KEY_REVIEWS);

        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        if (storedReviews) {
            setReviews(JSON.parse(storedReviews));
        }

        // Fetch STANDARD templates
        fetch(`${API_BASE_URL}/api/templates/standard`)
            .then(res => res.json())
            .then(data => setTemplates(data))
            .catch(err => console.error('Failed to fetch templates', err));
    }, []);

    // ... save effect ...

    const login = async (name: string, email: string, orgName: string, password?: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/signup-org`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orgName,
                    adminName: name,
                    email,
                    password: password || 'defaultPassword123' // Fallback for prototype if UI doesn't allow input
                }),
            });
            const result = await response.json();

            if (result.success && result.data.user) {
                const userData = result.data.user;
                const userProfile: UserProfile = {
                    id: userData.id,
                    name: name,
                    email: userData.email,
                    role: 'admin',
                    customizedPrinciples: [],
                    orgId: userData.customer.id,
                    orgName: userData.customer.name
                };
                setUser(userProfile);
                localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userProfile));
            } else {
                console.error('Signup failed', result);
                throw new Error(result.error || 'Signup failed. Please try again.');
            }
        } catch (error: any) {
            console.error('Login failed', error);
            throw new Error(error.message || 'Failed to connect to server.');
        }
    };



    // Changing loginReviewer signature to match CheckAccess needs
    const loginReviewer = async (email: string, orgName: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/check-access`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, orgId: orgName }), // Using orgName as identifier for now
            });
            const data = await response.json();

            if (data.exists) {
                // For prototype, we just "log them in" or redirect to password set.
                // In real app, we show "Check your email".
                // Here we might simulate login or store partial state.
                console.log(`User found! Status: ${data.status}. Next Step: ${data.nextStep}`);

                // MOCK login for demo
                const userProfile: UserProfile = {
                    id: 'temp-reviewer-id',
                    name: email.split('@')[0],
                    email: email,
                    role: 'user',
                    customizedPrinciples: [],
                    orgName: orgName
                };
                setUser(userProfile);
                localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userProfile));
            } else {
                console.warn('User not found in Organization');
                throw new Error('User not found in Organization');
            }
        } catch (error) {
            console.error('Check access failed', error);
            throw error; // Propagate error so component can handle it if needed
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY_USER);
    };

    const updateProfile = (updates: Partial<UserProfile>) => {
        setUser((prev) => (prev ? { ...prev, ...updates } : null));
    };

    const addReview = (review: Review) => {
        setReviews((prev) => [...prev, review]);
    };

    return (
        <AppContext.Provider
            value={{
                user,
                setUser, // Exposing for Login Page
                reviews,
                templates,
                login,
                loginReviewer, // Mapping checkAccess to loginReviewer for now, updating signature in Interface next
                logout,
                updateProfile,
                addReview,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
