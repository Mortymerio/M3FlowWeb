import { db, auth } from './auth';
import { 
  collection, doc, setDoc, getDocs, getDoc, deleteDoc, 
  query, where, orderBy, updateDoc, writeBatch 
} from 'firebase/firestore';

interface Note { id: string; title: string; body: string; notebookId: string | null; status?: string; reminderAt?: number | null; createdAt: number; updatedAt: number; }
interface Notebook { id: string; name: string; parentId: string | null; config?: string | null; createdAt: number; }
interface Tag { id: string; name: string; color: string; }
interface NoteTag { noteId: string; tagId: string; }
interface Template { id: string; name: string; content: string; isSystem: number; createdAt: number; updatedAt: number; }
interface TaskMeta { id?: string; noteId: string; lineNumber: number; dueDate: number | null; priority: string; }

const getUid = () => {
  const uid = auth?.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");
  return uid;
};

const notesRef = () => collection(db!, `users/${getUid()}/notes`);
const noteDoc = (id: string) => doc(db!, `users/${getUid()}/notes/${id}`);
const notebooksRef = () => collection(db!, `users/${getUid()}/notebooks`);
const notebookDoc = (id: string) => doc(db!, `users/${getUid()}/notebooks/${id}`);
const tagsRef = () => collection(db!, `users/${getUid()}/tags`);
const tagDoc = (id: string) => doc(db!, `users/${getUid()}/tags/${id}`);
const noteTagsRef = () => collection(db!, `users/${getUid()}/noteTags`);
const noteTagDoc = (id: string) => doc(db!, `users/${getUid()}/noteTags/${id}`);
const templatesRef = () => collection(db!, `users/${getUid()}/templates`);
const templateDoc = (id: string) => doc(db!, `users/${getUid()}/templates/${id}`);
const taskMetaRef = () => collection(db!, `users/${getUid()}/taskMeta`);
const taskMetaDoc = (id: string) => doc(db!, `users/${getUid()}/taskMeta/${id}`);

