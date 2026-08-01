import api from './api';
import { Project, ProjectRecord } from '../types';

export const projectService = {
    async getAll() {
        const res = await api.get('/projects');
        return res.data;
    },
    async getById(id: string) {
        const res = await api.get(`/projects/${id}`);
        return res.data;
    },
    async create(data: Partial<Project>) {
        const res = await api.post('/projects', data);
        return res.data;
    },
    async update(id: string, data: Partial<Project>) {
        const res = await api.put(`/projects/${id}`, data);
        return res.data;
    },
    async delete(id: string) {
        const res = await api.delete(`/projects/${id}`);
        return res.data;
    },
    async getIssues(id: string) {
        const res = await api.get(`/projects/${id}/issues`);
        return res.data;
    },
    async getPhotos(id: string) {
        const res = await api.get(`/projects/${id}/photos`);
        return res.data;
    },
};

export const recordService = {
    async getAll(projectId?: string) {
        const url = projectId ? `/records?projectId=${projectId}` : '/records';
        const res = await api.get(url);
        return res.data;
    },
    async getById(id: string) {
        const res = await api.get(`/records/${id}`);
        return res.data;
    },
    async create(data: Partial<ProjectRecord>) {
        const res = await api.post('/records', data);
        return res.data;
    },
    async update(id: string, data: Partial<ProjectRecord>) {
        const res = await api.put(`/records/${id}`, data);
        return res.data;
    },
    async delete(id: string) {
        const res = await api.delete(`/records/${id}`);
        return res.data;
    },
    async bulkCreate(projectId: string, records: Partial<ProjectRecord>[]) {
        const res = await api.post('/records/bulk', { projectId, records });
        return res.data;
    },
};

export const studentService = recordService;

export const orderService = {
    async getAll() {
        const res = await api.get('/orders');
        return res.data;
    },
    async getById(id: string) {
        const res = await api.get(`/orders/${id}`);
        return res.data;
    },
    async create(data: Record<string, unknown>) {
        const res = await api.post('/orders', data);
        return res.data;
    },
    async updateStatus(id: string, status: string) {
        const res = await api.put(`/orders/${id}/status`, { status });
        return res.data;
    },
};

// --- Upload configuration ---
const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB per chunk (10GB file = ~200 chunks)
const CHUNKED_THRESHOLD = 10 * 1024 * 1024; // Use chunked upload for files > 10MB
const UPLOAD_TIMEOUT = 60 * 60 * 1000; // 60 minute timeout for large uploads (up to 10GB)
const MAX_RETRIES = 3;

/** Delay helper for retry backoff */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Upload a single chunk with retry logic
 */
async function uploadChunkWithRetry(
    uploadId: string,
    chunkIndex: number,
    chunkBlob: Blob,
    retries = MAX_RETRIES
): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const formData = new FormData();
            formData.append('chunk', chunkBlob, `chunk_${chunkIndex}`);
            formData.append('chunkIndex', String(chunkIndex));
            
            await api.post(
                `/upload/chunked/${uploadId}/chunk/${chunkIndex}`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    timeout: 5 * 60 * 1000, // 5 min per chunk (50MB chunks)
                }
            );
            return; // Success
        } catch (error: unknown) {
            const err = error as Error;
            const isLastAttempt = attempt === retries;
            console.warn(`Chunk ${chunkIndex} upload attempt ${attempt}/${retries} failed:`, err.message);
            
            if (isLastAttempt) {
                throw new Error(`Failed to upload chunk ${chunkIndex} after ${retries} attempts. Check your internet connection.`);
            }
            
            // Exponential backoff: 1s, 2s, 4s
            await delay(Math.pow(2, attempt - 1) * 1000);
        }
    }
}

/**
 * Chunked upload for large files — splits file into 5MB chunks,
 * uploads each with retry logic, then merges on server.
 */
async function chunkedUpload(
    file: File,
    extraFields?: Record<string, string>,
    onProgress?: (percent: number) => void
): Promise<{ url: string; path: string; extracted?: boolean }> {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    
    // Step 1: Init session
    const initRes = await api.post('/upload/chunked/init', {
        fileName: file.name,
        fileSize: file.size,
        totalChunks,
    });
    const { uploadId } = initRes.data;
    
    // Step 2: Upload chunks
    for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunkBlob = file.slice(start, end);
        
        await uploadChunkWithRetry(uploadId, i, chunkBlob);
        
        if (onProgress) {
            onProgress(Math.round(((i + 1) / totalChunks) * 100));
        }
    }
    
    // Step 3: Finalize
    const finalizePayload: any = {
        fileName: file.name,
        totalChunks,
    };
    if (extraFields) {
        Object.assign(finalizePayload, extraFields);
    }
    const finalRes = await api.post(`/upload/chunked/${uploadId}/finalize`, finalizePayload);
    
    return finalRes.data;
}

/**
 * Standard single-request upload with retry logic
 */
