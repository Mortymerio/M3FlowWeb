import React, { useState } from 'react';
import { useStore } from '../store';
import { ChevronRight, ChevronDown, Edit2, LayoutDashboard, Trash2 } from 'lucide-react';
import { toastConfirm } from '../utils/toastConfirm';

export const NotebookNode = React.memo(({ notebook, notebooks, depth, expanded, setExpanded, activeNotebookId, setActiveNotebook, themeStyle }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(notebook.name);

  const children = notebooks.filter((nb: any) => nb.parentId === notebook.id);
  const hasChildren = children.length > 0;
  const isExpanded = expanded.has(notebook.id);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(notebook.id)) next.delete(notebook.id);
      else next.add(notebook.id);
      return next;
    });
  };

  const handleSave = () => {
    if (editName.trim() && editName !== notebook.name) {
      useStore.getState().updateNotebook(notebook.id, editName, notebook.parentId, notebook.config);
    }
    setIsEditing(false);
  };

  return (
    <>
      <li 
        onClick={() => setActiveNotebook(notebook.id)}
        draggable
        onDragStart={(e) => e.dataTransfer.setData('notebookId', notebook.id)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const droppedNotebookId = e.dataTransfer.getData('notebookId');
          const droppedNoteId = e.dataTransfer.getData('noteId');
          
          if (droppedNotebookId && droppedNotebookId !== notebook.id) {
            useStore.getState().moveNotebook(droppedNotebookId, notebook.id);
          } else if (droppedNoteId) {
            useStore.getState().moveNote(droppedNoteId, notebook.id);
          }
        }}
        className={`px-2 py-1.5 rounded-md cursor-pointer flex items-center justify-between transition-colors group
          ${activeNotebookId === notebook.id ? themeStyle.sidebarActive : themeStyle.sidebarHover}
        `}
        style={{ paddingLeft: `${0.5 + depth * 0.75}rem` }}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          {hasChildren ? (
            <div onClick={toggleExpand} className={`p-0.5 rounded ${themeStyle.sidebarHover}`}>
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
          ) : (
            <div className="w-5" /> 
          )}
          
          {isEditing ? (
            <input
              autoFocus
              className="bg-white/10 border border-blue-500/50 rounded px-1 text-[13px] w-full outline-none text-white no-drag"
              style={{ WebkitAppRegion: 'no-drag', caretColor: '#3b82f6' } as any}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') { setEditName(notebook.name); setIsEditing(false); }
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate flex-1 text-[13px]">{notebook.name}</span>
          )}
        </div>
        
        {!isEditing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setIsEditing(true);
              }}
              title="Rename Notebook"
              className={`p-1 rounded transition-all hover:text-blue-400 ${themeStyle.sidebarHover}`}
            >
              <Edit2 size={12} />
            </button>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                useStore.getState().setNotebookContextModal(true, notebook.id);
              }}
              title="Notebook Context & Dashboard"
              className={`p-1 rounded transition-all hover:text-purple-400 ${themeStyle.sidebarHover}`}
            >
              <LayoutDashboard size={12} />
            </button>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                // Usamos un pequeño delay para evitar problemas con el drag
                setTimeout(() => {
                  toastConfirm(
                    `Delete folder "${notebook.name}"?`,
                    () => useStore.getState().deleteNotebook(notebook.id)
                  );
                }, 10);
              }}
              className={`p-1 rounded transition-all hover:text-red-500 ${themeStyle.sidebarHover}`}
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </li>
      
      {isExpanded && hasChildren && (
        children.map((child: any) => (
          <NotebookNode 
            key={child.id} 
            notebook={child} 
            notebooks={notebooks} 
            depth={depth + 1}
            expanded={expanded}
            setExpanded={setExpanded}
            activeNotebookId={activeNotebookId}
            setActiveNotebook={setActiveNotebook}
            themeStyle={themeStyle}
          />
        ))
      )}
    </>
  );
});
