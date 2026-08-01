import { Settings2, Trash2, ArrowUpToLine, ArrowDownToLine, Copy, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useIdCardDesignerStore } from '../../store/useIdCardDesignerStore';

export default function RightSidebar() {
  const { 
    activeSide, 
    frontElements, 
    backElements, 
    selectedId, 
    updateElement, 
    removeElement,
    bringForward,
    sendBackward,
    addElement,
    cardSettings,
    updateCardSettings
  } = useIdCardDesignerStore();

  const elements = activeSide === 'front' ? frontElements : backElements;
  const selectedElement = elements.find(el => el.id === selectedId);

  const handleDuplicate = () => {
    if (!selectedElement) return;
    const newElement = {
      ...selectedElement,
      id: `${selectedElement.type}_${Date.now()}`,
      x: selectedElement.x + 10,
      y: selectedElement.y + 10,
    };
    addElement(newElement);
  };

  const handleDelete = () => {
    if (!selectedId) return;
    removeElement(selectedId);
  };

  // Render properties based on element type
  const renderProperties = () => {
    if (!selectedElement) {
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Card & Frame Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Orientation</label>
                <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                  <button 
                    onClick={() => updateCardSettings({ orientation: 'portrait', width: 54, height: 86 })}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${cardSettings.orientation === 'portrait' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Portrait
                  </button>
                  <button 
                    onClick={() => updateCardSettings({ orientation: 'landscape', width: 86, height: 54 })}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${cardSettings.orientation === 'landscape' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Landscape
                  </button>
                </div>
              </div>

              {/* Frame Border Customization */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="text-[11px] font-bold text-slate-800 block">Frame & Border Customization</span>
                
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Frame Border Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={cardSettings.borderColor || '#4f46e5'} onChange={(e) => updateCardSettings({ borderColor: e.target.value })} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                    <input type="text" value={cardSettings.borderColor || '#4f46e5'} onChange={(e) => updateCardSettings({ borderColor: e.target.value })} className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1 text-sm text-slate-800 uppercase focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-slate-600">Border Thickness</label>
                    <span className="text-xs font-mono font-bold text-indigo-600">{cardSettings.borderThickness || 0}px</span>
                  </div>
                  <input type="range" min="0" max="10" step="0.5" value={cardSettings.borderThickness || 0} onChange={(e) => updateCardSettings({ borderThickness: Number(e.target.value) })} className="w-full accent-indigo-600 cursor-pointer" />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Lanyard Slot Cutout</label>
                  <select value={cardSettings.slotType || 'oval'} onChange={(e) => updateCardSettings({ slotType: e.target.value })} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-medium">
                    <option value="oval">Oval Slot (Standard Lanyard Clip)</option>
                    <option value="round">Single Round Hole (Swivel Hook)</option>
                    <option value="double">Double Dual Holes (Dual Clips)</option>
                    <option value="none">No Slot Hole</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Width (mm)</label>
                  <input type="number" value={cardSettings.width} onChange={(e) => updateCardSettings({ width: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Height (mm)</label>
                  <input type="number" value={cardSettings.height} onChange={(e) => updateCardSettings({ height: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Background Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={cardSettings.background} onChange={(e) => updateCardSettings({ background: e.target.value })} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                  <input type="text" value={cardSettings.background} onChange={(e) => updateCardSettings({ background: e.target.value })} className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800 uppercase focus:outline-none focus:border-indigo-500 focus:bg-white" />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Material</label>
                <select value={cardSettings.material} onChange={(e) => updateCardSettings({ material: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white">
                  <option value="PVC">PVC (Standard)</option>
                  <option value="Matte">Matte Finish</option>
                  <option value="Glossy">Glossy Finish</option>
                  <option value="Transparent">Transparent</option>
                  <option value="Metal">Metal Finish</option>
                </select>
              </div>
              
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Corner Radius</label>
                <input type="range" min="0" max="30" value={cardSettings.roundedCorners} onChange={(e) => updateCardSettings({ roundedCorners: Number(e.target.value) })} className="w-full accent-indigo-600" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200">
          <div className="flex items-center gap-1">
            <button onClick={() => bringForward(selectedId)} className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors" title="Bring Forward">
              <ArrowUpToLine className="w-4 h-4" />
            </button>
            <button onClick={() => sendBackward(selectedId)} className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors" title="Send Backward">
              <ArrowDownToLine className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleDuplicate} className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors" title="Duplicate">
              <Copy className="w-4 h-4" />
            </button>
            <button onClick={handleDelete} className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors" title="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>



        {selectedElement.type === 'shape' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Fill Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={selectedElement.fill || '#3b82f6'} onChange={(e) => updateElement(selectedId, { fill: e.target.value })} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                <input type="text" value={selectedElement.fill || '#3b82f6'} onChange={(e) => updateElement(selectedId, { fill: e.target.value })} className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800 uppercase focus:outline-none focus:border-indigo-500 focus:bg-white" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Shape Border Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={selectedElement.stroke || '#000000'} onChange={(e) => updateElement(selectedId, { stroke: e.target.value })} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                <input type="text" value={selectedElement.stroke || '#000000'} onChange={(e) => updateElement(selectedId, { stroke: e.target.value })} className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800 uppercase focus:outline-none focus:border-indigo-500 focus:bg-white" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-600">Border Thickness</label>
                <span className="text-xs font-mono font-bold text-indigo-600">{selectedElement.strokeWidth || 0}px</span>
              </div>
              <input type="range" min="0" max="20" step="1" value={selectedElement.strokeWidth || 0} onChange={(e) => updateElement(selectedId, { strokeWidth: Number(e.target.value) })} className="w-full accent-indigo-600 cursor-pointer" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-600">Opacity</label>
                <span className="text-xs font-mono font-bold text-indigo-600">{Math.round((selectedElement.opacity || 1) * 100)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.05" value={selectedElement.opacity || 1} onChange={(e) => updateElement(selectedId, { opacity: Number(e.target.value) })} className="w-full accent-indigo-600 cursor-pointer" />
            </div>
          </div>
        )}

        {selectedElement.type === 'qrcode' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">QR Value / URL</label>
              <input type="text" value={selectedElement.qrValue} onChange={(e) => updateElement(selectedId, { qrValue: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Foreground Color</label>
              <input type="color" value={selectedElement.fill} onChange={(e) => updateElement(selectedId, { fill: e.target.value })} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer block" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Background Color</label>
              <input type="color" value={selectedElement.background} onChange={(e) => updateElement(selectedId, { background: e.target.value })} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer block" />
            </div>
          </div>
        )}
        {selectedElement.type === 'text' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Text Content</label>
              <textarea
                value={selectedElement.text || ''}
                onChange={(e) => updateElement(selectedId, { text: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white resize-y min-h-[60px]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Font Family</label>
              <select
                value={selectedElement.fontFamily || 'Inter'}
                onChange={(e) => updateElement(selectedId, { fontFamily: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
              >
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Playfair Display">Playfair Display</option>
                <option value="Fira Code">Fira Code</option>
                <option value="Outfit">Outfit</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Font Size</label>
                <input
                  type="number"
                  value={selectedElement.fontSize || 14}
                  onChange={(e) => updateElement(selectedId, { fontSize: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Color</label>
                <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg bg-slate-50 px-2 py-1.5">
                  <input
                    type="color"
                    value={selectedElement.fill || '#000000'}
                    onChange={(e) => updateElement(selectedId, { fill: e.target.value })}
                    className="w-6 h-6 rounded border-none bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedElement.fill || '#000000'}
                    onChange={(e) => updateElement(selectedId, { fill: e.target.value })}
                    className="w-full bg-transparent border-none text-xs text-slate-800 focus:outline-none uppercase"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Text Style</label>
              <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-200 gap-1">
                <button
                  onClick={() => updateElement(selectedId, { bold: !selectedElement.bold })}
                  className={`flex-1 py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${selectedElement.bold ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
                >
                  B
                </button>
                <button
                  onClick={() => updateElement(selectedId, { italic: !selectedElement.italic })}
                  className={`flex-1 py-1.5 text-xs italic rounded transition-all cursor-pointer ${selectedElement.italic ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
                >
                  I
                </button>
                <button
                  onClick={() => updateElement(selectedId, { underline: !selectedElement.underline })}
                  className={`flex-1 py-1.5 text-xs underline rounded transition-all cursor-pointer ${selectedElement.underline ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
                >
                  U
                </button>
                <button
                  onClick={() => updateElement(selectedId, { isStrikethrough: !selectedElement.isStrikethrough })}
                  className={`flex-1 py-1.5 text-xs line-through rounded transition-all cursor-pointer ${selectedElement.isStrikethrough ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
                >
                  S
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Alignment</label>
              <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-200 gap-1">
                <button
                  onClick={() => updateElement(selectedId, { align: 'left' })}
                  className={`flex-1 py-1.5 text-xs rounded transition-all cursor-pointer ${selectedElement.align === 'left' || !selectedElement.align ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
                >
                  Left
                </button>
                <button
                  onClick={() => updateElement(selectedId, { align: 'center' })}
                  className={`flex-1 py-1.5 text-xs rounded transition-all cursor-pointer ${selectedElement.align === 'center' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
                >
                  Center
                </button>
                <button
                  onClick={() => updateElement(selectedId, { align: 'right' })}
                  className={`flex-1 py-1.5 text-xs rounded transition-all cursor-pointer ${selectedElement.align === 'right' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
                >
                  Right
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-medium text-slate-600">Letter Spacing</label>
                  <span className="text-[10px] font-mono font-bold text-indigo-600">{selectedElement.letterSpacing || 0}px</span>
                </div>
                <input
                  type="range"
                  min="-5"
                  max="15"
                  step="1"
                  value={selectedElement.letterSpacing || 0}
                  onChange={(e) => updateElement(selectedId, { letterSpacing: Number(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer h-1 rounded bg-slate-200"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-medium text-slate-600">Line Height</label>
                  <span className="text-[10px] font-mono font-bold text-indigo-600">{selectedElement.lineHeight || 1}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={selectedElement.lineHeight || 1}
                  onChange={(e) => updateElement(selectedId, { lineHeight: Number(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer h-1 rounded bg-slate-200"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-600">Opacity</label>
                <span className="text-xs font-mono font-bold text-indigo-600">{Math.round((selectedElement.opacity || 1) * 100)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.05" value={selectedElement.opacity || 1} onChange={(e) => updateElement(selectedId, { opacity: Number(e.target.value) })} className="w-full accent-indigo-600 cursor-pointer" />
            </div>
          </div>
        )}

      </div>
    );
  };

  return (
    <div className="w-[300px] shrink-0 bg-white border-l border-slate-200 p-5 overflow-y-auto custom-scrollbar z-10 text-slate-800">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-4">
        <Settings2 className="w-5 h-5 text-indigo-600" />
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Properties</h2>
      </div>
      
      {renderProperties()}
    </div>
  );
}
