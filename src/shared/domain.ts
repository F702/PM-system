export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
export type ServiceType = 'BIDDING' | 'COST' | 'SUPERVISION' | 'OTHER'
export type RiskLevel = 'danger' | 'warning'

export const serviceLabels: Record<ServiceType, string> = { BIDDING: '招标代理', COST: '造价/预结算', SUPERVISION: '监理', OTHER: '其他' }
export const statusLabels: Record<ProjectStatus, string> = { ACTIVE: '在办', COMPLETED: '已完成', CANCELLED: '已取消' }

export interface Employee { id: string; name: string; active: boolean; note?: string }
export interface Client { id: string; name: string; disabled?: boolean; note?: string }
export interface ProjectService { id: string; serviceType: ServiceType; stage: string; ownerId: string; plannedEndDate?: string; actualEndDate?: string; note?: string; otherDescription?: string; bidding?: Record<string, string> }
export interface Milestone { id: string; serviceId?: string; name: string; plannedDate: string; actualDate?: string; critical: boolean; note?: string }
export interface Contract { id: string; projectId: string; contractNo: string; amount: number; signedDate?: string; expectedPaymentDate?: string; note?: string; void?: boolean }
export interface Invoice { id: string; contractId: string; invoiceNo: string; invoiceDate: string; amount: number; note?: string; void?: boolean }
export interface Payment { id: string; contractId: string; paymentDate: string; amount: number; note?: string; void?: boolean }
export interface CostResult { id: string; projectId: string; resultType: string; versionLabel: string; status: 'DRAFT' | 'REVIEW' | 'FINAL'; amount: number; date: string; note?: string }
export interface SupervisionIssue { id: string; projectId: string; title: string; severity: 'GENERAL' | 'IMPORTANT'; responsibleParty: string; foundDate: string; dueDate: string; status: 'PENDING' | 'PROCESSING' | 'CLOSED'; closedDate?: string; note?: string }
export interface DocumentItem { id: string; projectId: string; category: 'CONTRACT' | 'BIDDING' | 'COST' | 'SUPERVISION' | 'INVOICE' | 'RESULT' | 'OTHER'; title: string; versionLabel?: string; final: boolean; originalName: string; mimeType: string; size: number; storedPath?: string; createdAt: string; hidden?: boolean; note?: string }
export interface AuditEvent { id: string; at: string; actor: string; action: string; entityType: string; entityId: string; before?: unknown; after?: unknown }
export interface Project { id: string; name: string; projectNo?: string; clientId: string; businessYear: number; ownerId: string; status: ProjectStatus; startDate?: string; plannedEndDate?: string; actualEndDate?: string; targetAmount?: number; note?: string; cancellationReason?: string; cancelledDate?: string; lastReviewedAt: string; createdAt: string; updatedAt: string; services: ProjectService[]; milestones: Milestone[]; costResults: CostResult[]; issues: SupervisionIssue[] }
export interface Risk { projectId: string; projectName: string; owner: string; reason: string; level: RiskLevel; days: number }
export interface Database { users: Array<{ id: string; username: string; passwordHash: string; mustChangePassword: boolean; disabled?: boolean; failedAttempts: number; lockedUntil?: string }>; employees: Employee[]; clients: Client[]; projects: Project[]; contracts: Contract[]; invoices: Invoice[]; payments: Payment[]; documents: DocumentItem[]; audit: AuditEvent[] }
