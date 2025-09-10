export interface AdminOutcome {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  status?: "active" | "archived";
  orderIndex?: number;
}

export interface AdminLittleJob {
  id: string;
  name: string;
  description?: string;
  outcomes: AdminOutcome[];
  status?: "active" | "archived";
  orderIndex?: number;
}

export interface AdminBigJob {
  id: string;
  name: string;
  description?: string;
  littleJobs: AdminLittleJob[];
  status?: "active" | "archived";
  orderIndex?: number;
}

export interface JTBDHierarchy {
  bigJobs: AdminBigJob[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: 'create' | 'update' | 'delete' | 'archive' | 'reorder';
  entityType: 'bigJob' | 'littleJob' | 'outcome';
  entityId: string;
  entityName: string;
  changes: Record<string, any>;
}

export interface ValidationError {
  field: string;
  message: string;
}

export type EntityType = 'bigJob' | 'littleJob' | 'outcome';

export interface DragItem {
  id: string;
  type: EntityType;
  parentId?: string;
  index: number;
}