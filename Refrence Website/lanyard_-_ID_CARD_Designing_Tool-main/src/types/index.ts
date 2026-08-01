export type UserRole = 'ultra-super-admin' | 'super-admin' | 'admin' | 'user';

export interface User {
    id?: string;
    _id: string;
    name: string;
    email: string;
    role: UserRole;
    organization: string;
    isActive: boolean;
    token?: string;
    created_at?: string;
    trial_end_date?: string | null;
    creator_id?: string | null;
}

export interface Project {
    id: string;
    _id?: string;
    name: string;
    organization: string;
    template: string;
    status: 'draft' | 'active' | 'validated' | 'generating' | 'completed';
    total_records: number;
    valid_records: number;
    invalid_records: number;
    missing_photos?: number;
    assignedTo?: string;
    assignedToName?: string;
    color?: string;
    created_at: string;
    current_stage?: string;
    completed_stages?: string; // JSON string
    pdf_url?: string;
    lanyard_pdf_url?: string;
    branch?: string;
    stage_timestamps?: string; // JSON string
    completed_at?: string;
    estimated_delivery?: string;
    delivery_method?: string;
    delivery_method_other?: string;
    design_state?: string;
}

export interface RecordIssue {
    id: string;
    recordId: string;
    record: string;
    message: string;
    severity: 'error' | 'warning';
    fixable: boolean;
}

export interface ProjectRecord {
    id: string;
    _id?: string;
    project_id: string;
    name: string;
    email?: string;
    status: 'valid' | 'invalid' | 'pending';
    photo_url?: string;
    data: Record<string, unknown>;
    created_at: string;
}
