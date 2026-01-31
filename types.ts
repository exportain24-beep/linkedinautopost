
export enum SocialPlatform {
  ALL = 'All Platforms',
  X = 'Twitter / X',
  TIKTOK = 'TikTok',
  REDDIT = 'Reddit',
  INSTAGRAM = 'Instagram',
  YOUTUBE = 'YouTube',
  LINKEDIN = 'LinkedIn'
}

export enum ContentPillar {
  MARKET_INSIGHT = 'Market Insight & Trends',
  QUALITY_ASSURANCE = 'Quality & Grading Standards',
  LOGISTICS_MASTERY = 'Supply Chain & Logistics',
  FARMER_IMPACT = 'Social Impact & Farmer Stories',
  BUYER_ROI = 'Profitability & Buyer ROI',
  INNOVATION = 'Agricultural Tech & Innovation'
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface TrendData {
  platform: SocialPlatform;
  title: string;
  summary: string;
  reason: string;
  tags: string[];
  sources: GroundingSource[];
  timestamp: string;
}

export interface GeneratedArticle {
  title: string;
  metaDescription: string;
  content: string;
  faq: { question: string; answer: string }[];
  keywords: string[];
  imageUrl?: string;
  type: 'longform' | 'linkedin_short';
  timestamp: string;
  pillar?: ContentPillar;
}

export type AppMode = 'explorer' | 'writer' | 'automation';

export interface AppState {
  trends: TrendData[];
  loading: boolean;
  step: string;
  error: string | null;
  selectedPlatform: SocialPlatform;
  searchQuery: string;
  mode: AppMode;
  article: GeneratedArticle | null;
  isAutomationEnabled: boolean;
  linkedinConnected: boolean;
  logs: string[];
}
