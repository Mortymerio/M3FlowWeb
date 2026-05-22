import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, FileText, Lock } from 'lucide-react';
import { useStore } from '../store';

export const TemplatesManagerModal: React.FC = () => {
  const { isTemplatesModalOpen, setTemplatesModalOpen, templates, saveTemplate, deleteTemplate, theme, customColors } = useStore() as any;
  
  const [activeTemplate, setActiveTemplate] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editContent, setEditContent] = useState('');

  const bgColor = theme === 'custom' ? customColors.editorBg : 'bg-gray-900';
  const headerBg = theme === 'custom' ? customColors.editorHeader : 'bg-gray-800';
  const panelBg = theme === 'custom' ? customColors.sidebarBg : 'bg-gray-800';

  useEffect(() => {
    if (isTemplatesModalOpen && (templates || []).length > 0 && !activeTemplate) {
      handleSelectTemplate(templates[0]);
    }
  }, [isTemplatesModalOpen, templates]);

  const handleSelectTemplate = (tpl: any) => {
    setActiveTemplate(tpl);
    setEditName(tpl.name);
    setEditContent(tpl.content);
  };

  const handleCreateNew = () => {
    const newTpl = {
      id: 'tpl-' + crypto.randomUUID().slice(0, 8),
      name: 'Nueva Plantilla',
      content: '# {{title}}\n\nContenido aquí...',
      isSystem: 0,
      createdAt: Date.now()
    };
    setActiveTemplate(newTpl);
    setEditName(newTpl.name);
    setEditContent(newTpl.content);
  };

  const handleSave = async () => {
    if (!activeTemplate) return;
    await saveTemplate({
      ...activeTemplate,
      name: editName,
      content: editContent
    });
    // Si era nuevo, la lista se actualizará y podemos seleccionarlo del estado
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta plantilla?')) {
      await deleteTemplate(id);
      if (activeTemplate?.id === id) {
        setActiveTemplate(null);
      }
    }
  };

  if (!isTemplatesModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className={`w-full max-w-5xl h-[80vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-white/10 ${bgColor}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b border-white/10 ${headerBg}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-100">Gestor de Plantillas</h2>
              <p className="text-xs text-gray-400">Personaliza tus plantillas y automatiza la creación de notas</p>
            </div>
          </div>
          <button 
            onClick={() => setTemplatesModalOpen(false)}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Template List */}
          <div className={`w-64 flex flex-col border-r border-white/10 ${panelBg}`}>
            <div className="p-3 border-b border-white/10 flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mis Plantillas</span>
              <button 
                onClick={handleCreateNew}
                className="p-1 hover:bg-white/10 rounded text-blue-400"
                title="Crear Nueva Plantilla"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {(templates || []).map((tpl: any) => (
                <div 
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors group
                    ${activeTemplate?.id === tpl.id ? 'bg-blue-500/20 text-blue-300' : 'text-gray-300 hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText size={14} className={activeTemplate?.id === tpl.id ? 'text-blue-400' : 'text-gray-500'} />
                    <span className="truncate text-sm">{tpl.name}</span>
                    {tpl.isSystem === 1 && <span title="Plantilla de Sistema"><Lock size={12} className="text-gray-500" /></span>}
                  </div>
                  {tpl.isSystem === 0 && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(tpl.id); }}
                      className="p-1 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Content - Editor */}
          <div className="flex-1 flex flex-col p-4 bg-black/20">
            {activeTemplate ? (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Nombre de la Plantilla</label>
                    <input 
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      disabled={activeTemplate.isSystem === 1}
                      className={`w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 ${activeTemplate.isSystem === 1 ? 'opacity-70 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  <div className="pt-5">
                    <button 
                      onClick={handleSave}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Save size={16} />
                      Guardar Cambios
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex flex-col border border-white/10 rounded-xl overflow-hidden bg-black/40">
                  <div className="bg-white/5 px-3 py-2 border-b border-white/10 flex items-center justify-between">
                    <span className="text-xs font-mono text-gray-400">Cuerpo de la plantilla (Markdown)</span>
                    <div className="flex gap-2">
                      <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300">{"{{title}}"}</span>
                      <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300">{"{{date}}"}</span>
                      <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300">{"{{time}}"}</span>
                      <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300">{"{{dayName}}"}</span>
                    </div>
                  </div>
                  <textarea 
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="flex-1 w-full bg-transparent p-4 text-sm font-mono text-gray-300 focus:outline-none resize-none"
                    placeholder="Escribe el contenido de tu plantilla usando Markdown..."
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                <FileText size={48} className="mb-4 opacity-20" />
                <p>Selecciona una plantilla o crea una nueva</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
