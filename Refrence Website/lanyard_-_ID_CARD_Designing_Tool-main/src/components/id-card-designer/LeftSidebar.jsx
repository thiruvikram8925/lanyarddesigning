import { useState } from 'react';
import { 
  Pencil, Shapes, Layers, UploadCloud, Frame,
  Square, Circle, Triangle, Minus, Star, Sparkles, Heart, Shield, Bookmark, ArrowRight, MessageSquare, Hexagon, Octagon, Disc, Diamond,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';
import { useIdCardDesignerStore } from '../../store/useIdCardDesignerStore';

const TABS = [
  { id: 'frames', icon: Frame, label: 'Frames' },
  { id: 'text', icon: Pencil, label: 'Edit' },
  { id: 'shapes', icon: Shapes, label: 'Shapes' },
  { id: 'uploads', icon: UploadCloud, label: 'Uploads' },
  { id: 'layers', icon: Layers, label: 'Layers' },
];

const SHAPES_LIST = [
  { type: 'rect', label: 'Rectangle', icon: Square },
  { type: 'rounded_rect', label: 'Rounded Rect', icon: Square },
  { type: 'circle', label: 'Circle', icon: Circle },
  { type: 'ellipse', label: 'Ellipse', icon: Circle },
  { type: 'triangle', label: 'Triangle', icon: Triangle },
  { type: 'diamond', label: 'Diamond', icon: Diamond },
  { type: 'pentagon', label: 'Pentagon', icon: Hexagon },
  { type: 'hexagon', label: 'Hexagon', icon: Hexagon },
  { type: 'octagon', label: 'Octagon', icon: Octagon },
  { type: 'star', label: '5-Point Star', icon: Star },
  { type: 'burst_star', label: 'Burst Star', icon: Sparkles },
  { type: 'heart', label: 'Heart', icon: Heart },
  { type: 'shield', label: 'Shield Badge', icon: Shield },
  { type: 'badge', label: 'Ribbon Badge', icon: Bookmark },
  { type: 'ring', label: 'Ring / Donut', icon: Disc },
  { type: 'line', label: 'Line Divider', icon: Minus },
  { type: 'arrow', label: 'Arrow', icon: ArrowRight },
  { type: 'speech', label: 'Speech Bubble', icon: MessageSquare },
];

const ID_CARD_FRAMES = [
  {
    id: 'corporate',
    name: 'Modern Corporate Frame',
    tag: 'Blue Double Border',
    borderColor: '#2563eb',
    borderThickness: 3,
    roundedCorners: 12,
    slotType: 'oval',
    bg: '#ffffff',
    elements: [
      { id: 'f_bg_1', type: 'shape', shapeType: 'rect', x: 0, y: 0, width: 204, height: 65, fill: '#1e40af', opacity: 1 },
      { id: 'f_title_1', type: 'text', text: 'CORPORATE ID', x: 20, y: 30, fontSize: 16, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', opacity: 1 },
      { id: 'f_sub_1', type: 'text', text: 'STAFF MEMBER', x: 20, y: 50, fontSize: 10, fontWeight: '600', fontFamily: 'Inter', fill: '#93c5fd', opacity: 1 },
      { id: 'f_name_1', type: 'text', text: 'Alex Morgan', x: 20, y: 150, fontSize: 18, fontWeight: 'bold', fontFamily: 'Inter', fill: '#1e293b', opacity: 1 },
      { id: 'f_role_1', type: 'text', text: 'Senior Software Engineer', x: 20, y: 175, fontSize: 11, fontWeight: 'normal', fontFamily: 'Inter', fill: '#64748b', opacity: 1 },
      { id: 'f_id_1', type: 'text', text: 'ID: EMP-84920', x: 20, y: 220, fontSize: 10, fontWeight: 'bold', fontFamily: 'Inter', fill: '#2563eb', opacity: 1 },
      { id: 'f_qr_1', type: 'qrcode', x: 130, y: 210, width: 55, height: 55, qrValue: 'https://company.com/verify/84920', fill: '#1e40af', background: '#ffffff' }
    ]
  },
  {
    id: 'executive',
    name: 'Executive Gold Frame',
    tag: 'Gold Luxury Border',
    borderColor: '#d97706',
    borderThickness: 4,
    roundedCorners: 14,
    slotType: 'double',
    bg: '#fafaf9',
    elements: [
      { id: 'f_bg_2', type: 'shape', shapeType: 'rect', x: 0, y: 0, width: 204, height: 75, fill: '#0f172a', opacity: 1 },
      { id: 'f_gold_bar', type: 'shape', shapeType: 'rect', x: 0, y: 72, width: 204, height: 4, fill: '#d97706', opacity: 1 },
      { id: 'f_title_2', type: 'text', text: 'EXECUTIVE PASS', x: 20, y: 35, fontSize: 16, fontWeight: 'bold', fontFamily: 'Inter', fill: '#fbbf24', opacity: 1 },
      { id: 'f_name_2', type: 'text', text: 'Victoria Sterling', x: 20, y: 150, fontSize: 18, fontWeight: 'bold', fontFamily: 'Inter', fill: '#0f172a', opacity: 1 },
      { id: 'f_role_2', type: 'text', text: 'Chief Executive Officer', x: 20, y: 175, fontSize: 11, fontWeight: '600', fontFamily: 'Inter', fill: '#d97706', opacity: 1 },
      { id: 'f_qr_2', type: 'qrcode', x: 20, y: 215, width: 50, height: 50, qrValue: 'https://executive.com/vip', fill: '#0f172a', background: '#ffffff' }
    ]
  },
  {
    id: 'tech',
    name: 'Tech Security Frame',
    tag: 'Dark Stealth & Red Line',
    borderColor: '#0f172a',
    borderThickness: 5,
    roundedCorners: 6,
    slotType: 'round',
    bg: '#f8fafc',
    elements: [
      { id: 'f_bg_3', type: 'shape', shapeType: 'rect', x: 0, y: 0, width: 204, height: 12, fill: '#dc2626', opacity: 1 },
      { id: 'f_title_3', type: 'text', text: 'SECURITY CLEARANCE', x: 15, y: 25, fontSize: 12, fontWeight: 'bold', fontFamily: 'Inter', fill: '#dc2626', opacity: 1 },
      { id: 'f_name_3', type: 'text', text: 'David Miller', x: 15, y: 140, fontSize: 18, fontWeight: 'bold', fontFamily: 'Inter', fill: '#0f172a', opacity: 1 },
      { id: 'f_role_3', type: 'text', text: 'Cybersecurity Specialist', x: 15, y: 165, fontSize: 11, fontWeight: 'normal', fontFamily: 'Inter', fill: '#475569', opacity: 1 },
      { id: 'f_badge_3', type: 'text', text: 'LEVEL 5 - FULL ACCESS', x: 15, y: 230, fontSize: 10, fontWeight: 'bold', fontFamily: 'Inter', fill: '#dc2626', opacity: 1 },
      { id: 'f_qr_3', type: 'qrcode', x: 130, y: 200, width: 55, height: 55, qrValue: 'https://security.com/key/991', fill: '#0f172a', background: '#ffffff' }
    ]
  },
  {
    id: 'creative',
    name: 'Creative Gradient Frame',
    tag: 'Indigo & Violet Header',
    borderColor: '#8b5cf6',
    borderThickness: 3,
    roundedCorners: 16,
    slotType: 'oval',
    bg: '#ffffff',
    elements: [
      { id: 'f_bg_4', type: 'shape', shapeType: 'rect', x: 0, y: 0, width: 204, height: 80, fill: '#6366f1', opacity: 1 },
      { id: 'f_title_4', type: 'text', text: 'CREATIVE STUDIO', x: 20, y: 35, fontSize: 15, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', opacity: 1 },
      { id: 'f_sub_4', type: 'text', text: 'VIP ALL ACCESS', x: 20, y: 55, fontSize: 10, fontWeight: '600', fontFamily: 'Inter', fill: '#c7d2fe', opacity: 1 },
      { id: 'f_name_4', type: 'text', text: 'Sophia Chen', x: 20, y: 150, fontSize: 18, fontWeight: 'bold', fontFamily: 'Inter', fill: '#312e81', opacity: 1 },
      { id: 'f_role_4', type: 'text', text: 'Lead UI/UX Designer', x: 20, y: 175, fontSize: 11, fontWeight: 'normal', fontFamily: 'Inter', fill: '#6366f1', opacity: 1 },
      { id: 'f_qr_4', type: 'qrcode', x: 130, y: 210, width: 50, height: 50, qrValue: 'https://creative.design/sophia', fill: '#4338ca', background: '#ffffff' }
    ]
  },
  {
    id: 'classic',
    name: 'Minimalist Classic Frame',
    tag: 'Clean Thin Border',
    borderColor: '#94a3b8',
    borderThickness: 1.5,
    roundedCorners: 8,
    slotType: 'oval',
    bg: '#ffffff',
    elements: [
      { id: 'f_title_5', type: 'text', text: 'IDENTIFICATION CARD', x: 20, y: 25, fontSize: 12, fontWeight: 'bold', fontFamily: 'Inter', fill: '#475569', opacity: 1 },
      { id: 'f_line_5', type: 'shape', shapeType: 'rect', x: 20, y: 45, width: 164, height: 1.5, fill: '#cbd5e1', opacity: 1 },
      { id: 'f_name_5', type: 'text', text: 'Robert Taylor', x: 20, y: 140, fontSize: 18, fontWeight: 'bold', fontFamily: 'Inter', fill: '#1e293b', opacity: 1 },
      { id: 'f_role_5', type: 'text', text: 'Operations Manager', x: 20, y: 165, fontSize: 11, fontWeight: 'normal', fontFamily: 'Inter', fill: '#64748b', opacity: 1 },
      { id: 'f_id_5', type: 'text', text: 'EMP ID: 104928', x: 20, y: 220, fontSize: 10, fontWeight: 'semibold', fontFamily: 'Inter', fill: '#475569', opacity: 1 },
      { id: 'f_qr_5', type: 'qrcode', x: 135, y: 200, width: 50, height: 50, qrValue: 'https://company.org/id/104928', fill: '#0f172a', background: '#ffffff' }
    ]
  },
  {
    id: 'healthcare',
    name: 'Healthcare Emerald Frame',
    tag: 'Medical Green Border',
    borderColor: '#059669',
    borderThickness: 3.5,
    roundedCorners: 12,
    slotType: 'round',
    bg: '#f0fdf4',
    elements: [
      { id: 'f_bg_6', type: 'shape', shapeType: 'rect', x: 0, y: 0, width: 204, height: 60, fill: '#047857', opacity: 1 },
      { id: 'f_title_6', type: 'text', text: 'CITY HOSPITAL', x: 20, y: 25, fontSize: 15, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', opacity: 1 },
      { id: 'f_sub_6', type: 'text', text: 'MEDICAL STAFF', x: 20, y: 45, fontSize: 9, fontWeight: 'bold', fontFamily: 'Inter', fill: '#a7f3d0', opacity: 1 },
      { id: 'f_name_6', type: 'text', text: 'Dr. Sarah Jenkins', x: 20, y: 145, fontSize: 17, fontWeight: 'bold', fontFamily: 'Inter', fill: '#064e3b', opacity: 1 },
      { id: 'f_role_6', type: 'text', text: 'Chief Medical Officer', x: 20, y: 170, fontSize: 11, fontWeight: '600', fontFamily: 'Inter', fill: '#059669', opacity: 1 },
      { id: 'f_qr_6', type: 'qrcode', x: 130, y: 205, width: 50, height: 50, qrValue: 'https://hospital.org/dr-jenkins', fill: '#047857', background: '#ffffff' }
    ]
  },
  {
    id: 'university',
    name: 'University Crimson Frame',
    tag: 'Academic Crimson Header',
    borderColor: '#b91c1c',
    borderThickness: 4,
    roundedCorners: 10,
    slotType: 'oval',
    bg: '#ffffff',
    elements: [
      { id: 'f_bg_7', type: 'shape', shapeType: 'rect', x: 0, y: 0, width: 204, height: 70, fill: '#7f1d1d', opacity: 1 },
      { id: 'f_title_7', type: 'text', text: 'HARBOR UNIVERSITY', x: 15, y: 30, fontSize: 13, fontWeight: 'bold', fontFamily: 'Inter', fill: '#fef08a', opacity: 1 },
      { id: 'f_sub_7', type: 'text', text: 'FACULTY MEMBER', x: 15, y: 50, fontSize: 9, fontWeight: 'semibold', fontFamily: 'Inter', fill: '#fca5a5', opacity: 1 },
      { id: 'f_name_7', type: 'text', text: 'Prof. Marcus Vance', x: 15, y: 145, fontSize: 17, fontWeight: 'bold', fontFamily: 'Inter', fill: '#7f1d1d', opacity: 1 },
      { id: 'f_role_7', type: 'text', text: 'Department of Physics', x: 15, y: 170, fontSize: 11, fontWeight: 'normal', fontFamily: 'Inter', fill: '#450a0a', opacity: 1 },
      { id: 'f_qr_7', type: 'qrcode', x: 130, y: 205, width: 50, height: 50, qrValue: 'https://univ.edu/faculty/vance', fill: '#7f1d1d', background: '#ffffff' }
    ]
  },
  {
    id: 'cyberpunk',
    name: 'Dark Cyberpunk Frame',
    tag: 'Electric Cyan & Dark Theme',
    borderColor: '#06b6d4',
    borderThickness: 4,
    roundedCorners: 4,
    slotType: 'double',
    bg: '#090d16',
    elements: [
      { id: 'f_bg_8', type: 'shape', shapeType: 'rect', x: 0, y: 0, width: 204, height: 10, fill: '#06b6d4', opacity: 1 },
      { id: 'f_title_8', type: 'text', text: 'NEXUS LABS // ACCESS', x: 15, y: 25, fontSize: 12, fontWeight: 'bold', fontFamily: 'Inter', fill: '#06b6d4', opacity: 1 },
      { id: 'f_name_8', type: 'text', text: 'Kaelen Voss', x: 15, y: 140, fontSize: 18, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', opacity: 1 },
      { id: 'f_role_8', type: 'text', text: 'AI Systems Architect', x: 15, y: 165, fontSize: 11, fontWeight: 'normal', fontFamily: 'Inter', fill: '#22d3ee', opacity: 1 },
      { id: 'f_qr_8', type: 'qrcode', x: 130, y: 200, width: 55, height: 55, qrValue: 'https://nexus.ai/voss', fill: '#06b6d4', background: '#090d16' }
    ]
  },
  {
    id: 'vip',
    name: 'VIP Event Pass Frame',
    tag: 'Amber Sunburst Badge',
    borderColor: '#f59e0b',
    borderThickness: 4,
    roundedCorners: 18,
    slotType: 'oval',
    bg: '#fffbeb',
    elements: [
      { id: 'f_bg_9', type: 'shape', shapeType: 'rect', x: 0, y: 0, width: 204, height: 65, fill: '#d97706', opacity: 1 },
      { id: 'f_title_9', type: 'text', text: 'GLOBAL SUMMIT 2026', x: 15, y: 25, fontSize: 13, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', opacity: 1 },
      { id: 'f_sub_9', type: 'text', text: 'VIP DELEGATE', x: 15, y: 45, fontSize: 10, fontWeight: 'bold', fontFamily: 'Inter', fill: '#fef3c7', opacity: 1 },
      { id: 'f_name_9', type: 'text', text: 'Liam O’Connor', x: 15, y: 145, fontSize: 18, fontWeight: 'bold', fontFamily: 'Inter', fill: '#78350f', opacity: 1 },
      { id: 'f_role_9', type: 'text', text: 'Keynote Speaker', x: 15, y: 170, fontSize: 11, fontWeight: 'semibold', fontFamily: 'Inter', fill: '#d97706', opacity: 1 },
      { id: 'f_qr_9', type: 'qrcode', x: 130, y: 205, width: 50, height: 50, qrValue: 'https://summit.com/vip/liam', fill: '#b45309', background: '#ffffff' }
    ]
  },
  {
    id: 'glass',
    name: 'Frosted Glass Frame',
    tag: 'Sky Blue Modern Frame',
    borderColor: '#38bdf8',
    borderThickness: 2.5,
    roundedCorners: 20,
    slotType: 'round',
    bg: '#f0f9ff',
    elements: [
      { id: 'f_bg_10', type: 'shape', shapeType: 'rect', x: 0, y: 0, width: 204, height: 55, fill: '#0284c7', opacity: 1 },
      { id: 'f_title_10', type: 'text', text: 'AERO TECH', x: 20, y: 25, fontSize: 15, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', opacity: 1 },
      { id: 'f_name_10', type: 'text', text: 'Emma Watson', x: 20, y: 140, fontSize: 18, fontWeight: 'bold', fontFamily: 'Inter', fill: '#0369a1', opacity: 1 },
      { id: 'f_role_10', type: 'text', text: 'Product Manager', x: 20, y: 165, fontSize: 11, fontWeight: 'normal', fontFamily: 'Inter', fill: '#0284c7', opacity: 1 },
      { id: 'f_qr_10', type: 'qrcode', x: 130, y: 200, width: 50, height: 50, qrValue: 'https://aerotech.com/emma', fill: '#0369a1', background: '#ffffff' }
    ]
  }
];

export default function LeftSidebar() {
  const [activeTab, setActiveTab] = useState('frames');
  const addElement = useIdCardDesignerStore(s => s.addElement);
  const updateCardSettings = useIdCardDesignerStore(s => s.updateCardSettings);
  const selectedId = useIdCardDesignerStore(s => s.selectedId);
  const frontElements = useIdCardDesignerStore(s => s.frontElements);
  const backElements = useIdCardDesignerStore(s => s.backElements);
  const activeSide = useIdCardDesignerStore(s => s.activeSide);
  const updateElement = useIdCardDesignerStore(s => s.updateElement);

  const currentElements = activeSide === 'front' ? (frontElements || []) : (backElements || []);
  const selectedElement = currentElements.find(el => el && el.id === selectedId);

  const handleApplyFrameTemplate = (tpl) => {
    updateCardSettings({
      borderColor: tpl.borderColor,
      borderThickness: tpl.borderThickness,
      roundedCorners: tpl.roundedCorners,
      slotType: tpl.slotType,
      background: tpl.bg,
      frameStyle: tpl.id,
    });
    
    useIdCardDesignerStore.setState({
      frontElements: tpl.elements || [],
      backElements: tpl.backElements || [
        { id: 'b_hdr', type: 'shape', shapeType: 'rect', x: 0, y: 0, width: 204, height: 45, fill: tpl.borderColor || '#1e40af', opacity: 1 },
        { id: 'b_t1', type: 'text', text: 'TERMS & CONDITIONS', x: 20, y: 18, fontSize: 11, fontWeight: 'bold', fontFamily: 'Inter', fill: '#ffffff', opacity: 1 },
        { id: 'b_t2', type: 'text', text: '1. Property of issuing organization.\n2. Must be worn at all times on premises.\n3. Return if found to security office.', x: 20, y: 60, fontSize: 8, fontWeight: 'normal', fontFamily: 'Inter', fill: '#475569', opacity: 1 },
        { id: 'b_t3', type: 'text', text: 'Emergency Contact: +1 (800) 555-0199', x: 20, y: 150, fontSize: 9, fontWeight: 'semibold', fontFamily: 'Inter', fill: tpl.borderColor || '#1e40af', opacity: 1 },
        { id: 'b_qr', type: 'qrcode', x: 75, y: 195, width: 55, height: 55, qrValue: 'https://verify-id.org/return', fill: tpl.borderColor || '#1e40af', background: '#ffffff' }
      ],
      selectedId: null,
      activeSide: 'front'
    });
  };

  const handleAddText = (type) => {
    let fontSize = 16;
    let fontWeight = 'normal';
    let text = 'Add Text';
    
    if (type === 'heading') {
      fontSize = 24;
      fontWeight = 'bold';
      text = 'Heading';
    } else if (type === 'subheading') {
      fontSize = 18;
      fontWeight = '600';
      text = 'Subheading';
    } else if (type === 'body') {
      fontSize = 12;
      text = 'Body Text';
    }

    addElement({
      id: `text_${Date.now()}`,
      type: 'text',
      x: 20,
      y: 20,
      text,
      fontSize,
      fontWeight,
      fontFamily: 'Inter',
      fill: '#000000',
      opacity: 1,
    });
  };

  const handleAddShape = (shapeType) => {
    addElement({
      id: `shape_${Date.now()}`,
      type: 'shape',
      shapeType,
      x: 20,
      y: 20,
      width: 50,
      height: 50,
      fill: '#ffffff',
      stroke: '#000000',
      strokeWidth: 2,
      opacity: 1,
    });
  };

  const handleAddQR = () => {
    addElement({
      id: `qr_${Date.now()}`,
      type: 'qrcode',
      x: 20,
      y: 20,
      width: 50,
      height: 50,
      qrValue: 'https://example.com',
      fill: '#000000',
      background: '#ffffff',
    });
  };

  return (
    <div className="w-[340px] shrink-0 bg-white border-r border-slate-200 flex h-full z-10 text-slate-800">
      {/* Tab Navigation */}
      <div className="w-[72px] shrink-0 bg-slate-50 border-r border-slate-200 flex flex-col items-center py-4 gap-2">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 w-14 h-16 rounded-xl justify-center transition-all cursor-pointer ${
                isActive 
                  ? 'bg-white text-indigo-600 shadow-xs border border-slate-200 font-bold' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
        {activeTab === 'frames' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">10 ID Card Frames</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">New Module</span>
            </div>
            <div className="space-y-3">
              {ID_CARD_FRAMES.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => handleApplyFrameTemplate(tpl)}
                  className="w-full text-left p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer flex flex-col gap-2 group hover:border-indigo-500 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{tpl.name}</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">{tpl.tag}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" style={{ backgroundColor: tpl.borderColor }} />
                    <span className="text-[11px] text-slate-500 font-medium truncate">Border: {tpl.borderThickness}px • Corner: {tpl.roundedCorners}px • Slot: {tpl.slotType}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'text' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Add New Text</h3>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => handleAddText('heading')}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all text-base font-bold text-slate-800 cursor-pointer"
                >
                  + Add Heading
                </button>
                <button 
                  onClick={() => handleAddText('subheading')}
                  className="w-full text-left px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all text-sm font-semibold text-slate-800 cursor-pointer"
                >
                  + Add Subheading
                </button>
                <button 
                  onClick={() => handleAddText('body')}
                  className="w-full text-left px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all text-xs text-slate-700 cursor-pointer"
                >
                  + Add Body Text
                </button>
              </div>
            </div>

            <div className="w-full h-px bg-slate-200" />

            {selectedElement && selectedElement.type === 'text' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Text Customization</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">Selected</span>
                </div>

                {/* Text Content Input */}
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Text Content</label>
                  <textarea 
                    value={selectedElement.text} 
                    onChange={(e) => updateElement(selectedId, { text: e.target.value })} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white min-h-[60px]" 
                  />
                </div>

                {/* Font Color */}
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Text Color</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={selectedElement.fill || '#000000'} 
                      onChange={(e) => updateElement(selectedId, { fill: e.target.value })} 
                      className="w-8 h-8 rounded-lg border-none bg-transparent cursor-pointer" 
                    />
                    <input 
                      type="text" 
                      value={selectedElement.fill || '#000000'} 
                      onChange={(e) => updateElement(selectedId, { fill: e.target.value })} 
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm text-slate-800 uppercase focus:outline-none focus:border-indigo-500 focus:bg-white" 
                    />
                  </div>
                </div>

                {/* Font Family Dropdown */}
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Font Family</label>
                  <select 
                    value={selectedElement.fontFamily || 'Inter'} 
                    onChange={(e) => updateElement(selectedId, { fontFamily: e.target.value })} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
                  >
                    <option value="Inter">Inter (Clean Modern)</option>
                    <option value="Roboto">Roboto (Standard)</option>
                    <option value="Outfit">Outfit (Geometric)</option>
                    <option value="Montserrat">Montserrat (Corporate)</option>
                    <option value="Poppins">Poppins (Friendly)</option>
                    <option value="Playfair Display">Playfair Display (Serif)</option>
                    <option value="Oswald">Oswald (Bold Condensed)</option>
                    <option value="Courier Prime">Courier Prime (Monospace)</option>
                  </select>
                </div>

                {/* Font Size Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-slate-600">Font Size</label>
                    <span className="text-xs font-mono font-bold text-indigo-600">{Math.round(selectedElement.fontSize || 14)}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="8" 
                    max="72" 
                    step="1" 
                    value={selectedElement.fontSize || 14} 
                    onChange={(e) => updateElement(selectedId, { fontSize: Number(e.target.value) })} 
                    className="w-full accent-indigo-600 cursor-pointer" 
                  />
                </div>

                {/* Font Formatting Toggles (Bold, Slanted/Italic, Underline) */}
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1.5">Style & Slanting</label>
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => updateElement(selectedId, { isBold: !selectedElement.isBold })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        selectedElement.isBold || selectedElement.fontWeight === 'bold' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900 bg-white'
                      }`}
                      title="Bold"
                    >
                      <Bold className="w-3.5 h-3.5" />
                      <span>Bold</span>
                    </button>
                    
                    <button
                      onClick={() => updateElement(selectedId, { isItalic: !selectedElement.isItalic })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        selectedElement.isItalic ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900 bg-white'
                      }`}
                      title="Slanted / Italic"
                    >
                      <Italic className="w-3.5 h-3.5" />
                      <span>Slant</span>
                    </button>

                    <button
                      onClick={() => updateElement(selectedId, { isUnderline: !selectedElement.isUnderline })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        selectedElement.isUnderline ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900 bg-white'
                      }`}
                      title="Underline"
                    >
                      <Underline className="w-3.5 h-3.5" />
                      <span>Under</span>
                    </button>
                  </div>
                </div>

                {/* Text Alignment */}
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1.5">Alignment</label>
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => updateElement(selectedId, { align: 'left' })}
                      className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                        (selectedElement.align || 'left') === 'left' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900 bg-white'
                      }`}
                      title="Align Left"
                    >
                      <AlignLeft className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => updateElement(selectedId, { align: 'center' })}
                      className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                        selectedElement.align === 'center' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900 bg-white'
                      }`}
                      title="Align Center"
                    >
                      <AlignCenter className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => updateElement(selectedId, { align: 'right' })}
                      className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                        selectedElement.align === 'right' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900 bg-white'
                      }`}
                      title="Align Right"
                    >
                      <AlignRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-2">
                <p className="text-xs font-semibold text-slate-600">Select any text on the card to edit its color, font, bold, slanting & alignment live.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'shapes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">18 Vector Shapes</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">18 Available</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2.5">
              {SHAPES_LIST.map((shape) => {
                const Icon = shape.icon;
                return (
                  <button
                    key={shape.type}
                    onClick={() => handleAddShape(shape.type)}
                    className="flex flex-col items-center justify-center p-3 aspect-square bg-slate-50 hover:bg-indigo-50/70 hover:border-indigo-400 rounded-2xl border border-slate-200 transition-all cursor-pointer group shadow-2xs"
                    title={shape.label}
                  >
                    <Icon className="w-6 h-6 text-slate-600 group-hover:text-indigo-600 group-hover:scale-110 transition-transform mb-1.5" />
                    <span className="text-[9px] font-bold text-slate-600 group-hover:text-indigo-600 text-center truncate max-w-full leading-tight">
                      {shape.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {(activeTab === 'uploads' || activeTab === 'layers') && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
            <p className="text-sm">Feature coming soon</p>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
