import React from 'react';
import { Sparkles, LayoutTemplate } from 'lucide-react';
import { useConfiguratorStore, Design } from '../../store/useConfiguratorStore';
import { toast } from 'sonner';

export interface LanyardTemplate {
  id: string;
  name: string;
  category: string;
  gradient: string;
  description: string;
  tags: string[];
  design: Partial<Design>;
}

const TEMPLATE_LIBRARY: LanyardTemplate[] = [
  // ─── Corporate & Business ──────────────────────────────
  {
    id: 'corp-exec-navy',
    name: 'Corporate Executive Navy',
    category: 'Corporate',
    gradient: 'from-blue-700 to-slate-900',
    description: 'Deep navy blue with authoritative silver-white lettering & lobster claw.',
    tags: ['Sublimated', '20mm', 'Business'],
    design: {
      printingMethod: 'Sublimated',
      lanyardStyle: 'Single Ended',
      width: '20mm',
      lanyardColor: '#1e3a8a',
      customColorCode: '#1e3a8a',
      fontFamily: 'Inter',
      fontColor: '#ffffff',
      fontSize: 16,
      customTextLeft: 'GLOBAL ENTERPRISE',
      customTextCenter: 'EXECUTIVE PASS',
      customTextRight: 'GLOBAL ENTERPRISE',
      clipType: 'Lobster Claw',
      lanyardDesignStyle: 'repeated',
      textSpacing: 70,
    }
  },
  {
    id: 'corp-fintech-black',
    name: 'Fintech Platinum & Slate',
    category: 'Corporate',
    gradient: 'from-slate-800 to-zinc-950',
    description: 'Sleek luxury charcoal with polished platinum typography.',
    tags: ['Woven', '20mm', 'Finance'],
    design: {
      printingMethod: 'Woven',
      lanyardStyle: 'Single Ended',
      width: '20mm',
      lanyardColor: '#0f172a',
      customColorCode: '#0f172a',
      fontFamily: 'Montserrat',
      fontColor: '#e2e8f0',
      fontSize: 15,
      customTextLeft: 'CAPITAL PARTNERS',
      customTextCenter: 'MANAGEMENT',
      customTextRight: 'CAPITAL PARTNERS',
      clipType: 'Metal Hook',
      lanyardDesignStyle: 'repeated',
      textSpacing: 65,
    }
  },

  // ─── Tech & Innovation ────────────────────────────────
  {
    id: 'tech-devcon-purple',
    name: 'DevCon Global 2026',
    category: 'Tech',
    gradient: 'from-violet-600 to-indigo-700',
    description: 'Modern vibrant purple with clean white sans-serif typography.',
    tags: ['Sublimated', '20mm', 'Conference'],
    design: {
      printingMethod: 'Sublimated',
      lanyardStyle: 'Single Ended',
      width: '20mm',
      lanyardColor: '#6366f1',
      customColorCode: '#6366f1',
      fontFamily: 'Montserrat',
      fontColor: '#ffffff',
      fontSize: 18,
      customTextLeft: 'DEVCON GLOBAL 2026',
      customTextCenter: 'SPEAKER // VIP',
      customTextRight: 'DEVCON GLOBAL 2026',
      clipType: 'Metal Hook',
      lanyardDesignStyle: 'repeated',
      textSpacing: 65,
      logoMode: 'repeated',
    }
  },
  {
    id: 'tech-cyberpunk-neon',
    name: 'Cyberpunk Matrix Neon',
    category: 'Tech',
    gradient: 'from-fuchsia-600 to-cyan-500',
    description: 'Dark mode backdrop with luminous electric cyan accents.',
    tags: ['Sublimated', '25mm', 'Futuristic'],
    design: {
      printingMethod: 'Sublimated',
      lanyardStyle: 'Single Ended',
      width: '25mm',
      lanyardColor: '#09090b',
      customColorCode: '#09090b',
      fontFamily: 'Roboto',
      fontColor: '#22d3ee',
      fontSize: 19,
      customTextLeft: 'CYBERSECURITY LABS',
      customTextCenter: 'CLEARANCE LEVEL 5',
      customTextRight: 'CYBERSECURITY LABS',
      clipType: 'Metal Hook',
      lanyardDesignStyle: 'repeated',
      textSpacing: 65,
    }
  },
  {
    id: 'tech-ai-robotics',
    name: 'Neural AI & Robotics Lab',
    category: 'Tech',
    gradient: 'from-teal-500 to-blue-700',
    description: 'Tech gradient ribbon with monospace typography.',
    tags: ['Sublimated', '20mm', 'AI'],
    design: {
      printingMethod: 'Sublimated',
      lanyardStyle: 'Single Ended',
      width: '20mm',
      lanyardColor: '#0f766e',
      customColorCode: '#0f766e',
      fontFamily: 'Courier New',
      fontColor: '#ccfbf1',
      fontSize: 16,
      customTextLeft: 'NEURAL RESEARCH LAB',
      customTextCenter: 'AI ENGINEER',
      customTextRight: 'NEURAL RESEARCH LAB',
      clipType: 'Metal Hook',
      lanyardDesignStyle: 'repeated',
      textSpacing: 60,
    }
  },

  // ─── Event & VIP ──────────────────────────────────────
  {
    id: 'event-vip-gold',
    name: 'VIP All-Access Gold Gala',
    category: 'Event & VIP',
    gradient: 'from-amber-500 to-orange-700',
    description: 'High-contrast midnight black & rich gold for festivals and galas.',
    tags: ['Sublimated', '25mm', 'VIP'],
    design: {
      printingMethod: 'Sublimated',
      lanyardStyle: 'Single Ended',
      width: '25mm',
      lanyardColor: '#18181b',
      customColorCode: '#18181b',
      fontFamily: 'Oswald',
      fontColor: '#fbbf24',
      fontSize: 20,
      customTextLeft: 'VIP ALL-ACCESS 2026',
      customTextCenter: 'BACKSTAGE PASS',
      customTextRight: 'VIP ALL-ACCESS 2026',
      clipType: 'Oval Hook',
      lanyardDesignStyle: 'repeated',
      textSpacing: 60,
    }
  },
  {
    id: 'event-music-fest',
    name: 'Ultra Music Festival Sunset',
    category: 'Event & VIP',
    gradient: 'from-pink-500 to-rose-600',
    description: 'Vibrant party gradient with bold distressed lettering.',
    tags: ['Sublimated', '25mm', 'Festival'],
    design: {
      printingMethod: 'Sublimated',
      lanyardStyle: 'Single Ended',
      width: '25mm',
      lanyardColor: '#e11d48',
      customColorCode: '#e11d48',
      fontFamily: 'Montserrat',
      fontColor: '#ffffff',
      fontSize: 18,
      customTextLeft: 'SUMMER VIBES FEST',
      customTextCenter: 'ALL ACCESS CREW',
      customTextRight: 'SUMMER VIBES FEST',
      clipType: 'Metal Hook',
      lanyardDesignStyle: 'repeated',
      textSpacing: 55,
    }
  },

  // ─── Education & Campus ────────────────────────────────
  {
    id: 'edu-oxford-green',
    name: 'Oxford Academic Forest Green',
    category: 'Education',
    gradient: 'from-emerald-600 to-teal-800',
    description: 'Academic forest green with gold-yellow academic serif typography.',
    tags: ['Woven', '20mm', 'University'],
    design: {
      printingMethod: 'Woven',
      lanyardStyle: 'Single Ended',
      width: '20mm',
      lanyardColor: '#065f46',
      customColorCode: '#065f46',
      fontFamily: 'Montserrat',
      fontColor: '#fef08a',
      fontSize: 17,
      customTextLeft: 'OXFORD UNIVERSITY',
      customTextCenter: 'STUDENT UNION',
      customTextRight: 'OXFORD UNIVERSITY',
      clipType: 'Metal Hook',
      lanyardDesignStyle: 'repeated',
      textSpacing: 60,
    }
  },
  {
    id: 'edu-crimson-alumni',
    name: 'Crimson Alumni & Faculty',
    category: 'Education',
    gradient: 'from-red-800 to-rose-950',
    description: 'Classic Ivy League crimson with clean crisp white university title.',
    tags: ['Sublimated', '20mm', 'Alumni'],
    design: {
      printingMethod: 'Sublimated',
      lanyardStyle: 'Single Ended',
      width: '20mm',
      lanyardColor: '#881337',
      customColorCode: '#881337',
      fontFamily: 'Times New Roman',
      fontColor: '#ffffff',
      fontSize: 17,
      customTextLeft: 'HARVARD FACULTY',
      customTextCenter: 'VISITING SCHOLAR',
      customTextRight: 'HARVARD FACULTY',
      clipType: 'Lobster Claw',
      lanyardDesignStyle: 'repeated',
      textSpacing: 65,
    }
  },

  // ─── Healthcare & Medical ──────────────────────────────
  {
    id: 'health-metro-blue',
    name: 'Metro Health Medical Pro',
    category: 'Healthcare',
    gradient: 'from-cyan-500 to-blue-600',
    description: 'Crisp medical cyan with high-visibility doctor & nurse credentials.',
    tags: ['Sublimated', '15mm', 'Hospital'],
    design: {
      printingMethod: 'Sublimated',
      lanyardStyle: 'Single Ended',
      width: '15mm',
      lanyardColor: '#0284c7',
      customColorCode: '#0284c7',
      fontFamily: 'Helvetica',
      fontColor: '#ffffff',
      fontSize: 15,
      customTextLeft: 'METRO HEALTH CLINIC',
      customTextCenter: 'DOCTOR / STAFF',
      customTextRight: 'METRO HEALTH CLINIC',
      clipType: 'Bulldog Clip',
      lanyardDesignStyle: 'repeated',
      textSpacing: 55,
    }
  },
  {
    id: 'health-emergency-red',
    name: 'Emergency Response EMT',
    category: 'Healthcare',
    gradient: 'from-red-600 to-rose-700',
    description: 'High-contrast emergency scarlet with reflective white EMT title.',
    tags: ['Woven', '20mm', 'Emergency'],
    design: {
      printingMethod: 'Woven',
      lanyardStyle: 'Single Ended',
      width: '20mm',
      lanyardColor: '#dc2626',
      customColorCode: '#dc2626',
      fontFamily: 'Arial',
      fontColor: '#ffffff',
      fontSize: 17,
      customTextLeft: 'PARAMEDIC UNIT 04',
      customTextCenter: 'FIRST RESPONDER',
      customTextRight: 'PARAMEDIC UNIT 04',
      clipType: 'Metal Hook',
      lanyardDesignStyle: 'repeated',
      textSpacing: 55,
    }
  },

  // ─── Security & Government ────────────────────────────
  {
    id: 'sec-defense-slate',
    name: 'Federal Security Official',
    category: 'Security',
    gradient: 'from-slate-700 to-slate-900',
    description: 'Deep matte dark slate for government and security credentials.',
    tags: ['Screen Printed', '20mm', 'Official'],
    design: {
      printingMethod: 'Screen Printed',
      lanyardStyle: 'Single Ended',
      width: '20mm',
      lanyardColor: '#1e293b',
      customColorCode: '#1e293b',
      fontFamily: 'Arial',
      fontColor: '#f8fafc',
      fontSize: 16,
      customTextLeft: 'SECURITY OPERATIONS',
      customTextCenter: 'OFFICIAL AGENT',
      customTextRight: 'SECURITY OPERATIONS',
      clipType: 'Metal Hook',
      lanyardDesignStyle: 'repeated',
      textSpacing: 65,
    }
  },

  // ─── Sports & Fitness ──────────────────────────────────
  {
    id: 'sport-crossfit-orange',
    name: 'Athletic Training Blaze',
    category: 'Sports',
    gradient: 'from-orange-500 to-amber-600',
    description: 'Energetic blaze orange with athletic bold typography.',
    tags: ['Sublimated', '20mm', 'Fitness'],
    design: {
      printingMethod: 'Sublimated',
      lanyardStyle: 'Single Ended',
      width: '20mm',
      lanyardColor: '#ea580c',
      customColorCode: '#ea580c',
      fontFamily: 'Oswald',
      fontColor: '#ffffff',
      fontSize: 18,
      customTextLeft: 'CROSSFIT CHAMPIONSHIP',
      customTextCenter: 'ATHLETE // CREW',
      customTextRight: 'CROSSFIT CHAMPIONSHIP',
      clipType: 'Carabiner',
      lanyardDesignStyle: 'repeated',
      textSpacing: 60,
    }
  }
];

