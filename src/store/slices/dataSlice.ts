import type { StateCreator } from 'zustand';
import dbAPI from '../../services/db';
import type { AppState, DataSlice } from '../types';

export const createDataSlice: StateCreator<
  AppState,
  [],
  [],
  DataSlice
> = (set, get) => ({
  notebooks: [],
  notes: [],
  tags: [],
  noteTags: [],
  templates: [],
  activeNotebookId: null,
  activeNoteId: null,
  activeStatusId: null,
  activeTagId: null,
  searchQuery: '',
  sortOrder: 'default',
  ftsQuery: '',
  searchResults: [],
  currentBacklinks: [],
  noteHistory: {},
  saveStatus: 'idle',

  setSaveStatus: (status) => set({ saveStatus: status }),

  revertToHistory: (noteId, index) => {
    const { noteHistory, notes, saveNote } = get();
    const history = noteHistory[noteId];
    if (!history || !history[index]) return;
    
    const version = history[index];
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    // Al revertir, el contenido actual pasará al historial en el próximo saveNote
    saveNote(noteId, note.title, version.body, true);
  },

  setSearchQuery: async (query) => {
    set({ searchQuery: query });
    
    if (query.trim().length > 1) {
      try {
        const notes = get().notes;
        const q = query.toLowerCase();
        const results = notes.filter(n => 
          n.title.toLowerCase().includes(q) || 
          (n.body && n.body.toLowerCase().includes(q))
        ).map(n => ({ ...n, highlight: '' }));
        set({ searchResults: results });
      } catch (e) {
        console.error('Local Search error:', e);
        set({ searchResults: [] });
      }
    } else {
      set({ searchResults: [] });
    }
  },

  clearSearchResults: () => set({ searchResults: [], searchQuery: '' }),

  loadBacklinks: async (noteId) => {
    try {
      const notes = get().notes;
      const targetNote = notes.find(n => n.id === noteId);
      if (!targetNote) return set({ currentBacklinks: [] });
      
      const titleMatch = `[[${targetNote.title}]]`;
      const links = notes.filter(n => n.body?.includes(titleMatch) && n.id !== noteId);
      set({ currentBacklinks: links });
    } catch (e) {
      console.error('Failed to parse backlinks locally', e);
      set({ currentBacklinks: [] });
    }
  },

  setSortOrder: (order) => set({ sortOrder: order }),
  setActiveNotebook: (id) => set({ activeNotebookId: id, activeStatusId: null, activeTagId: null, activeNoteId: null }),
  setActiveStatus: (id) => set({ activeStatusId: id, activeNotebookId: null, activeTagId: null, activeNoteId: null }),
  setActiveTag: (id) => set({ activeTagId: id, activeNotebookId: null, activeStatusId: null, activeNoteId: null }),
  setActiveNote: (id) => set({ activeNoteId: id }),

  loadInitialData: async () => {
    try {
        if (!dbAPI) {
        console.warn('dbAPI no detectado. Activando Modo Navegador (Local Storage Fallback)');
        get().setWebLlmState({ isBrowserMode: true } as any); // Cast since we're using partial
        // Intentar cargar de localStorage si existe
        const saved = localStorage.getItem('m3flow_web_bridge');
        if (saved) {
          const data = JSON.parse(saved);
          set({ notebooks: data.notebooks || [], notes: data.notes || [], tags: data.tags || [], noteTags: data.noteTags || [] });
        }
        return;
      }

      let [notebooks, notes, tags, noteTags, templates] = await Promise.all([
        dbAPI.getNotebooks(),
        dbAPI.getNotes(),
        dbAPI.getTags ? dbAPI.getTags() : [],
        dbAPI.getNoteTags ? dbAPI.getNoteTags() : [],
        dbAPI.getTemplates ? dbAPI.getTemplates() : []
      ]);

      // AUTO-INITIALIZE: Si no hay libretas, crear una 'General' para evitar el WelcomeScreen
      if (notebooks.length === 0) {
        const defaultNb = { id: 'nb-default', name: 'General', parentId: null, createdAt: Date.now() };
        await dbAPI.saveNotebook(defaultNb);
        notebooks = [defaultNb];
      }

      set({ 
        notebooks, 
        notes, 
        tags, 
        noteTags,
        templates,
        activeNotebookId: notebooks.length > 0 ? notebooks[0].id : null,
        activeNoteId: notes.length > 0 ? notes[0].id : null
      });
    } catch (e) {
      console.error('Error cargando SQLite, activando Modo Navegador', e);
      set({ isBrowserMode: true } as any);
    }
  },

  saveNote: async (id, title, body, skipHistory = false) => {
    const { notes } = get();
    const existingNote = notes.find(n => n.id === id);
    let targetNbId = existingNote ? existingNote.notebookId : null;

    if (!existingNote) {
       const { activeNotebookId, notebooks } = get();
       targetNbId = activeNotebookId || (notebooks.length > 0 ? notebooks[0].id : null);
    }

    // ANTI-ERASURE GUARD — Must run BEFORE DB write to prevent data corruption
    if (body.trim() === '' && existingNote && existingNote.body.length > 50) {
      console.warn('[M3Flow Guard] Intento de borrado masivo detectado. Bloqueando guardado.');
      set({ saveStatus: 'error' });
      return;
    }

    set({ saveStatus: 'saving' });

    try {
      await dbAPI.saveNote({
        id,
        title,
        body,
        notebookId: targetNbId,
      });
    } catch (e) {
      console.error('[store] saveNote DB error:', e);
      set({ saveStatus: 'error' });
      return; // Don't update local state if DB write failed
    }
    
    // Update local state & history only after successful DB write
    set((state) => {
      const currentHistory = state.noteHistory[id] || [];
      
      const historyUpdate: any = {};
      if (!skipHistory && existingNote && existingNote.body !== body && existingNote.body.trim() !== '') {
        const newVersion = { body: existingNote.body, timestamp: Date.now() };
        historyUpdate.noteHistory = { 
          ...state.noteHistory, 
          [id]: [newVersion, ...currentHistory].slice(0, 3) 
        };
      }

      return {
        ...state,
        ...historyUpdate,
        notes: state.notes.map((n) => n.id === id ? { ...n, title, body, updatedAt: Date.now() } : n),
        hasUnsyncedChanges: true,
        syncStatus: state.syncStatus !== 'error' ? 'pending' : 'error',
        saveStatus: 'saved'
      };
    });
  },

  createNote: async () => {
    const { activeNotebookId, notes, notebooks } = get();
    const newId = 'note-' + crypto.randomUUID();
    
    if (notebooks.length === 0) {
      await get().createNotebook('General', null);
    }
    
    const currentNotebooks = get().notebooks;
    const defaultNbId = currentNotebooks.length > 0 ? currentNotebooks[0].id : null;
    const targetNbId = activeNotebookId || defaultNbId;

    const activeNotebook = notebooks.find(nb => nb.id === targetNbId);
    let initialBody = '# Untitled Note\n\nStart typing here...';
    let initialTitle = 'Untitled Note';

    if (activeNotebook?.config) {
      try {
        const nbConfig = JSON.parse(activeNotebook.config);
        if (nbConfig.template) {
          initialBody = nbConfig.template.replace(/\{\{title\}\}/g, initialTitle);
        }
      } catch {}
    }

    const newNote = {
      id: newId,
      title: initialTitle,
      body: initialBody,
      notebookId: targetNbId as any,
      status: 'none',
      isPinned: 0,
      reminderAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    await dbAPI.saveNote(newNote);
    
    set({
      notes: [newNote, ...notes],
      hasUnsyncedChanges: true,
      syncStatus: get().syncStatus !== 'error' ? 'pending' : 'error'
    });
    
    (get() as any).openTab({ type: 'note', noteId: newId, title: initialTitle });
  },

  openDailyNote: async () => {
    const { notebooks } = get();

    const now = new Date();
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayName = dayNames[now.getDay()];
    const dateStr = now.toISOString().slice(0, 10);
    const dailyTitle = `📅 ${dateStr} — ${dayName}`;

    const DAILY_NB_NAME = 'Daily Journal';
    let dailyNotebook = notebooks.find(nb => nb.name === DAILY_NB_NAME);

    if (!dailyNotebook) {
      const nbId = 'nb-' + crypto.randomUUID().slice(0, 8);
      const config = JSON.stringify({ systemPrompt: 'Este es un notebook de Daily Standup / Scrum. Ayuda al usuario a organizar sus tareas diarias, blockers y seguimiento del equipo.' });
      const newNB = { id: nbId, name: DAILY_NB_NAME, parentId: null, config, createdAt: Date.now() };
      set(state => ({ notebooks: [...state.notebooks, newNB] }));
      try {
            if (dbAPI?.saveNotebook) await dbAPI.saveNotebook(newNB);
      } catch (e) { console.error('[store] openDailyNote createNotebook error:', e); }
      dailyNotebook = newNB;
    }

    const existingNote = get().notes.find(
      n => n.notebookId === dailyNotebook!.id && n.title === dailyTitle
    );

    if (existingNote) {
      set({
        activeNotebookId: dailyNotebook.id,
        activeStatusId: null,
        activeTagId: null,
      });
      (get() as any).openTab({ type: 'note', noteId: existingNote.id, title: existingNote.title });
      return;
    }

    const newId = 'note-' + crypto.randomUUID();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const { templates } = get();
    const tpl = templates.find(t => t.id === 'tpl-daily');
    let template = tpl ? tpl.content : `# {{title}}\n\n> Standup iniciado a las {{time}}\n\n## 🔄 ¿Qué hice ayer?\n- [ ] \n\n## 🎯 ¿Qué voy a hacer hoy?\n| Tarea | Responsable | Estado |\n|:------|:------------|:-------|\n|  | @yo | ⬜ Pendiente |\n|  |  | ⬜ Pendiente |\n\n## 🚧 Blockers / Impedimentos\n- _Ninguno por ahora_\n\n## 📋 Action Items\n- [ ] \n- [ ] \n\n## 👥 Notas del equipo\n| Miembro | Update | Blocker |\n|:--------|:-------|:--------|\n|  |  |  |\n\n## 💡 Observaciones\n> _Notas generales de la daily..._\n\n---\n*Daily Standup — {{date}} — M3Flow*\n`;
    
    template = template
      .replace(/\{\{title\}\}/g, dailyTitle)
      .replace(/\{\{date\}\}/g, dateStr)
      .replace(/\{\{time\}\}/g, timeStr)
      .replace(/\{\{dayName\}\}/g, dayName);
      
    if (!template.includes(dailyTitle)) {
      template = `# ${dailyTitle}\n\n${template}`;
    }

    const newNote = {
      id: newId,
      title: dailyTitle,
      body: template,
      notebookId: dailyNotebook.id,
      status: 'active',
      isPinned: 0,
      reminderAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      await dbAPI.saveNote(newNote);
    } catch (e) { console.error('[store] openDailyNote saveNote error:', e); }

    set(state => ({
      notes: [newNote, ...state.notes],
      activeNotebookId: dailyNotebook!.id,
      activeStatusId: null,
      activeTagId: null,
      hasUnsyncedChanges: true,
      syncStatus: state.syncStatus !== 'error' ? 'pending' : 'error',
    }));
    (get() as any).openTab({ type: 'note', noteId: newId, title: dailyTitle });
  },

  openMeetingNote: async () => {
    const { notebooks } = get();

    const now = new Date();
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayName = dayNames[now.getDay()];
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const meetingTitle = `📌 Reunión ${dateStr} — ${timeStr}`;

    const MTG_NB_NAME = 'Reuniones';
    let mtgNotebook = notebooks.find(nb => nb.name === MTG_NB_NAME);

    if (!mtgNotebook) {
      const nbId = 'nb-' + crypto.randomUUID().slice(0, 8);
      const config = JSON.stringify({ systemPrompt: 'Este es un notebook de minutas de reunión. Ayuda al usuario a organizar agendas, decisiones y action items de cada meeting.' });
      const newNB = { id: nbId, name: MTG_NB_NAME, parentId: null, config, createdAt: Date.now() };
      set(state => ({ notebooks: [...state.notebooks, newNB] }));
      try {
            if (dbAPI?.saveNotebook) await dbAPI.saveNotebook(newNB);
      } catch (e) { console.error('[store] openMeetingNote createNotebook error:', e); }
      mtgNotebook = newNB;
    }

    const newId = 'note-' + crypto.randomUUID();
    
    const { templates } = get();
    const tpl = templates.find(t => t.id === 'tpl-meeting');
    let template = tpl ? tpl.content : `## 📃 Info\n| Campo | Valor |\n|:------|:------|\n| **Fecha** | {{date}} ({{dayName}}) |\n| **Hora** | {{time}} |\n| **Moderador** | @yo |\n| **Duración est.** | 30 min |\n\n## 👥 Asistentes\n- [ ] @nombre1\n- [ ] @nombre2\n- [ ] @nombre3\n\n## 📝 Agenda\n1. \n2. \n3. \n\n## 🗣️ Discusión\n> _Notas de la reunión..._\n\n## ✅ Decisiones Tomadas\n| # | Decisión | Responsable |\n|:--|:---------|:------------|\n| 1 |  |  |\n| 2 |  |  |\n\n## 📌 Action Items\n| Tarea | Responsable | Deadline | Estado |\n|:------|:------------|:---------|:-------|\n|  |  |  | ⬜ Pendiente |\n|  |  |  | ⬜ Pendiente |\n|  |  |  | ⬜ Pendiente |\n\n## 🗓️ Próxima Reunión\n- **Fecha:**\n- **Temas pendientes:**\n\n---\n*Minuta de Reunión — {{date}} {{time}} — M3Flow*\n`;

    template = template
      .replace(/\{\{title\}\}/g, meetingTitle)
      .replace(/\{\{date\}\}/g, dateStr)
      .replace(/\{\{time\}\}/g, timeStr)
      .replace(/\{\{dayName\}\}/g, dayName);

    if (!template.includes(meetingTitle)) {
      template = `# ${meetingTitle}\n\n${template}`;
    }

    const newNote = {
      id: newId,
      title: meetingTitle,
      body: template,
      notebookId: mtgNotebook.id,
      status: 'active',
      isPinned: 0,
      reminderAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      await dbAPI.saveNote(newNote);
    } catch (e) { console.error('[store] openMeetingNote saveNote error:', e); }

    set(state => ({
      notes: [newNote, ...state.notes],
      activeNotebookId: mtgNotebook!.id,
      activeStatusId: null,
      activeTagId: null,
      hasUnsyncedChanges: true,
      syncStatus: state.syncStatus !== 'error' ? 'pending' : 'error',
    }));
    (get() as any).openTab({ type: 'note', noteId: newId, title: meetingTitle });
  },

  moveNotebook: async (notebookId, newParentId) => {
    if (notebookId === newParentId) return;
    set(state => ({
      notebooks: state.notebooks.map(nb => 
        nb.id === notebookId ? { ...nb, parentId: newParentId } : nb
      )
    }));
    try {
      if (dbAPI.moveNotebook) {
        await dbAPI.moveNotebook(notebookId, newParentId);
      }
    } catch(e) { console.error('[store] moveNotebook error:', e); }
  },
  moveNote: async (noteId, notebookId) => {
    set(state => ({
      notes: state.notes.map(n => n.id === noteId ? { ...n, notebookId, updatedAt: Date.now() } : n)
    }));
    try {
      if (dbAPI.moveNote) await dbAPI.moveNote(noteId, notebookId);
    } catch(e) { console.error('[store] moveNote error:', e); }
  },
  updateNoteStatus: async (noteId, status) => {
    const state = get();
    const updatedNote = { ...state.notes.find(n => n.id === noteId)!, status, updatedAt: Date.now() };
    set(state => ({
      notes: state.notes.map(n => n.id === noteId ? updatedNote : n),
      hasUnsyncedChanges: true,
      syncStatus: state.syncStatus !== 'error' ? 'pending' : 'error'
    }));
    try { if (dbAPI?.saveNote) await dbAPI.saveNote(updatedNote); } catch(e) {}
  },
  updateNoteIsPinned: async (noteId, isPinned) => {
    const state = get();
    const updatedNote = { ...state.notes.find(n => n.id === noteId)!, isPinned, updatedAt: Date.now() };
    set(state => ({
      notes: state.notes.map(n => n.id === noteId ? updatedNote : n),
      hasUnsyncedChanges: true,
      syncStatus: state.syncStatus !== 'error' ? 'pending' : 'error'
    }));
    try { if (dbAPI?.saveNote) await dbAPI.saveNote(updatedNote); } catch(e) {}
  },
  updateNoteReminder: async (noteId, reminderAt) => {
    const state = get();
    const updatedNote = { ...state.notes.find(n => n.id === noteId)!, reminderAt, updatedAt: Date.now() };
    set(state => ({
      notes: state.notes.map(n => n.id === noteId ? updatedNote : n),
      hasUnsyncedChanges: true,
      syncStatus: state.syncStatus !== 'error' ? 'pending' : 'error'
    }));
    try { if (dbAPI?.saveNote) await dbAPI.saveNote(updatedNote); } catch(e) {}
  },
  createTag: async (name, color) => {
    const id = 'tag-' + crypto.randomUUID().slice(0, 8);
    const newTag = { id, name, color };
    set(state => ({ tags: [...state.tags, newTag] }));
    try {
      if (dbAPI.createTag) await dbAPI.createTag(newTag);
    } catch(e) { console.error('[store] createTag error:', e); }
    return id;
  },
  updateTag: async (id, name, color) => {
    set(state => ({ tags: state.tags.map(t => t.id === id ? { ...t, name, color } : t) }));
    try {
      if (dbAPI.updateTag) await dbAPI.updateTag({ id, name, color });
    } catch(e) { console.error('[store] updateTag error:', e); }
  },
  deleteTag: async (id) => {
    set(state => ({ 
      tags: state.tags.filter(t => t.id !== id),
      noteTags: state.noteTags.filter(nt => nt.tagId !== id)
    }));
    try {
      if (dbAPI.deleteTag) await dbAPI.deleteTag(id);
    } catch(e) { console.error('[store] deleteTag error:', e); }
  },
  toggleNoteTag: async (noteId, tagId) => {
    set(state => {
      const exists = state.noteTags.find(nt => nt.noteId === noteId && nt.tagId === tagId);
      if (exists) {
        return { noteTags: state.noteTags.filter(nt => !(nt.noteId === noteId && nt.tagId === tagId)) };
      }
      return { noteTags: [...state.noteTags, { noteId, tagId }] };
    });
    try {
      if (dbAPI.toggleNoteTag) await dbAPI.toggleNoteTag(noteId, tagId);
    } catch(e) { console.error('[store] toggleNoteTag error:', e); }
  },
  saveTemplate: async (template) => {
    try {
      if (dbAPI.saveTemplate) {
        await dbAPI.saveTemplate(template);
        const templates = await dbAPI.getTemplates();
        set({ templates });
      }
    } catch(e) { console.error('[store] saveTemplate error:', e); }
  },
  deleteTemplate: async (id) => {
    try {
      if (dbAPI.deleteTemplate) {
        await dbAPI.deleteTemplate(id);
        set(state => ({ templates: state.templates.filter(t => t.id !== id) }));
      }
    } catch(e) { console.error('[store] deleteTemplate error:', e); }
  },
  createNotebook: async (name, parentId, config) => {
    const id = 'nb-' + crypto.randomUUID().slice(0, 8);
    const configStr = config ? JSON.stringify(config) : null;
    const newNB = { id, name, parentId, config: configStr as any, createdAt: Date.now() };
    set(state => ({ 
      notebooks: [...state.notebooks, newNB],
      activeNotebookId: id,
      activeNoteId: null
    }));
    try {
        if (dbAPI && dbAPI.saveNotebook) await dbAPI.saveNotebook(newNB);
    } catch(e) { console.error('[store] createNotebook error:', e); }
  },
  updateNotebook: async (id, name, parentId, config) => {
    const configStr = config ? (typeof config === 'string' ? config : JSON.stringify(config)) : null;
    const updatedNB = { id, name, parentId, config: configStr as any };
    set(state => ({
      notebooks: state.notebooks.map(nb => nb.id === id ? { ...nb, name, parentId, config: configStr as any } : nb)
    }));
    try {
        if (dbAPI && dbAPI.saveNotebook) await dbAPI.saveNotebook(updatedNB);
    } catch(e) { console.error('[store] updateNotebook error:', e); }
  },
  deleteNote: async (id) => {
    if (!id) return;

    // Check if there's an open tab for this note and close it
    const tabs = (get() as any).tabs;
    if (tabs) {
      const tabToClose = tabs.find((t: any) => t.type === 'note' && t.noteId === id);
      if (tabToClose) {
        (get() as any).closeTab(tabToClose.id);
      }
    }

    const state = get();
    const noteToSoftDelete = state.notes.find(n => n.id === id);
    if (!noteToSoftDelete) return;

    const updatedNote = { ...noteToSoftDelete, deletedAt: Date.now(), updatedAt: Date.now() };

    set(state => ({ 
      notes: state.notes.map(n => n.id === id ? updatedNote : n),
      activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
      hasUnsyncedChanges: true,
      syncStatus: state.syncStatus !== 'error' ? 'pending' : 'error'
    }));
    try {
        if (dbAPI && dbAPI.saveNote) await dbAPI.saveNote(updatedNote);
    } catch(e) { console.error('[store] deleteNote error:', e); }
  },
  restoreNote: async (id) => {
    if (!id) return;

    const state = get();
    const noteToRestore = state.notes.find(n => n.id === id);
    if (!noteToRestore) return;

    const updatedNote = { ...noteToRestore, deletedAt: null, updatedAt: Date.now() };

    set(state => ({ 
      notes: state.notes.map(n => n.id === id ? updatedNote : n),
      hasUnsyncedChanges: true,
      syncStatus: state.syncStatus !== 'error' ? 'pending' : 'error'
    }));
    try {
        if (dbAPI && dbAPI.saveNote) await dbAPI.saveNote(updatedNote);
    } catch(e) { console.error('[store] restoreNote error:', e); }
  },
  permanentlyDeleteNote: async (id) => {
    if (!id) return;

    set(state => ({ 
      notes: state.notes.filter(n => n.id !== id),
      hasUnsyncedChanges: true,
      syncStatus: state.syncStatus !== 'error' ? 'pending' : 'error'
    }));
    try {
        if (dbAPI && dbAPI.deleteNote) await dbAPI.deleteNote(id);
    } catch(e) { console.error('[store] permanentlyDeleteNote error:', e); }
  },
  emptyTrash: async () => {
    const state = get();
    const trashNotes = state.notes.filter(n => n.deletedAt != null);
    if (trashNotes.length === 0) return;

    set(state => ({ 
      notes: state.notes.filter(n => n.deletedAt == null),
      hasUnsyncedChanges: true,
      syncStatus: state.syncStatus !== 'error' ? 'pending' : 'error'
    }));

    try {
      if (dbAPI && dbAPI.deleteNote) {
        await Promise.all(trashNotes.map(n => dbAPI.deleteNote!(n.id)));
      }
    } catch(e) { console.error('[store] emptyTrash error:', e); }
  },
  deleteNotebook: async (id) => {
    set(state => ({ 
      notebooks: state.notebooks.filter(nb => nb.id !== id),
      notes: state.notes.filter(n => n.notebookId !== id),
      activeNotebookId: state.activeNotebookId === id ? null : state.activeNotebookId,
      hasUnsyncedChanges: true,
      syncStatus: state.syncStatus !== 'error' ? 'pending' : 'error'
    }));
    try {
        if (dbAPI && dbAPI.deleteNotebook) await dbAPI.deleteNotebook(id);
    } catch(e) { console.error('[store] deleteNotebook error:', e); }
  }
});
