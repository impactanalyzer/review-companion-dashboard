export type CompanyType = 'amazon' | 'google' | 'netflix' | 'facebook' | 'uber' | 'airbnb' | 'apple' | 'generic';

export interface Company {
  id: CompanyType;
  name: string;
  description: string;
  cultureDescription: string;
}

export interface LeadershipPrinciple {
  id: string;
  title: string;
  description: string;
  suitedFor: CompanyType[]; // Which companies this principle aligns with
}

export interface Template {
  id: string;
  name: string;
  description: string;
  companyId: CompanyType;
  tags: string[]; // New field
  principles: LeadershipPrinciple[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user'; // 'admin' is the one setting up, 'user' is a reviewer
  customer?: {
    id: string;
    name: string;
  };
  // Legacy fields below, verify usage
  orgId?: string;
  orgName?: string;
  selectedTemplateId?: string;
  customizedPrinciples: LeadershipPrinciple[]; // User can edit these after selection
}

export interface Review {
  id: string;
  targetUserId: string;
  reviewerName: string;
  ratings: Record<string, { // Keyed by principle ID
    score: number; // 1-5
    comment: string;
  }>;
  submittedAt: string;
}