export default function TemplatesPanel() {
  const loadPreset = useConfiguratorStore(s => s.loadPreset);

  const handleApplyTemplate = (template: LanyardTemplate) => {
    loadPreset(template.design);
    toast.success(`Applied template "${template.name}"!`);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-white">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-bold text-slate-700 tracking-wider uppercase flex items-center gap-1.5">
            <LayoutTemplate size={14} className="text-indigo-600" />
            Templates
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600">
            {TEMPLATE_LIBRARY.length} TEMPLATES
          </span>
        </div>
        <p className="text-[11px] text-slate-400">Click any template below to apply to canvas</p>
      </div>

      {/* Templates List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {TEMPLATE_LIBRARY.map(template => (
          <div
            key={template.id}
            onClick={() => handleApplyTemplate(template)}
            className="p-3 bg-white hover:bg-indigo-50/40 border border-slate-200 hover:border-indigo-300 rounded-xl cursor-pointer transition shadow-2xs group space-y-2"
          >
            {/* Card Header */}
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${template.gradient} flex items-center justify-center text-white shrink-0 shadow-xs`}>
                <Sparkles size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition">
                    {template.name}
                  </h4>
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-1">{template.description}</p>
              </div>
            </div>

            {/* Real Lanyard Ribbon Preview */}
            <div
              className="h-7 w-full rounded-md flex items-center justify-between px-2.5 text-[10px] font-extrabold truncate border border-black/10 shadow-inner"
              style={{
                backgroundColor: template.design.lanyardColor || '#ffffff',
                color: template.design.fontColor || '#ffffff',
                fontFamily: template.design.fontFamily || 'Montserrat',
              }}
            >
              <span className="truncate drop-shadow-2xs">
                {template.design.customTextLeft || template.name}
              </span>
              <span className="text-[9px] opacity-75 shrink-0 ml-1">
                🪝 {template.design.width || '20mm'}
              </span>
            </div>

            {/* Tags & Action */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                  {template.category}
                </span>
                {template.tags.slice(0, 2).map((tag, idx) => (
                  <span key={idx} className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
              <span className="text-[10px] font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Apply Template →
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
