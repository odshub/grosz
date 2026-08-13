"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";

interface Props {
  fallbackText: string;
}

export function EditableGreeting({ fallbackText }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("groszyk_card_title") || fallbackText;
    }
    return fallbackText;
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    const newText = text.trim();
    if (newText.length > 0) {
      localStorage.setItem("groszyk_card_title", newText);
      setText(newText);
    } else {
      const saved = localStorage.getItem("groszyk_card_title") || fallbackText;
      setText(saved);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      const saved = localStorage.getItem("groszyk_card_title") || fallbackText;
      setText(saved);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="bg-transparent border-b border-emerald-400/50 outline-none font-bold text-lg tracking-widest text-slate-300 w-40 focus:border-emerald-400"
        />
      </div>
    );
  }

  return (
    <div 
      className="group flex items-center gap-2 cursor-pointer"
      onClick={() => setIsEditing(true)}
      title="Редагувати напис"
    >
      <span suppressHydrationWarning className="font-bold text-lg tracking-widest text-slate-300 opacity-70 transition-opacity group-hover:opacity-100">
        {text}
      </span>
      <Pencil className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
