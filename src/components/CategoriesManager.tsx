"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
import { addCategory, updateCategory } from "@/app/actions";
import { useTranslation } from "@/lib/i18n/client";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface CategoriesManagerProps {
  categories: Category[];
  scope?: "PERSONAL" | "SHARED";
}

export function CategoriesManager({ categories, scope = "PERSONAL" }: CategoriesManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // State for creating/editing
  const [isEditing, setIsEditing] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#3b82f6");
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  function handleAddClick() {
    setIsEditing(true);
    setEditingCategoryId(null);
    setNewCatName("");
    setNewCatColor("#3b82f6");
  }

  function handleEditClick(cat: Category) {
    setIsEditing(true);
    setEditingCategoryId(cat.id);
    setNewCatName(cat.name);
    setNewCatColor(cat.color);
  }

  async function handleSaveCategory() {
    if (!newCatName) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("name", newCatName);
    fd.append("color", newCatColor);
    
    if (editingCategoryId) {
      await updateCategory(editingCategoryId, fd);
    } else {
      fd.append("scope", scope);
      await addCategory(fd);
    }
    
    setIsEditing(false);
    setEditingCategoryId(null);
    setNewCatName("");
    setLoading(false);
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-1.5 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
        title={t('cat.manage_categories') as string}
      >
        <Settings2 className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-60 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="w-full max-w-md bg-background rounded-t-2xl sm:rounded-xl shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <h2 className="text-xl font-bold">{t('cat.title')}</h2>
              <button onClick={() => setIsOpen(false)} className="p-2 text-muted-foreground hover:bg-muted rounded-full">
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {!isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {categories.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">{t('cat.empty')}</p>
                    )}
                    {categories.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: c.color }} />
                          <span className="font-medium">{c.name}</span>
                        </div>
                        <button onClick={() => handleEditClick(c)} className="text-xs text-primary font-medium hover:underline">
                          {t('cat.change')}
                        </button>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={handleAddClick}
                    className="w-full p-4 bg-primary/10 text-primary font-bold rounded-xl shadow-sm hover:bg-primary/20 transition-colors"
                  >
                    {t('cat.add')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder={t('cat.name_placeholder') as string} 
                    value={newCatName} 
                    onChange={e => setNewCatName(e.target.value)} 
                    className="w-full p-3 rounded-lg border border-border outline-none bg-background" 
                    autoFocus
                  />
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">{t('cat.color')}</p>
                    <div className="flex gap-3 flex-wrap">
                      {["#ef4444", "#f97316", "#f59e0b", "#10b981", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#64748b"].map(c => (
                        <button 
                          type="button" 
                          key={c} 
                          onClick={() => setNewCatColor(c)} 
                          className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${newCatColor === c ? 'border-foreground scale-110 shadow-sm' : 'border-transparent'}`} 
                          style={{ backgroundColor: c }} 
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" disabled={loading} onClick={handleSaveCategory} className="flex-1 p-3 bg-primary text-primary-foreground font-bold rounded-xl text-sm">
                      {loading ? "..." : t('btn.save')}
                    </button>
                    <button type="button" onClick={() => setIsEditing(false)} className="flex-1 p-3 bg-muted border border-border rounded-xl text-sm font-bold">
                      {t('btn.cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
