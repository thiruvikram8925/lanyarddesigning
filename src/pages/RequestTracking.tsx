import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Clock, CheckCircle, FileText, Download, 
    Printer, ArrowRight, ChevronRight, Package, Upload, 
    Check, Play, Loader2, Search, ShieldCheck, Truck
} from 'lucide-react';
import { projectService, uploadService } from '@/services/dataService';
import { Project } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STAGES = [
    { key: 'data_collected', label: 'Data Collected', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { key: 'processing', label: 'Processing', icon: Play, color: 'text-amber-600', bg: 'bg-amber-50' },
    { key: 'id_card_generated', label: 'Generated', icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
    { key: 'validation', label: 'Verification for Printing', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { key: 'printing', label: 'Printing', icon: Printer, color: 'text-gray-600', bg: 'bg-gray-50' },
    { key: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { key: 'delivery', label: 'Delivery', icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
];

const getStageIndex = (stageKey?: string) => {
    const idx = STAGES.findIndex(s => s.key === stageKey);
    return idx === -1 ? 0 : idx;
};

/** Safely parse JSON arrays/objects */
const safeParseJSON = <T,>(raw: string | null | undefined, fallback: T): T => {
    if (!raw) return fallback;
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(fallback) && Array.isArray(parsed)) return parsed as unknown as T;
        if (!Array.isArray(fallback) && typeof parsed === 'object' && parsed !== null) return parsed as unknown as T;
        return fallback;
    } catch {
        return fallback;
    }
};

const safeParseStages = (raw?: string | null): string[] => safeParseJSON(raw, []);
const safeParseTimestamps = (raw?: string | null): Record<string, string> => safeParseJSON(raw, {});


const getTrackStageKey = (track: 'id' | 'lanyard', stageKey: string) => `${track}_${stageKey}`;

const isStageDoneForTrack = (completedStages: string[], track: 'id' | 'lanyard', stageKey: string) => {
    // Backward compatibility: if the generic stageKey is present, consider it done for both tracks
    return completedStages.includes(getTrackStageKey(track, stageKey)) || completedStages.includes(stageKey);
};

const getProjectLowestStage = (completedStages: string[]) => {
    let lowestIdx = STAGES.length - 1;
    for (const track of ['id', 'lanyard'] as const) {
        let firstUncompletedIdx = STAGES.findIndex(s => s.key !== 'delivery' && !isStageDoneForTrack(completedStages, track, s.key));
        if (firstUncompletedIdx === -1) {
            // All track stages completed
            firstUncompletedIdx = STAGES.length - 1; // delivery
        }
        if (firstUncompletedIdx < lowestIdx) lowestIdx = firstUncompletedIdx;
    }
    
    // If tracks are fully completed but global delivery isn't done
    if (lowestIdx === STAGES.length - 1 && !completedStages.includes('delivery')) {
        return 'delivery';
    } else if (lowestIdx === STAGES.length - 1 && completedStages.includes('delivery')) {
        return 'completed'; // actually, delivery is the last stage, so if it's done, it stays at delivery or maybe "delivered"
    }

    return STAGES[lowestIdx].key;
};

const RequestTracking = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [deliveryMethods, setDeliveryMethods] = useState<Record<string, string>>({});
    const [deliveryOthers, setDeliveryOthers] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const data = await projectService.getAll();
            setProjects(data || []);
        } catch (error) {
            console.error('Failed to fetch projects', error);
            toast.error('Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    const toggleStage = async (project: Project, stageKey: string, track: 'id' | 'lanyard', e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        
        const completed = safeParseStages(project.completed_stages);
        const timestamps = safeParseTimestamps(project.stage_timestamps);
        const stageIdx = STAGES.findIndex(s => s.key === stageKey);
        const trackStageKey = getTrackStageKey(track, stageKey);
        const isCurrentlyDone = isStageDoneForTrack(completed, track, stageKey);

        // 1. Check for forward sequence (completing a stage)
        if (!isCurrentlyDone) {
            for (let i = 0; i < stageIdx; i++) {
                if (!isStageDoneForTrack(completed, track, STAGES[i].key)) {
                    toast.error(`Please complete "${STAGES[i].label}" for ${track.toUpperCase()} first`);
                    return;
                }
            }
        } 
        // 2. Check for backward sequence (undoing a stage)
        else {
            for (let i = stageIdx + 1; i < STAGES.length; i++) {
                if (isStageDoneForTrack(completed, track, STAGES[i].key)) {
                    toast.error(`Please undo "${STAGES[i].label}" for ${track.toUpperCase()} first`);
                    return;
                }
            }
        }

        if (stageKey === 'id_card_generated' && !isCurrentlyDone && !project.pdf_url) {
            toast.error(`Please upload a PDF to complete the "Generated" stage`);
            setExpandedId(project.id || project._id || null);
            return;
        }

        if (stageKey === 'delivery' && !isCurrentlyDone) {
            const pid = project.id || project._id || '';
            const method = deliveryMethods[pid];
            if (!method) {
                toast.error('Please select a delivery method');
                return;
            }
            if (method === 'Others' && !deliveryOthers[pid]) {
                toast.error('Please specify the delivery method');
                return;
            }
        }

        try {
            let newCompleted: string[];
            let completedAt = project.completed_at;

            if (isCurrentlyDone) {
                // If it was legacy, we must remove the legacy key and explicitly add the OTHER track's keys so it doesn't undo both if we only clicked one
                if (completed.includes(stageKey)) {
                     newCompleted = completed.filter(s => s !== stageKey);
                     const otherTrack = track === 'id' ? 'lanyard' : 'id';
                     newCompleted.push(getTrackStageKey(otherTrack, stageKey));
                } else {
                     newCompleted = completed.filter(s => s !== trackStageKey);
                }
                delete timestamps[trackStageKey];
                
                // If both are not completed, nullify completed_at
                if (stageKey === 'completed') {
                    if (!isStageDoneForTrack(newCompleted, track === 'id' ? 'lanyard' : 'id', 'completed')) {
                        completedAt = '';
                    }
                }
            } else {
                newCompleted = [...completed, trackStageKey];
                timestamps[trackStageKey] = new Date().toISOString();
                if (stageKey === 'completed') {
                    // Only mark globally completed if BOTH tracks are at 'completed'
                    if (isStageDoneForTrack(newCompleted, track === 'id' ? 'lanyard' : 'id', 'completed')) {
                        completedAt = new Date().toISOString();
                    }
                }
            }

            if (stageKey === 'delivery' && !isCurrentlyDone) {
                const pid = project.id || project._id || '';
                timestamps[`${track}_delivery_method`] = deliveryMethods[pid];
                if (deliveryMethods[pid] === 'Others') {
                    timestamps[`${track}_delivery_method_other`] = deliveryOthers[pid];
                }
            }

            const nextStage = getProjectLowestStage(newCompleted);

            const updatePayload: Partial<Project> = {
                current_stage: nextStage,
                completed_stages: JSON.stringify(newCompleted),
                stage_timestamps: JSON.stringify(timestamps),
                completed_at: completedAt
            };

            await projectService.update(project.id || project._id || '', updatePayload);

            toast.success('Stage updated');
            fetchProjects();
        } catch (error: unknown) {
            console.error('Failed to update stage', error);
            const apiErr = error as any;
            const errorMsg = apiErr.response?.data?.message || apiErr.response?.data?.error || (error as Error).message || 'Unknown error';
            toast.error(`Update failed: ${errorMsg}`);
        }
    };

    const toggleGlobalDelivery = async (project: Project, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        
        const completed = safeParseStages(project.completed_stages);
        const timestamps = safeParseTimestamps(project.stage_timestamps);
        const isCurrentlyDone = completed.includes('delivery') || completed.includes('id_delivery') || completed.includes('lanyard_delivery');

        // Check if both tracks are completed
        let bothCompleted = true;
        for (const track of ['id', 'lanyard'] as const) {
            if (!isStageDoneForTrack(completed, track, 'completed')) {
                bothCompleted = false;
            }
        }

        if (!isCurrentlyDone && !bothCompleted) {
            toast.error('Please complete all stages for both ID Card and Lanyard tracks first');
            return;
        }

        const pid = project.id || project._id || '';
        if (!isCurrentlyDone) {
            const method = deliveryMethods[pid];
            if (!method) {
                toast.error('Please select a delivery method');
                return;
            }
            if (method === 'Others' && !deliveryOthers[pid]) {
                toast.error('Please specify the delivery method');
                return;
            }
        }

        try {
            let newCompleted = [...completed];
            if (isCurrentlyDone) {
                newCompleted = newCompleted.filter(s => s !== 'delivery' && s !== 'id_delivery' && s !== 'lanyard_delivery');
                delete timestamps['delivery'];
            } else {
                newCompleted.push('delivery');
                timestamps['delivery'] = new Date().toISOString();
                timestamps['global_delivery_method'] = deliveryMethods[pid];
                if (deliveryMethods[pid] === 'Others') {
                    timestamps['global_delivery_method_other'] = deliveryOthers[pid];
                }
            }

            const nextStage = getProjectLowestStage(newCompleted);

            const updatePayload: Partial<Project> = {
                current_stage: nextStage,
                completed_stages: JSON.stringify(newCompleted),
                stage_timestamps: JSON.stringify(timestamps)
            };

            await projectService.update(pid, updatePayload);
            toast.success('Delivery stage updated');
            fetchProjects();
        } catch (error: unknown) {
            console.error('Failed to update global delivery', error);
            const apiErr = error as any;
            const errorMsg = apiErr.response?.data?.message || apiErr.response?.data?.error || (error as Error).message || 'Unknown error';
            toast.error(`Update failed: ${errorMsg}`);
        }
    };

    const handleFileUpload = async (project: Project, file: File, track: 'id' | 'lanyard') => {
        const completed = safeParseStages(project.completed_stages);
        const timestamps = safeParseTimestamps(project.stage_timestamps);
        
        const processingIdx = STAGES.findIndex(s => s.key === 'processing');
        let trackReady = true;
        for (let i = 0; i <= processingIdx; i++) {
            if (!isStageDoneForTrack(completed, track, STAGES[i].key)) {
                trackReady = false;
                break;
            }
        }

        if (!trackReady) {
            toast.error(`Please complete Processing for ${track === 'id' ? 'ID Card' : 'Lanyard'} before uploading file`);
            return;
        }

        const fileSizeMB = file.size / (1024 * 1024);
        const fileSizeGB = fileSizeMB / 1024;
        if (fileSizeGB > 10) {
            toast.error('File too large. Maximum upload size is 10 GB.');
            return;
        }
        if (fileSizeGB > 1) {
            toast.info(`Large file detected (${fileSizeGB.toFixed(2)} GB). This will be uploaded in chunks — please keep this page open.`);
        } else if (fileSizeMB > 50) {
            toast.info(`File size: ${fileSizeMB.toFixed(1)} MB. Upload may take a while...`);
        }

        try {
            setUploadingId(`${project.id || project._id}_${track}`);
            setUploadProgress(0);
            
            const res = await uploadService.uploadPhoto(file, (percent) => {
                setUploadProgress(percent);
            });
            const fileUrl = res.url;

            if (!isStageDoneForTrack(completed, track, 'id_card_generated')) {
                completed.push(getTrackStageKey(track, 'id_card_generated'));
                timestamps[getTrackStageKey(track, 'id_card_generated')] = new Date().toISOString();
            }

            const nextStage = getProjectLowestStage(completed);

            const updatePayload: Partial<Project> = {
                current_stage: nextStage,
                completed_stages: JSON.stringify(completed),
                stage_timestamps: JSON.stringify(timestamps)
            };

            if (track === 'id') {
                updatePayload.pdf_url = fileUrl;
            } else {
                updatePayload.lanyard_pdf_url = fileUrl;
            }

            await projectService.update(project.id || project._id || '', updatePayload);

            toast.success('File uploaded');
            fetchProjects();
        } catch (error: unknown) {
            console.error('Upload failed', error);
            const apiErr = error as any;
            const errorMsg = apiErr.response?.data?.error || apiErr.response?.data?.message || (error as Error).message || 'Upload failed';
            toast.error(errorMsg);
        } finally {
            setUploadingId(null);
            setUploadProgress(0);
        }
    };const filteredProjects = projects.filter(p => 
        (p.name || '').toLowerCase().includes(search.toLowerCase()) || 
        (p.organization || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Request Tracking</h1>
                    <p className="text-gray-500 mt-1">Manage and track the lifecycle of project requests.</p>
                </div>
            </div>

            {/* Pipeline Overview */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" /> Pipeline Overview
                </h2>
                <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
                    {STAGES.map((stage, i) => {
                        const count = projects.filter(p => p.current_stage === stage.key).length;
                        return (
                            <div key={stage.key} className="flex items-center gap-1 flex-1 min-w-[120px]">
                                <div className="flex-1 text-center">
                                    <div className={`w-10 h-10 rounded-xl mx-auto flex items-center justify-center ${count > 0 ? stage.bg + ' ' + stage.color : 'bg-gray-50 text-gray-400'}`}>
                                        <stage.icon className="w-5 h-5" />
                                    </div>
                                    <p className="text-[11px] font-semibold text-gray-600 mt-2">{stage.label}</p>
                                    <p className="text-lg font-bold text-gray-900 leading-none mt-1">{count}</p>
                                </div>
                                {i < STAGES.length - 1 && <ArrowRight className="w-4 h-4 text-gray-200 flex-shrink-0 mt-[-16px]" />}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects or organizations..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
            </div>

            <div className="space-y-3">
                {loading ? (
                    <div className="py-20 text-center">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                        <p className="mt-4 text-gray-500 font-medium">Loading project requests...</p>
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="py-20 text-center bg-white rounded-2xl border border-gray-100 italic text-gray-400">
                        No projects found matching your search.
                    </div>
                ) : (
                    filteredProjects.map((project, i) => {
                        const currentStageIdx = getStageIndex(project.current_stage);
                        const isExpanded = expandedId === (project.id || project._id);
                        const completedStages = safeParseStages(project.completed_stages);

                        return (
                            <motion.div key={project.id || project._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                className="bg-white rounded-xl border border-gray-200 transition-all duration-200 overflow-hidden hover:shadow-md">
                                <div className="p-4 cursor-pointer flex items-center gap-4" onClick={() => setExpandedId(isExpanded ? null : (project.id || project._id || null))}>
                                    
                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                                        <Package className="w-6 h-6 text-gray-400" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-sm font-bold text-gray-900 truncate">{project.name}</h3>
                                            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter">{(project.id || project._id || '').slice(-6)}</span>
                                            {project.assignedToName && (
                                                <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-600 border border-purple-100 rounded-full font-bold ml-2">
                                                    Admin: {project.assignedToName}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            {STAGES.map((stage, idx) => {
                                                const isCompletedId = isStageDoneForTrack(completedStages, 'id', stage.key);
                                                const isCompletedLan = isStageDoneForTrack(completedStages, 'lanyard', stage.key);
                                                const isCompleted = isCompletedId && isCompletedLan;
                                                const isPartial = isCompletedId || isCompletedLan;
                                                
                                                return (
                                                    <div key={stage.key} className="flex items-center gap-1">
                                                        <div title={stage.label} className={cn(
                                                                "w-6 h-6 rounded-md flex items-center justify-center border-2 transition-all duration-200",
                                                                isCompleted ? "bg-blue-600 border-blue-600 text-white" : 
                                                                isPartial ? "bg-blue-300 border-blue-300 text-white" :
                                                                "bg-white border-gray-200 text-gray-200"
                                                            )}>
                                                            <Check className={cn("w-3.5 h-3.5", !isPartial && "opacity-0")} strokeWidth={4} />
                                                        </div>
                                                        {idx < STAGES.length - 1 && <div className={cn("w-2 h-0.5", isCompleted ? "bg-blue-100" : "bg-gray-100")} />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5",
                                            STAGES[currentStageIdx].bg, STAGES[currentStageIdx].color
                                        )}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                            {STAGES[currentStageIdx].label}
                                        </div>
                                        <ChevronRight className={cn("w-5 h-5 text-gray-400 transition-transform", isExpanded && "rotate-90")} />
                                    </div>
                                </div>

                                {isExpanded && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="border-t border-gray-100 bg-gray-50/50 p-5">
                                        <div className="flex items-start justify-between gap-8">
                                            <div className="flex-1 space-y-6">
                                                <div className="flex-1 flex gap-8">
                                                    {(['id', 'lanyard'] as const).map(track => (
                                                        <div key={track} className="flex-1">
                                                            <h4 className="text-sm font-bold text-gray-700 mb-6 uppercase tracking-wider">{track === 'id' ? 'ID Card Track' : 'Lanyard Track'}</h4>
                                                            <div className="relative">
                                                                <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-gray-100" />
                                                                <div className="space-y-8 relative">
                                                                    {STAGES.filter(s => s.key !== 'delivery').map((stage) => {
                                                                        const isDone = isStageDoneForTrack(completedStages, track, stage.key);
                                                                        
                                                                        // Determine if current for this specific track
                                                                        let isCurrent = false;
                                                                        const trackStages = STAGES.filter(s => s.key !== 'delivery');
                                                                        const firstUncompletedIdx = trackStages.findIndex(s => !isStageDoneForTrack(completedStages, track, s.key));
                                                                        if (firstUncompletedIdx !== -1 && trackStages[firstUncompletedIdx].key === stage.key) {
                                                                            isCurrent = true;
                                                                        } else if (firstUncompletedIdx === -1 && stage.key === 'completed') {
                                                                            isCurrent = true; // both are done, so 'completed' is the current
                                                                        }

                                                                        return (
                                                                            <div key={stage.key} className="flex items-center gap-4 group">
                                                                                <div className={cn(
                                                                                    "w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all duration-300",
                                                                                    isDone ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100" : 
                                                                                    isCurrent ? "bg-blue-600 text-white ring-4 ring-blue-100 shadow-lg shadow-blue-100" : 
                                                                                    "bg-white border-2 border-gray-200 text-gray-400",
                                                                                    !isDone && !isCurrent && "opacity-40"
                                                                                )}>
                                                                                    {isDone ? <Check className="w-4 h-4" /> : <stage.icon className="w-4 h-4" />}
                                                                                </div>
                                                                                <div className="flex-1">
                                                                                    <div className="flex items-center justify-between">
                                                                                        <div>
                                                                                            <p className={cn("text-xs font-bold", isDone ? "text-emerald-600" : isCurrent ? "text-blue-600" : "text-gray-500")}>
                                                                                                {stage.label}
                                                                                            </p>
                                                                                            <p className="text-[10px] text-gray-400">
                                                                                                {isDone ? 'Completed' : isCurrent ? 'Active step' : 'Pending'}
                                                                                            </p>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-2">

                                                                                            {stage.key === 'id_card_generated' && (
                                                                                                <label className={cn(
                                                                                                    "flex items-center gap-2 px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-[10px] font-bold text-purple-600 hover:bg-purple-50 transition-all shadow-sm relative overflow-hidden",
                                                                                                    (isDone || isCurrent) ? "cursor-pointer" : "opacity-40 cursor-not-allowed"
                                                                                                )}>
                                                                                                    {uploadingId === (`${project.id || project._id}_${track}`) && uploadProgress > 0 && (
                                                                                                        <div 
                                                                                                            className="absolute inset-0 bg-purple-100 transition-all duration-300" 
                                                                                                            style={{ width: `${uploadProgress}%` }} 
                                                                                                        />
                                                                                                    )}
                                                                                                    <span className="relative z-10 flex items-center gap-2">
                                                                                                        {uploadingId === (`${project.id || project._id}_${track}`) ? (
                                                                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                                                                        ) : (
                                                                                                            <Upload className="w-3 h-3" />
                                                                                                        )}
                                                                                                        {uploadingId === (`${project.id || project._id}_${track}`) 
                                                                                                            ? `Uploading... ${uploadProgress}%` 
                                                                                                            : 'Upload File'}
                                                                                                    </span>
                                                                                                    <input type="file" accept=".pdf,image/jpeg,image/png,image/jpg" className="hidden" 
                                                                                                        onChange={(e) => e.target.files?.[0] && handleFileUpload(project, e.target.files[0], track)} 
                                                                                                        disabled={!!uploadingId || (!isDone && !isCurrent)} />
                                                                                                </label>
                                                                                            )}
                                                                                            <button onClick={(e) => toggleStage(project, stage.key, track, e)}
                                                                                                disabled={!isDone && !isCurrent}
                                                                                                className={cn(
                                                                                                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-md",
                                                                                                    isDone ? "bg-emerald-100 text-emerald-700 shadow-emerald-50" : 
                                                                                                    isCurrent ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100" :
                                                                                                    "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                                                                )}>
                                                                                                <Check className="w-3 h-3" /> {isDone ? 'Undo' : 'Mark Done'}
                                                                                            </button>
                                                                                            {isDone && stage.key === 'id_card_generated' && track === 'id' && project.pdf_url && (
                                                                                                <a href={`/api/projects/${project.id || project._id}/view-pdf?token=${localStorage.getItem('gotek_token')}`} target="_blank" rel="noreferrer"
                                                                                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-[10px] font-bold text-emerald-600 hover:bg-emerald-50 transition-all">
                                                                                                    <Download className="w-3 h-3" /> View PDF
                                                                                                </a>
                                                                                            )}
                                                                                            {isDone && stage.key === 'id_card_generated' && track === 'lanyard' && project.lanyard_pdf_url && (
                                                                                                <a href={project.lanyard_pdf_url} target="_blank" rel="noreferrer"
                                                                                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-[10px] font-bold text-emerald-600 hover:bg-emerald-50 transition-all">
                                                                                                    <Download className="w-3 h-3" /> View File
                                                                                                </a>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="w-64 space-y-4">
                                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Project Assets</h4>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 group hover:bg-blue-50 transition-colors cursor-pointer">
                                                            <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center">
                                                                <FileText className="w-4 h-4 text-blue-500" />
                                                            </div>
                                                            <div className="flex-1 overflow-hidden">
                                                                <p className="text-[11px] font-bold text-gray-700 truncate">Records Data</p>
                                                                <p className="text-[9px] text-gray-400">XLSX • {project.total_records || 0} rows</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 group hover:bg-blue-50 transition-colors cursor-pointer">
                                                            <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center">
                                                                <Package className="w-4 h-4 text-purple-500" />
                                                            </div>
                                                            <div className="flex-1 overflow-hidden">
                                                                <p className="text-[11px] font-bold text-gray-700 truncate">Source Photos</p>
                                                                <p className="text-[9px] text-gray-400">ZIP • High Res</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mt-4">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                                                                (completedStages.includes('delivery') || completedStages.includes('id_delivery') || completedStages.includes('lanyard_delivery'))
                                                                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100"
                                                                    : "bg-white border-2 border-gray-200 text-gray-400"
                                                            )}>
                                                                {(completedStages.includes('delivery') || completedStages.includes('id_delivery') || completedStages.includes('lanyard_delivery')) ? <Check className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Project Delivery</h4>
                                                                <p className="text-[10px] text-gray-400">Final step for dispatch</p>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={(e) => toggleGlobalDelivery(project, e)}
                                                            className={cn(
                                                                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md",
                                                                (completedStages.includes('delivery') || completedStages.includes('id_delivery') || completedStages.includes('lanyard_delivery'))
                                                                    ? "bg-emerald-100 text-emerald-700 shadow-emerald-50"
                                                                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100"
                                                            )}
                                                        >
                                                            <Check className="w-4 h-4" /> 
                                                            {(completedStages.includes('delivery') || completedStages.includes('id_delivery') || completedStages.includes('lanyard_delivery')) ? 'Undo Delivery' : 'Mark as Delivered'}
                                                        </button>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <select 
                                                            value={deliveryMethods[project.id || project._id || ''] || ''}
                                                            onChange={(e) => setDeliveryMethods(prev => ({ ...prev, [project.id || project._id || '']: e.target.value }))}
                                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                                                        >
                                                            <option value="">Select Method</option>
                                                            <option value="In-person Delivery">In-person Delivery</option>
                                                            <option value="Customer Pickup">Customer Pickup</option>
                                                            <option value="Courier">Courier</option>
                                                            <option value="Others">Others</option>
                                                        </select>
                                                        {deliveryMethods[project.id || project._id || ''] === 'Others' && (
                                                            <input 
                                                                type="text"
                                                                value={deliveryOthers[project.id || project._id || ''] || ''}
                                                                onChange={(e) => setDeliveryOthers(prev => ({ ...prev, [project.id || project._id || '']: e.target.value }))}
                                                                placeholder="Specify other method..."
                                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default RequestTracking;