const dbAPI = {
  getNotes: async () => {
    if (!auth?.currentUser) return [];
    const q = query(notesRef(), orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id })) as Note[];
  },
  saveNote: async (note: any) => {
    if (!auth?.currentUser) return;
    const now = Date.now();
    const snap = await getDoc(noteDoc(note.id));
    if (snap.exists()) {
      await updateDoc(noteDoc(note.id), { ...note, updatedAt: now });
    } else {
      await setDoc(noteDoc(note.id), { ...note, createdAt: now, updatedAt: now, status: note.status || 'none' });
    }
  },
  deleteNote: async (id: string) => {
    if (!auth?.currentUser) return;
    await deleteDoc(noteDoc(id));
    const ntq = query(noteTagsRef(), where('noteId', '==', id));
    const ntsnap = await getDocs(ntq);
    const batch = writeBatch(db!);
    ntsnap.docs.forEach(d => batch.delete(d.ref));
    const tmq = query(taskMetaRef(), where('noteId', '==', id));
    const tmsnap = await getDocs(tmq);
    tmsnap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  },
  moveNote: async (noteId: string, notebookId: string) => {
    if (!auth?.currentUser) return;
    await updateDoc(noteDoc(noteId), { notebookId, updatedAt: Date.now() });
  },
  updateNoteStatus: async (noteId: string, status: string) => {
    if (!auth?.currentUser) return;
    await updateDoc(noteDoc(noteId), { status, updatedAt: Date.now() });
  },
  updateNoteReminder: async (noteId: string, reminderAt: number | null) => {
    if (!auth?.currentUser) return;
    await updateDoc(noteDoc(noteId), { reminderAt, updatedAt: Date.now() });
  },

  getNotebooks: async () => {
    if (!auth?.currentUser) return [];
    const q = query(notebooksRef(), orderBy('name'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id })) as Notebook[];
  },
  saveNotebook: async (nb: any) => {
    if (!auth?.currentUser) return;
    await setDoc(notebookDoc(nb.id), { ...nb, createdAt: nb.createdAt || Date.now() });
  },
  deleteNotebook: async (id: string) => {
    if (!auth?.currentUser) return;
    const delRecursive = async (nbId: string) => {
      const qChildren = query(notebooksRef(), where('parentId', '==', nbId));
      const children = await getDocs(qChildren);
      for (const child of children.docs) await delRecursive(child.id);
      const qNotes = query(notesRef(), where('notebookId', '==', nbId));
      const notes = await getDocs(qNotes);
      for (const note of notes.docs) await dbAPI.deleteNote(note.id);
      await deleteDoc(notebookDoc(nbId));
    };
    await delRecursive(id);
  },
  moveNotebook: async (notebookId: string, parentId: string | null) => {
    if (!auth?.currentUser) return;
    await updateDoc(notebookDoc(notebookId), { parentId });
  },
  
  getTemplates: async () => {
    if (!auth?.currentUser) return [];
    const q = query(templatesRef(), orderBy('name'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id })) as Template[];
  },
  saveTemplate: async (template: any) => {
    if (!auth?.currentUser) return;
    await setDoc(templateDoc(template.id), { ...template, createdAt: template.createdAt || Date.now(), updatedAt: Date.now() });
  },
  deleteTemplate: async (id: string) => {
    if (!auth?.currentUser) return;
    await deleteDoc(templateDoc(id));
  },

  getTags: async () => {
    if (!auth?.currentUser) return [];
    const q = query(tagsRef(), orderBy('name'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id })) as Tag[];
  },
  getNoteTags: async () => {
    if (!auth?.currentUser) return [];
    const snap = await getDocs(noteTagsRef());
    const tags = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    return tags.map((t: any) => ({ noteId: t.noteId, tagId: t.tagId })) as NoteTag[];
  },
  createTag: async (tag: any) => { 
    if (!auth?.currentUser) return;
    await setDoc(tagDoc(tag.id), tag); 
  },
  updateTag: async (tag: any) => { 
    if (!auth?.currentUser) return;
    await setDoc(tagDoc(tag.id), tag); 
  },
  deleteTag: async (id: string) => {
    if (!auth?.currentUser) return;
    await deleteDoc(tagDoc(id));
    const q = query(noteTagsRef(), where('tagId', '==', id));
    const snap = await getDocs(q);
    const batch = writeBatch(db!);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  },
  toggleNoteTag: async (noteId: string, tagId: string) => {
    if (!auth?.currentUser) return;
    const docId = `${noteId}_${tagId}`;
    const snap = await getDoc(noteTagDoc(docId));
    if (snap.exists()) {
      await deleteDoc(noteTagDoc(docId));
    } else {
      await setDoc(noteTagDoc(docId), { noteId, tagId });
    }
  },

  searchNotes: async (queryStr: string) => {
    if (!queryStr.trim() || !auth?.currentUser) return [];
    const notes = await dbAPI.getNotes();
    const q = queryStr.toLowerCase();
    return notes.filter(n => 
      n.title.toLowerCase().includes(q) || 
      (n.body && n.body.toLowerCase().includes(q))
    ).map(n => ({ ...n, highlight: '' }));
  },
  getBacklinks: async (noteId: string) => {
    if (!auth?.currentUser) return [];
    const snap = await getDoc(noteDoc(noteId));
    if (!snap.exists()) return [];
    const targetNote = snap.data() as Note;
    const titleMatch = `[[${targetNote.title}]]`;
    const notes = await dbAPI.getNotes();
    return notes.filter(n => n.body?.includes(titleMatch));
  },

  exportMarkdown: async () => false,
  exportCSV: async () => false,
  exportPDF: async () => false,
  importWorkspace: async () => false,
  closeApp: async () => {},
  minimizeApp: async () => {},
  maximizeApp: async () => {},
  getSystemStats: async () => ({ sysMemPct: 0, processMemMb: 0 }),
  isFallbackMode: async () => false,

  githubTestConnection: async () => ({ success: false }),
  githubSync: async () => ({ success: false }),
  githubImportDb: async () => ({ success: false }),
  githubRecoverNotes: async () => ({ success: false }),
  onGithubProgress: () => {},

  scanTasks: async () => {
    if (!auth?.currentUser) return [];
    const notes = await dbAPI.getNotes();
    const snap = await getDocs(taskMetaRef());
    const allMeta = snap.docs.map(d => ({ ...d.data(), id: d.id })) as TaskMeta[];
    
    const metaMap = new Map();
    for (const m of allMeta) {
      metaMap.set(`${m.noteId}:${m.lineNumber}`, m);
    }
    
    const tasks: any[] = [];
    for (const note of notes) {
      if (!note.body) continue;
      const lines = note.body.split('\n');
      let taskIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/^(\s*)-\s*\[([ xX])\]\s*(.+)$/);
        if (match) {
          const meta = metaMap.get(`${note.id}:${i}`);
          tasks.push({
            noteId: note.id,
            noteTitle: note.title,
            noteStatus: note.status || 'none',
            lineNumber: i,
            taskIndex: taskIndex++,
            checked: match[2] !== ' ',
            text: match[3].trim(),
            dueDate: meta?.dueDate || null,
            priority: meta?.priority || 'none',
          });
        }
      }
    }
    return tasks;
  },
  getTaskMeta: async () => {
    if (!auth?.currentUser) return [];
    const snap = await getDocs(taskMetaRef());
    return snap.docs.map(d => ({ ...d.data(), id: d.id })) as TaskMeta[];
  },
  setTaskDueDate: async (opts: any) => {
    if (!auth?.currentUser) return;
    const { noteId, lineNumber, dueDate } = opts;
    const docId = `${noteId}_${lineNumber}`;
    const snap = await getDoc(taskMetaDoc(docId));
    if (snap.exists()) {
      await updateDoc(taskMetaDoc(docId), { dueDate });
    } else {
      await setDoc(taskMetaDoc(docId), { noteId, lineNumber, dueDate, priority: 'none' });
    }
  },
  setTaskPriority: async (opts: any) => {
    if (!auth?.currentUser) return;
    const { noteId, lineNumber, priority } = opts;
    const docId = `${noteId}_${lineNumber}`;
    const snap = await getDoc(taskMetaDoc(docId));
    if (snap.exists()) {
      await updateDoc(taskMetaDoc(docId), { priority });
    } else {
      await setDoc(taskMetaDoc(docId), { noteId, lineNumber, dueDate: null, priority });
    }
  },
  toggleTask: async (opts: any) => {
    if (!auth?.currentUser) return false;
    const { noteId, lineNumber, checked } = opts;
    const snap = await getDoc(noteDoc(noteId));
    if (!snap.exists()) return false;
    const note = snap.data() as Note;
    if (!note.body) return false;
    const lines = note.body.split('\n');
    if (lines[lineNumber] === undefined) return false;
    lines[lineNumber] = checked
      ? lines[lineNumber].replace(/\[\s\]/, '[x]')
      : lines[lineNumber].replace(/\[[xX]\]/, '[ ]');
    await updateDoc(noteDoc(noteId), { body: lines.join('\n'), updatedAt: Date.now() });
    return true;
  }
};

(window as any).dbAPI = dbAPI;

export default dbAPI;
