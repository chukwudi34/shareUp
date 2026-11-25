export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: "PARTICIPANT" | "CREATOR" | "OPS" | "FINANCE" | "ADMIN";
  status: string;
  kycStatus: string;
  avatarUrl: string | null;
  walletBalance: number;
  initials: string;
  isStaff: boolean;
  permissions: string[];
  createdAt: string | null;
  participationCount?: number;
}

export interface Opportunity {
  id: number;
  slug: string;
  title: string;
  summary: string;
  description?: string;
  coverImage: string;
  category: string;
  model: "COLLECTIVE_PURCHASE" | "MANAGED_ASSET";
  status: string;
  participationMethod: "AMOUNT" | "UNITS";
  targetAmount: number;
  committedAmount: number;
  percentFunded: number;
  minContribution: number;
  maxContribution: number | null;
  minUnits: number | null;
  unitPrice: number | null;
  totalUnits: number | null;
  unitsCommitted: number;
  percentUnits: number;
  unitsPerPackage: number | null;
  packageLabel: string | null;
  quantityLabel: string | null;
  targetQuantity: number | null;
  participantCount: number;
  maxParticipants: number | null;
  fundingDeadline: string | null;
  estimatedDeliveryDate: string | null;
  expectedAcquisitionDate?: string | null;
  location: string;
  supplierName: string;
  supplierVerified: boolean;
  allowsPartialFunding: boolean;
  allowCancellation: boolean;
  feeBps: number;
  publishedAt: string | null;
  fundedAt: string | null;
  remainingAmount: number;
  creatorName: string | null;
  riskNotes?: string;
  acquisitionConditions?: string;
  legalStructure?: string | null;
  ownershipType?: string | null;
  regulatoryStatus?: string;
  policyVersion?: number;
  policyTerms?: Record<string, unknown> | null;
  creatorSource?: string;
  supplierContact?: string | null;
  createdAt?: string | null;
  documents?: Array<{
    id: number;
    title: string;
    kind: string;
    verified: boolean;
    fileUrl?: string;
    uploadedAt?: string | null;
  }>;
  evidence?: Array<{ id: number; title: string; vendor: string; reference: string; amount: number; verified: boolean }>;
  assetId?: number | null;
  viewerParticipation?: Participation | null;
  related?: Opportunity[];
}

export interface Participation {
  id: number;
  reference: string;
  amount: number;
  units: number;
  quantity: number;
  status: string;
  entitlementUnits: number;
  refundedAmount: number;
  confirmedAt: string | null;
  createdAt: string | null;
  opportunity: Opportunity | null;
  checkoutUrl?: string | null;
}

export interface Transaction {
  id: number;
  reference: string;
  type: string;
  amount: number;
  status: string;
  provider: string;
  providerRef: string | null;
  opportunityTitle: string | null;
  metadata: Record<string, unknown> | null;
  failureReason: string | null;
  createdAt: string | null;
  completedAt: string | null;
}

export interface Ownership {
  units: number;
  costBasis: number;
  sharePercent: number;
  ownershipType: string;
}

export interface Asset {
  id: number;
  reference: string;
  name: string;
  category: string;
  description: string;
  coverImage: string;
  acquisitionPrice: number;
  currentValuation: number;
  valuationSource: string | null;
  valuationAt: string | null;
  acquisitionDate: string | null;
  location: string;
  legalStructure: string;
  custodian: string;
  status: string;
  totalUnits: number;
  ownership: Ownership | null;
  incomes: Array<{ id: number; source: string; category: string; amount: number; receivedAt: string | null }>;
  reports: Array<{ id: number; title: string; kind: string; body: string; publishedAt: string | null }>;
  ownerCount?: number;
  opportunityTitle?: string;
}

export interface Refund {
  id: number;
  reference: string;
  amount: number;
  reason: string;
  reasonLabel: string;
  detail: string | null;
  status: string;
  userName: string | null;
  opportunityTitle: string | null;
  requestedById: number | null;
  providerRef: string | null;
  createdAt: string | null;
  completedAt: string | null;
}

export interface Distribution {
  id: number;
  reference: string;
  type: "FINANCIAL" | "PHYSICAL";
  status: string;
  title: string;
  grossAmount: number;
  expenseAmount: number;
  netAmount: number;
  notes: string | null;
  createdById: number | null;
  approvedById: number | null;
  itemCount: number | null;
  assetName: string | null;
  opportunityTitle: string | null;
  createdAt: string | null;
  executedAt: string | null;
}

export interface Payout {
  id: number;
  reference: string;
  amount: number;
  status: string;
  note: string | null;
  requestedById: number | null;
  approvedById: number | null;
  opportunityTitle: string | null;
  supplierName: string | null;
  createdAt: string | null;
  paidAt: string | null;
}

export interface NotificationItem {
  id: number;
  title: string;
  body: string;
  kind: string;
  href: string | null;
  readAt: string | null;
  createdAt: string | null;
}

export interface Approval {
  id: number;
  type: string;
  entityId: string;
  summary: string;
  amount: number | null;
  status: string;
  requestedById: number | null;
  requesterName: string | null;
  createdAt: string | null;
}

export interface AuditEntry {
  id: number;
  actor: string | null;
  action: string;
  entity: string;
  entityId: string;
  reason: string | null;
  createdAt: string | null;
}

export interface DashboardSummary {
  totalInvested: number;
  assetCount: number;
  portfolioValue: number;
  walletBalance: number;
  unreadNotifications: number;
  activeCount: number;
  growthPercent: number;
  trend: number[];
}

export interface AdminOverview {
  stats: {
    participants: number;
    fundingCount: number;
    committedAmount: number;
    safeguardedFunds: number;
    platformRevenue: number;
    pendingApprovals: number;
    pendingRefunds: number;
    activeAssets: number;
  };
  pendingReviews: Opportunity[];
  recentOpportunities: Opportunity[];
  approvals: Approval[];
  recentAudit: AuditEntry[];
}

export interface TrialBalanceRow {
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface LedgerEntryView {
  id: number;
  reference: string;
  kind: string;
  description: string;
  postedAt: string | null;
  lines: Array<{ code: string; name: string; direction: string; amount: number }>;
}
