
import React, { useState, useEffect, useMemo } from 'react';
import {
  Trash2, Save, Eraser, Paintbrush,
  CheckCircle2, Terminal, Palette,
  Layers, Download, Database, Monitor,
  History, Cpu,
  ChevronRight,
  Sparkles, Zap
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { COLORS, ROW_SIZE } from './constants';
import { ColorOption, SavedLayout } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const InventorySlot: React.FC<{
  index: number;
  selectedColor?: ColorOption;
  onClick: () => void;
  onRightClick: (e: React.MouseEvent) => void;
}> = ({ index, selectedColor, onClick, onRightClick }) => {
  return (
    <div
      onClick={onClick}
      onContextMenu={onRightClick}
      className={cn(
        "pro-slot group relative overflow-hidden",
        selectedColor && "active-border"
      )}
    >
      {selectedColor ? (
        <div
          className={cn(
            "absolute inset-0.5 rounded-[4px] border border-black/20 flex items-center justify-center overflow-hidden shadow-inner",
            selectedColor.bgClass
          )}
          style={{
            backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />
          <span className="text-white text-base font-mc mc-text-shadow select-none font-bold relative z-10">
            {index}
          </span>
        </div>
      ) : (
        <span
          className="text-zinc-700 text-[10px] font-mono select-none font-bold group-hover:text-zinc-400 transition-colors"
        >
          {index}
        </span>
      )}
    </div>
  );
};

type Tool = 'paint' | 'erase' | 'bucket';
type ExportTab = 'configuracion' | 'analisis';

export default function App() {
  const [activeColor, setActiveColor] = useState<ColorOption>(COLORS[0]);
  const [chestRows, setChestRows] = useState(6);
  const [selectedSlots, setSelectedSlots] = useState<Record<number, string>>({});
  const [savedLayouts, setSavedLayouts] = useState<SavedLayout[]>([]);
  const [activeTool, setActiveTool] = useState<Tool>('paint');
  const [activeExportTab, setActiveExportTab] = useState<ExportTab>('configuracion');
  const [showNotification, setShowNotification] = useState<string | null>(null);

  const [dmMaterial, setDmMaterial] = useState('BLACK_STAINED_GLASS_PANE');
  const [dmSelectedColors, setDmSelectedColors] = useState<string[]>([]);
  const [dmItemKey, setDmItemKey] = useState('borde_decorativo');

  useEffect(() => {
    const saved = localStorage.getItem('gui_master_studio_v4');
    if (saved) setSavedLayouts(JSON.parse(saved));
  }, []);

  const notify = (msg: string) => {
    setShowNotification(msg);
    setTimeout(() => setShowNotification(null), 2500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      notify('¡CÓDIGO COPIADO!');
    });
  };

  const usedColorIds = useMemo(() => {
    return Array.from(new Set(Object.values(selectedSlots)));
  }, [selectedSlots]);

  const handleBucketFill = (index: number) => {
    const targetColorId = selectedSlots[index];
    const newColorId = activeTool === 'bucket' ? activeColor.id : undefined;

    const newSlots = { ...selectedSlots };
    for (let i = 0; i < chestRows * ROW_SIZE; i++) {
      if (selectedSlots[i] === targetColorId) {
        if (newColorId) newSlots[i] = newColorId;
        else delete newSlots[i];
      }
    }
    setSelectedSlots(newSlots);
  };

  const handleAction = (index: number) => {
    if (activeTool === 'bucket') {
      handleBucketFill(index);
      return;
    }
    if (activeTool === 'erase') {
      setSelectedSlots(prev => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    } else if (activeTool === 'paint') {
      setSelectedSlots(prev => ({ ...prev, [index]: activeColor.id }));
    }
  };

  const saveLayout = () => {
    const name = prompt('Identificador del Proyecto:', `Draft_${new Date().getHours()}${new Date().getMinutes()}`);
    if (!name) return;
    const newLayout = { id: crypto.randomUUID(), name, slots: { ...selectedSlots }, rows: chestRows, timestamp: Date.now() };
    const updated = [...savedLayouts, newLayout];
    setSavedLayouts(updated);
    localStorage.setItem('gui_master_studio_v4', JSON.stringify(updated));
    notify('PROYECTO ARCHIVADO');
  };

  const colorGroups = useMemo(() => {
    const groups: Record<string, number[]> = {};
    COLORS.forEach(c => {
      groups[c.id] = Object.entries(selectedSlots)
        .filter(([_, cid]) => cid === c.id)
        .map(([idx]) => Number(idx))
        .sort((a, b) => a - b);
    });
    return groups;
  }, [selectedSlots]);

  const deluxeMenusYaml = useMemo(() => {
    const slotsToInclude = Object.entries(selectedSlots)
      .filter(([_, cid]) => dmSelectedColors.includes(cid))
      .map(([idx]) => Number(idx))
      .sort((a, b) => a - b);
    return `  '${dmItemKey}':
    material: ${dmMaterial.toUpperCase()}
    slots: [${slotsToInclude.join(', ')}]
    display_name: '&f'
    priority: 1
    update: true
    hide_attributes: true
    left_click_commands:
    - '[close]'
    - '[sound] UI_BUTTON_CLICK'`;
  }, [selectedSlots, dmMaterial, dmSelectedColors, dmItemKey]);

  return (
    <div className="main-viewport bg-[#0d1017] text-zinc-100 selection:bg-amber-500/30">
      {/* NAVEGACIÓN SUPERIOR - ESTILO IDE */}
      <header className="flex-none border-b border-zinc-800/50 bg-[#141820]/80 backdrop-blur-xl px-10 py-4 flex justify-between items-center z-50 sticky top-0">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 rounded-xl flex items-center justify-center shadow-2xl">
            <Monitor size={24} className="text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-none flex items-center gap-2">
              GUI MASTER <span className="text-amber-500 text-[10px] bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-bold">STUDIO PRO</span>
            </h1>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
              <Sparkles size={10} className="text-amber-500/50" /> Arquitectura de Inventarios
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end gap-1">
            <span className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Capacidad de Filas</span>
            <div className="flex items-center gap-4 px-4 py-2 bg-zinc-900/50 rounded-lg border border-zinc-800/50 backdrop-blur-sm">
              <input
                type="range"
                min="1"
                max="6"
                value={chestRows}
                onChange={(e) => setChestRows(parseInt(e.target.value))}
                className="w-24 accent-amber-500 h-1 cursor-pointer"
              />
              <span className="text-lg font-mc font-bold text-amber-500 min-w-[35px] text-right">{chestRows}x9</span>
            </div>
          </div>
          <button
            onClick={saveLayout}
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-zinc-950 font-black uppercase text-[11px] rounded-xl hover:bg-amber-400 transition-all shadow-[0_10px_20px_rgba(245,158,11,0.2)]"
          >
            <Save size={16} /> Archivar Proyecto
          </button>
        </div>
      </header>

      {/* WORKSPACE CENTRAL */}
      <main className="flex-1 flex flex-row overflow-hidden p-8 gap-8">

        {/* BARRA LATERAL: CONTROLES */}
        <aside className="w-80 flex flex-col gap-6 overflow-y-auto pr-2">
          <div className="pro-container p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-zinc-800/50 pb-4">
              <Palette size={18} className="text-amber-500" />
              <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Herramientas</h3>
            </div>

            <nav className="flex flex-col gap-2">
              {[
                { id: 'paint', icon: Paintbrush, label: 'Pincel' },
                { id: 'bucket', icon: Database, label: 'Llenado' },
                { id: 'erase', icon: Eraser, label: 'Borrador', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' }
              ].map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id as Tool)}
                  className={cn(
                    "flex items-center justify-between p-3.5 rounded-xl transition-all border",
                    activeTool === tool.id
                      ? (tool.color ? `${tool.bg} ${tool.border} ${tool.color}` : "bg-zinc-800 border-zinc-600 text-white shadow-lg")
                      : "border-transparent text-zinc-500 hover:bg-zinc-800/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <tool.icon size={18} />
                    <span className="text-[11px] font-bold uppercase tracking-wider">{tool.label}</span>
                  </div>
                  {activeTool === tool.id && (
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                  )}
                </button>
              ))}
            </nav>

            <div className="space-y-4 pt-4 border-t border-zinc-800/50">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Paleta de Gema</span>
                <span className="text-[9px] font-bold text-zinc-500 px-2 py-0.5 bg-zinc-900 rounded border border-zinc-800">{COLORS.length} Colores</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {COLORS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setActiveColor(c); if (activeTool === 'erase') setActiveTool('paint'); }}
                    className={cn(
                      "aspect-square border-2 transition-all relative rounded-lg overflow-hidden shadow-sm",
                      activeColor.id === c.id ? 'border-zinc-100 scale-110 shadow-xl ring-2 ring-amber-500/20' : 'border-black/20 hover:border-zinc-500'
                    )}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {activeColor.id === c.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-[1px]">
                        <CheckCircle2 size={14} className="text-white drop-shadow-md" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-bold text-center text-zinc-400 uppercase tracking-wider bg-zinc-900/50 py-1.5 rounded-md border border-zinc-800/50">
                {activeColor.name}
              </p>
            </div>

            <button
              onClick={() => { if (confirm('¿Reiniciar lienzo de trabajo?')) setSelectedSlots({}); }}
              className="w-full flex items-center justify-center gap-2 p-3.5 text-[10px] font-black uppercase border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded-xl"
            >
              <Trash2 size={14} /> Resetear Lienzo
            </button>
          </div>

          <div className="pro-container p-6 flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-2 border-b border-zinc-800/50 pb-4 mb-4">
              <History size={18} className="text-zinc-500" />
              <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Historial</h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {savedLayouts.length > 0 ? (
                savedLayouts.slice().reverse().map((l) => (
                  <div
                    key={l.id}
                    className="p-4 bg-zinc-900/40 border border-zinc-800/50 hover:border-amber-500/30 hover:bg-zinc-800/60 transition-all flex justify-between items-center rounded-xl group cursor-pointer"
                    onClick={() => { setSelectedSlots(l.slots); setChestRows(l.rows); notify('PROYECTO CARGADO'); }}
                  >
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold uppercase truncate max-w-[130px] text-zinc-200 group-hover:text-amber-500 transition-colors">{l.name}</span>
                      <span className="text-[8px] text-zinc-600 uppercase font-bold mt-1 flex items-center gap-1">
                        <History size={8} /> {new Date(l.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <ChevronRight size={14} className="text-zinc-700 group-hover:text-amber-500 transition-all transform group-hover:translate-x-1" />
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-700 opacity-20 italic">
                  <Database size={32} className="mb-3" />
                  <span className="text-[10px] uppercase font-black">Sin registros</span>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* CENTRO: CANVAS DE DISEÑO */}
        <section className="flex-1 flex flex-col items-center justify-center h-full relative">
          <div className="pro-container p-12 relative flex flex-col items-center max-w-full bg-[#141820] border-zinc-800 shadow-2xl overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/5 blur-[100px] rounded-full" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/5 blur-[100px] rounded-full" />

            <div className="absolute top-5 left-8 flex items-center gap-3 text-zinc-600">
              <Layers size={16} />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                Interfaz de Usuario <span className="text-zinc-800">|</span> <span className="text-amber-500/50">V4.1</span>
              </span>
            </div>

            <div className="p-4 bg-black/40 border border-zinc-800/50 rounded-xl shadow-2xl backdrop-blur-sm relative z-10">
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${ROW_SIZE}, minmax(48px, 60px))` }}
              >
                {Array.from({ length: chestRows * ROW_SIZE }).map((_, i) => (
                  <InventorySlot
                    key={i} index={i}
                    selectedColor={COLORS.find(c => c.id === selectedSlots[i])}
                    onClick={() => handleAction(i)}
                    onRightClick={(e) => {
                      e.preventDefault();
                      setSelectedSlots(prev => { const next = { ...prev }; delete next[i]; return next; });
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-12 w-full border-t border-zinc-800/50 pt-10 relative z-10">
              {[
                { label: 'Total de Slots', value: chestRows * ROW_SIZE, color: 'text-zinc-200' },
                { label: 'Puntos de Tinte', value: Object.keys(selectedSlots).length, color: 'text-amber-500' },
                { label: 'Densidad GUI', value: `${Math.round((Object.keys(selectedSlots).length / (chestRows * ROW_SIZE)) * 100)}%`, color: 'text-emerald-500' }
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center text-center"
                >
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2">{stat.label}</span>
                  <span className={cn("text-3xl font-mc font-bold tracking-tighter", stat.color)}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3 text-zinc-800 font-black uppercase tracking-[0.6em] text-[10px]">
            <Cpu size={14} /> Neural Render Engine 4.1
          </div>
        </section>

        {/* COLUMNA DERECHA: EXPORTACIÓN DETALLADA */}
        <aside className="w-[480px] flex flex-col gap-5 h-full">
          <div className="pro-container h-full flex flex-col overflow-hidden border-zinc-800/50">
            <div className="flex border-b border-zinc-800/50 bg-zinc-900/30 p-1">
              {(['configuracion', 'analisis'] as ExportTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveExportTab(tab)}
                  className={cn(
                    "flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg relative overflow-hidden",
                    activeExportTab === tab ? 'text-amber-500 bg-zinc-800' : 'text-zinc-500 hover:text-zinc-300'
                  )}
                >
                  {tab === 'configuracion' ? 'YAML' : 'Análisis'}
                </button>
              ))}
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              {activeExportTab === 'configuracion' && (
                <div className="space-y-6 h-full flex flex-col">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Identificador YAML</label>
                      <div className="bg-zinc-900/50 border border-zinc-800/50 p-3 rounded-xl focus-within:border-amber-500/50 transition-colors">
                        <input value={dmItemKey} onChange={(e) => setDmItemKey(e.target.value)} className="w-full bg-transparent text-[12px] font-bold outline-none text-zinc-200 uppercase" placeholder="NOMBRE_ITEM" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Material Minecraft</label>
                      <div className="bg-zinc-900/50 border border-zinc-800/50 p-3 rounded-xl focus-within:border-amber-500/50 transition-colors">
                        <input value={dmMaterial} onChange={(e) => setDmMaterial(e.target.value)} className="w-full bg-transparent text-[12px] font-bold outline-none text-zinc-200 uppercase" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Filtros de Exportación</label>
                    <div className="grid grid-cols-2 gap-2">
                      {COLORS.map(c => {
                        const isSelected = dmSelectedColors.includes(c.id);
                        const isUsed = usedColorIds.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            disabled={!isUsed}
                            onClick={() => setDmSelectedColors(prev => isSelected ? prev.filter(id => id !== c.id) : [...prev, c.id])}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 border text-[9px] font-black uppercase transition-all rounded-xl",
                              !isUsed ? 'opacity-10 border-zinc-900 cursor-not-allowed' :
                                isSelected ? 'bg-amber-500 border-amber-600 text-zinc-950 shadow-lg' :
                                  'bg-zinc-900/40 border-zinc-800/50 text-zinc-500 hover:border-zinc-600'
                            )}
                          >
                            <div className={cn("w-2 h-2 rounded-full", isSelected ? 'bg-black/40' : '')} style={{ backgroundColor: !isSelected ? c.hex : undefined }}></div>
                            {c.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col min-h-0 bg-[#0b0e15] border border-zinc-800/50 rounded-xl p-5 relative group mt-2 overflow-hidden">
                    <div className="flex items-center justify-between mb-4 border-b border-zinc-800/50 pb-4">
                      <div className="flex items-center gap-3">
                        <Terminal size={14} className="text-zinc-600" />
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Previsualización YAML</span>
                      </div>
                      <span className="text-[8px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">V1.12 - 1.21+</span>
                    </div>
                    <pre className="flex-1 overflow-auto text-amber-100/50 text-[11px] font-mono whitespace-pre leading-relaxed">{deluxeMenusYaml}</pre>
                    <button
                      onClick={() => copyToClipboard(deluxeMenusYaml)}
                      className="absolute bottom-6 right-6 bg-zinc-100 text-zinc-950 px-5 py-2.5 font-black uppercase text-[10px] rounded-xl hover:bg-amber-500 hover:text-white transition-all shadow-2xl z-10"
                    >
                      COPIAR CONFIG
                    </button>
                  </div>
                </div>
              )}

              {activeExportTab === 'analisis' && (
                <div className="space-y-6">
                  <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex flex-col items-center text-center space-y-3">
                    <Zap size={24} className="text-amber-500 opacity-60" />
                    <h4 className="text-zinc-100 font-black uppercase text-xs tracking-widest">Auditoría Técnica</h4>
                    <p className="text-[10px] text-zinc-500 leading-relaxed font-bold uppercase">Optimización de recursos y análisis de slots.</p>
                  </div>

                  <div className="space-y-2">
                    {COLORS.map(c => {
                      const count = colorGroups[c.id].length;
                      if (count === 0) return null;
                      return (
                        <div
                          key={c.id}
                          className="flex justify-between items-center p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-xl hover:bg-zinc-800/40 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-md shadow-lg" style={{ backgroundColor: c.hex }}></div>
                            <div>
                              <span className="text-[11px] font-black uppercase text-zinc-200 tracking-wider">{c.name}</span>
                              <div className="text-[8px] text-zinc-600 uppercase font-bold">Material: {c.id}_pane</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-mc font-bold text-zinc-100 tracking-tighter">{count}</span>
                            <span className="text-[8px] font-black text-zinc-700 uppercase block">Slots</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    className="w-full p-4 border border-zinc-800/50 bg-zinc-900/30 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 transition-all rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 group"
                  >
                    <Download size={16} /> Exportar Schema .JSON
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>
      </main>

      {/* NOTIFICACIONES FLOTANTES */}
      {showNotification && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[100]">
          <div className="bg-amber-500 text-zinc-950 px-8 py-4 rounded-xl shadow-[0_20px_50px_rgba(245,158,11,0.3)] flex items-center gap-4 border border-amber-400/50 backdrop-blur-md">
            <div className="w-8 h-8 bg-black/10 rounded-full flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-sm font-black uppercase tracking-tight">{showNotification}</span>
          </div>
        </div>
      )}
    </div>
  );
}
