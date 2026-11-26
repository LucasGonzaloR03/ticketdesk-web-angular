export type Role = 'CLIENT' | 'AGENT' | 'ADMIN';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Category = 'BILLING' | 'TECHNICAL' | 'ACCOUNT' | 'OTHER';

export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: number;
  email: string;
  role: Role;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface TicketResponse {
  id: number;
  titulo: string;
  descripcion: string;
  status: TicketStatus;
  priority: Priority;
  category: Category;
  requesterId: number;
  requesterName: string;
  assigneeId: number | null;
  assigneeName: string | null;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketRequest {
  titulo: string;
  descripcion: string;
  priority: Priority;
  category: Category;
}

export interface UpdateTicketRequest {
  titulo?: string;
  descripcion?: string;
  status?: TicketStatus;
  priority?: Priority;
  category?: Category;
}

export interface AssignRequest {
  assigneeId: number;
}

export interface CommentResponse {
  id: number;
  ticketId: number;
  authorId: number;
  authorName: string;
  body: string;
  internal: boolean;
  createdAt: string;
}

export interface CreateCommentRequest {
  body: string;
  internal: boolean;
}

export interface TicketEventResponse {
  id: number;
  ticketId: number;
  actorId: number;
  type: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export interface DuplicateResponse {
  id: number;
  titulo: string;
  status: TicketStatus;
  priority: Priority;
  category: Category;
  similitud: number;
}

export interface AiSettingsResponse {
  provider: string;
  model: string | null;
  keyHint: string | null;
  updatedAt: string | null;
}

export interface AiSettingsRequest {
  provider: string;
  model?: string;
  apiKey: string;
}

export interface ClassificationResponse {
  categoria: Category;
  prioridad: Priority;
  motivo: string;
  provider: string;
}

export interface SummaryResponse {
  resumen: string;
  provider: string;
}

export interface SuggestReplyResponse {
  borrador: string;
  provider: string;
}

export interface TicketFilters {
  status?: TicketStatus | '';
  priority?: Priority | '';
  category?: Category | '';
}

export interface ProblemDetail {
  title?: string;
  detail?: string;
  status?: number;
  errors?: Record<string, string>;
}
