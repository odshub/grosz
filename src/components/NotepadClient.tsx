"use client";

import { useState, useMemo, useTransition } from "react";
import { Search, Send, Trash2 } from "lucide-react";
import { createNote, deleteNote } from "@/app/actions";
import { useTranslation } from "@/lib/i18n/client";

type Note = {
  id: string;
  content: string;
  created_at: string;
  users?: { email: string, name?: string | null } | null;
  user_id: string;
};

export function NotepadClient({ initialNotes, currentUser }: { initialNotes: Note[], currentUser: { email: string, id: string } }) {
  const [notes, setNotes] = useState(initialNotes);
  const [search, setSearch] = useState("");
  const [newNote, setNewNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const { t, locale } = useTranslation();

  // Extract all unique hashtags from notes
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(note => {
      const matches = note.content.match(/#[\wа-яА-ЯіІїЇєЄ]+/g);
      if (matches) {
        matches.forEach(t => tags.add(t.toLowerCase()));
      }
    });
    return Array.from(tags).sort();
  }, [notes]);

  const filteredNotes = useMemo(() => {
    if (!search.trim()) return notes;
    const lowerSearch = search.toLowerCase();
    return notes.filter(n => n.content.toLowerCase().includes(lowerSearch));
  }, [notes, search]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const content = newNote;
    setNewNote("");
    
    // Optimistic update
    const tempNote: Note = {
      id: "temp-" + Date.now(),
      content,
      created_at: new Date().toISOString(),
      users: { email: currentUser.email },
      user_id: currentUser.id
    };
    
    setNotes(prev => [tempNote, ...prev]);

    startTransition(async () => {
      await createNote(content);
    });
  };

  const handleDelete = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    startTransition(async () => {
      await deleteNote(id);
    });
  };

  const toggleTag = (tag: string) => {
    if (search.includes(tag)) {
      setSearch(search.replace(tag, "").trim());
    } else {
      setSearch((search + " " + tag).trim());
    }
  };

  const renderContentWithTags = (content: string) => {
    const parts = content.split(/(#[\wа-яА-ЯіІїЇєЄ]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("#")) {
        return <span key={i} className="text-primary font-bold cursor-pointer hover:underline" onClick={() => toggleTag(part)}>{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Search and Tags */}
      <div className="space-y-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('notes.search_placeholder') as string}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-card rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground">
              ✕
            </button>
          )}
        </div>
        
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => {
              const isActive = search.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-2.5 py-1 rounded-full transition-colors font-medium border ${isActive ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground hover:bg-muted/80 border-border"}`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleAddNote} className="relative shrink-0">
        <textarea
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          placeholder={t('notes.placeholder') as string}
          className="w-full p-4 pr-12 bg-card rounded-xl resize-none outline-none focus:ring-2 focus:ring-primary border border-border min-h-25 shadow-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAddNote(e);
            }
          }}
        />
        <button
          type="submit"
          disabled={!newNote.trim() || isPending}
          className="absolute right-3 bottom-3 p-2.5 bg-primary text-primary-foreground rounded-full shadow-md active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-24">
        {filteredNotes.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">{t('notes.empty')}</p>
        ) : (
          filteredNotes.map(note => (
            <div key={note.id} className="p-4 bg-card border border-border rounded-xl shadow-sm space-y-3">
              <div className="flex justify-between items-start gap-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed wrap-break-word">
                  {renderContentWithTags(note.content)}
                </p>
                <button 
                  onClick={() => handleDelete(note.id)}
                  className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="min-h-25 flex flex-col items-center justify-center text-muted-foreground p-8 border-2 border-dashed border-border rounded-2xl bg-muted/20">
                <span>{note.users?.email ? (note.users.name || note.users.email.split("@")[0]) : t('notes.unknown_user')}</span>
                <span>{new Date(note.created_at).toLocaleString(locale === "uk" ? "uk-UA" : "ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
