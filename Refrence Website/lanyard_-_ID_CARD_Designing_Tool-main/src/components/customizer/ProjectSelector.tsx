import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectService } from '@/services/dataService';
import { Project } from '@/types';
import { FolderOpen, Search, Loader2 } from 'lucide-react';
import { useConfiguratorStore } from '@/store/useConfiguratorStore';

export default function ProjectSelector() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const setField = useConfiguratorStore(state => state.setField);
  const loadLocal = useConfiguratorStore(state => state.loadLocal);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getAll();
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = async (project: Project) => {
    const projectId = project.id || (project as Record<string, unknown>)._id;
    const currentParams = new URLSearchParams(window.location.search);
    if (currentParams.get('orderId') === projectId) {
      // Force load if the URL is already set but the project isn't selected in the store
      await loadLocal(projectId);
      setField('idCard.selected', projectId);
    } else {
      navigate(`?orderId=${projectId}`);
    }
  };

  const filtered = projects.filter(p => {
    const pName = (p.name || '').toLowerCase();
    const pOrg = (p.organization || '').toLowerCase();
    const searchTerms = search.toLowerCase();
    return pName.includes(searchTerms) || pOrg.includes(searchTerms);
  });

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] bg-slate-50 items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Select a Project</h1>
          <p className="text-slate-500 font-medium mt-2">Choose a project to load its design workspace.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search projects by name or organization..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-slate-700 font-medium"
            />
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
              <p className="text-slate-500 font-medium">Loading projects...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center">
              <FolderOpen className="w-16 h-16 text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-700">No projects found</h3>
              <p className="text-slate-500 mt-1">Try adjusting your search or create a new project from the Dashboard.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
              {filtered.map(project => (
                <button
                  key={(project.id || (project as Record<string, unknown>)._id) as string}
                  onClick={() => handleSelectProject(project)}
                  className="flex flex-col text-left p-6 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all group bg-white active:scale-95"
                >
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                    <FolderOpen size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 truncate w-full mb-1">{project.name}</h3>
                  <p className="text-sm font-medium text-slate-500 truncate w-full">{project.organization}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
