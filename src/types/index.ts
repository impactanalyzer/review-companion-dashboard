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
  role: 'admin' | 'user' | 'manager' | 'MANAGER' | 'ADMIN' | 'EMPLOYEE'; // 'admin' is the one setting up, 'user' is a reviewer, manager manages team
  customer?: {
    id: string;
    name: string;
  };
  // Legacy fields below, verify usage
  orgId?: string;
  orgName?: string;
  managerId?: string; // Links to manager
  selectedTemplateId?: string;
  customizedPrinciples: LeadershipPrinciple[]; // User can edit these after selection
}

export interface CollaborationSummary {
  prsOfYoursTheyReviewed: number;
  prsOfTheirsYouReviewed: number;
  reviewDiscussions: number;
}

export interface ArtifactReference {
  type: string;
  url: string;
  title: string;
  whyShort: string;
}

export interface ReviewerRecommendation {
  reviewer: { id: string; name: string };
  reason: string;
  narrative: string;
  domains: string[];
  lastCollaboratedAt: string;
  collaborationSummary: CollaborationSummary;
  artifactReferences: ArtifactReference[];
}

export interface ReviewContextTheme {
  name: string;
  guidance: string;
  artifactIds: string[];
}

export interface ReviewContextArtifact {
  id: string;
  type: string;
  url: string;
  title: string;
  domain: string;
  direction: string;
  mergedAt: string;
  summary: string;
  whyShort: string;
}

export interface ReviewContext {
  target: { id: string; name: string };
  recommendationNarrative: string;
  collaborationSummary: CollaborationSummary;
  themes: ReviewContextTheme[];
  artifactReferences: ReviewContextArtifact[];
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
