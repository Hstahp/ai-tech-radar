import type { AppDbRepository, AuditLogRecord } from '../repositories/app-db.js';

export interface RecordAuditParams {
    actorUserId?: string | null;
    action: string;
    targetType?: string | null;
    targetId?: string | null;
    metadata?: Record<string, unknown> | null;
}

/**
 * Ghi nhận hành động quản trị viên vào nhật ký kiểm toán (audit_log).
 * Tuyệt đối không ghi thông tin bí mật (token, key, credentials) vào metadata.
 */
export async function recordAuditLog(db: AppDbRepository, params: RecordAuditParams): Promise<AuditLogRecord> {
    return db.insertAuditLog({
        actorUserId: params.actorUserId ?? null,
        action: params.action,
        targetType: params.targetType ?? null,
        targetId: params.targetId ?? null,
        metadataJson: params.metadata ? JSON.stringify(params.metadata) : null,
    });
}