async function standardUpload(
    endpoint: string,
    file: File,
    extraFields?: Record<string, string>,
    onProgress?: (percent: number) => void
): Promise<{ url: string; path: string }> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            if (extraFields) {
                Object.entries(extraFields).forEach(([key, val]) => formData.append(key, val));
            }
            
            const res = await api.post(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: UPLOAD_TIMEOUT,
                onUploadProgress: (progressEvent) => {
                    if (onProgress && progressEvent.total) {
                        const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                        onProgress(percent);
                    }
                },
            });
            
            return res.data;
        } catch (error: unknown) {
            const err = error as Record<string, unknown>;
            const isLastAttempt = attempt === MAX_RETRIES;
            
            // Don't retry if it's a server-side validation error (4xx)
            if (err.response && err.response.status >= 400 && err.response.status < 500) {
                const serverMsg = err.response.data?.error || err.response.data?.message || 'Upload rejected by server';
                throw new Error(serverMsg);
            }
            
            console.warn(`Upload attempt ${attempt}/${MAX_RETRIES} failed:`, err.message);
            
            if (isLastAttempt) {
                if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
                    throw new Error('Upload timed out. The file may be too large for a single upload. Please try again.');
                }
                if (err.message?.includes('Network Error')) {
                    throw new Error('Network error during upload. Please check your internet connection and try again.');
                }
                throw new Error(err.response?.data?.error || err.message || 'Upload failed after multiple attempts');
            }
            
            await delay(Math.pow(2, attempt - 1) * 1000);
        }
    }
    
    throw new Error('Upload failed unexpectedly');
}

export const uploadService = {
    /**
     * Upload an Excel file (usually small, standard upload)
     */
    async uploadExcel(file: File, onProgress?: (percent: number) => void) {
        return standardUpload('/upload/excel', file, { type: 'excel' }, onProgress);
    },
    
    /**
     * Upload a ZIP file — uses chunked upload for large files
     */
    async uploadZip(file: File, projectId?: string, onProgress?: (percent: number) => void) {
        const extraFields = projectId ? { extractPath: `projects/${projectId}/photos` } : undefined;
        
        if (file.size > CHUNKED_THRESHOLD) {
            console.log(`📦 Large ZIP (${(file.size / (1024*1024)).toFixed(1)}MB) — using chunked upload`);
            return chunkedUpload(file, extraFields, onProgress);
        }
        return standardUpload('/upload/zip', file, extraFields || { type: 'zip' }, onProgress);
    },
    
    /**
     * Upload a photo or PDF — uses chunked upload for large files (e.g., bulk ID card PDFs)
     */
    async uploadPhoto(file: File, onProgress?: (percent: number) => void) {
        if (file.size > CHUNKED_THRESHOLD) {
            console.log(`📦 Large PDF/Photo (${(file.size / (1024*1024)).toFixed(1)}MB) — using chunked upload`);
            return chunkedUpload(file, onProgress);
        }
        return standardUpload('/upload/photo', file, { type: 'photo' }, onProgress);
    }
};

export const dashboardService = {
    async getStats() {
        const res = await api.get('/dashboard/stats');
        return res.data;
    },
};

export const schoolService = {
    async getAll() {
        const res = await api.get('/schools');
        return res.data;
    },
    async getById(id: string) {
        const res = await api.get(`/schools/${id}`);
        return res.data;
    },
    async create(data: Record<string, unknown>) {
        const res = await api.post('/schools', data);
        return res.data;
    },
    async update(id: string, data: Record<string, unknown>) {
        const res = await api.put(`/schools/${id}`, data);
        return res.data;
    },
    async delete(id: string) {
        const res = await api.delete(`/schools/${id}`);
        return res.data;
    },
    async toggleVerify(id: string) {
        const res = await api.put(`/schools/${id}/verify`);
        return res.data;
    }
};

export const templateService = {
    async getAll() {
        const res = await api.get('/templates');
        return res.data;
    },
    async getById(id: string) {
        const res = await api.get(`/templates/${id}`);
        return res.data;
    },
    async create(data: Record<string, unknown>) {
        const res = await api.post('/templates', data);
        return res.data;
    },
    async update(id: string, data: Record<string, unknown>) {
        const res = await api.put(`/templates/${id}`, data);
        return res.data;
    },
    async delete(id: string) {
        const res = await api.delete(`/templates/${id}`);
        return res.data;
    }
};

export const advertisementService = {
    async getAll() {
        const res = await api.get('/advertisements');
        return res.data;
    },
    async getById(id: string) {
        const res = await api.get(`/advertisements/${id}`);
        return res.data;
    },
    async create(data: Record<string, unknown>) {
        const res = await api.post('/advertisements', data);
        return res.data;
    },
    async update(id: string, data: Record<string, unknown>) {
        const res = await api.put(`/advertisements/${id}`, data);
        return res.data;
    },
    async delete(id: string) {
        const res = await api.delete(`/advertisements/${id}`);
        return res.data;
    }
};
