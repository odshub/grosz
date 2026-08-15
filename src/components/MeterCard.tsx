"use client";

import { useState } from "react";
import { addMeterReading, deleteMeter, deleteMeterReading } from "@/app/actions";

type Meter = {
  id: string;
  name: string;
  unit: string;
  default_price_per_unit: number | null;
};

type MeterReading = {
  id: string;
  meter_id: string;
  date: string;
  previous_reading: number;
  current_reading: number;
  price_per_unit: number;
  total_cost: number;
  created_at: string;
};

interface MeterCardProps {
  meter: Meter;
  readings: MeterReading[];
  texts: Record<string, string>;
}

export function MeterCard({ meter, readings, texts }: MeterCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isConfirmDelete, setIsConfirmDelete] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [searchMonth, setSearchMonth] = useState("");

  // Sorting readings by date descending (newest first)
  const sortedReadings = [...readings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Suggest the previous reading as the current reading of the latest entry
  const suggestedPreviousReading = sortedReadings.length > 0 ? sortedReadings[0].current_reading : 0;
  // Suggest the price from the latest entry, or default
  const suggestedPrice = sortedReadings.length > 0 ? sortedReadings[0].price_per_unit : meter.default_price_per_unit || 0;

  async function handleAddReading(formData: FormData) {
    const previousReading = parseFloat(formData.get("previousReading") as string);
    const currentReading = parseFloat(formData.get("currentReading") as string);

    if (currentReading < previousReading) {
      alert(texts.validation_reading_less || "Поточні показники не можуть бути меншими за попередні!");
      return;
    }

    setIsPending(true);
    formData.append("meterId", meter.id);
    const result = await addMeterReading(formData);
    if (result && result.error) {
      alert("Error adding reading: " + result.error);
    } else {
      setIsAdding(false);
    }
    setIsPending(false);
  }

  async function handleDeleteMeter() {
    setIsPending(true);
    await deleteMeter(meter.id);
    // Modal or component will unmount
  }

  return (
    <div className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border overflow-hidden">
      <div className="p-4 bg-muted/30 flex justify-between items-center border-b border-border">
        <div>
          <h3 className="font-bold text-lg">{meter.name}</h3>
          <p className="text-sm text-muted-foreground">{texts.unit}: {meter.unit}</p>
        </div>
        
        {isConfirmDelete ? (
          <div className="flex gap-2">
            <button 
              onClick={handleDeleteMeter} 
              disabled={isPending}
              className="px-3 py-1 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium"
            >
              {texts.delete_confirm}
            </button>
            <button 
              onClick={() => setIsConfirmDelete(false)} 
              disabled={isPending}
              className="px-3 py-1 bg-muted rounded-lg text-sm font-medium"
            >
              {texts.cancel}
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setIsConfirmDelete(true)}
            className="text-muted-foreground hover:text-destructive p-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
          </button>
        )}
      </div>

      <div className="p-4">
        {isAdding ? (
          <form action={handleAddReading} className="space-y-4 bg-muted/50 p-4 rounded-xl mb-4 border border-border">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">{texts.date}</label>
                <input 
                  type="month" 
                  name="date" 
                  required 
                  defaultValue={new Date().toISOString().slice(0, 7)}
                  className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">{texts.price}</label>
                <input 
                  type="number" 
                  name="pricePerUnit" 
                  step="0.0001" 
                  required 
                  defaultValue={suggestedPrice}
                  className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">{texts.prev_reading}</label>
                <input 
                  type="number" 
                  name="previousReading" 
                  step="0.01" 
                  required 
                  defaultValue={suggestedPreviousReading}
                  className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">{texts.current_reading}</label>
                <input 
                  type="number" 
                  name="currentReading" 
                  step="0.01" 
                  required 
                  className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                type="submit" 
                disabled={isPending}
                className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl font-medium"
              >
                {isPending ? texts.saving : texts.add_reading}
              </button>
              <button 
                type="button" 
                onClick={() => setIsAdding(false)} 
                disabled={isPending}
                className="flex-1 bg-muted text-foreground py-2.5 rounded-xl font-medium"
              >
                {texts.cancel}
              </button>
            </div>
          </form>
        ) : (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full py-3 border-2 border-dashed border-border rounded-xl text-muted-foreground font-medium mb-4 hover:bg-muted/50 hover:text-foreground transition-colors"
          >
            + {texts.add_reading}
          </button>
        )}

        <div className="space-y-3">
          <div 
            className="flex justify-between items-center cursor-pointer select-none"
            onClick={() => sortedReadings.length > 1 && setIsHistoryExpanded(true)}
          >
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">{texts.history}</h4>
            {sortedReadings.length > 1 && (
              <button className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm">
                {texts.all_records || 'Всі записи'} ({sortedReadings.length})
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                </svg>
              </button>
            )}
          </div>
          
          {sortedReadings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">{texts.no_history}</p>
          ) : (
            <div className="space-y-2">
              {/* Always show the latest reading */}
              {(() => {
                const reading = sortedReadings[0];
                return (
                  <div key={reading.id} className="p-3 bg-muted/30 rounded-xl border border-border flex flex-col gap-2 relative group">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{reading.date.slice(0, 7)}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{reading.total_cost.toFixed(2)} PLN</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <div>
                        <span className="block mb-0.5">{texts.prev_reading}</span>
                        <span className="font-medium text-foreground">{reading.previous_reading}</span>
                      </div>
                      <div>
                        <span className="block mb-0.5">{texts.current_reading}</span>
                        <span className="font-medium text-foreground">{reading.current_reading}</span>
                      </div>
                      <div>
                        <span className="block mb-0.5">{texts.price}</span>
                        <span className="font-medium text-foreground">{reading.price_per_unit}</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => deleteMeterReading(reading.id)}
                      className="absolute top-2 right-2 p-1.5 bg-destructive/10 text-destructive rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      title={texts.delete}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    </button>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* History Modal */}
      {isHistoryExpanded && (
        <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-background w-full max-w-md max-h-[85vh] rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 border-t sm:border border-border">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
              <h3 className="font-bold text-lg">{texts.history} ({meter.name})</h3>
              <button onClick={() => setIsHistoryExpanded(false)} className="p-2 text-muted-foreground hover:text-foreground bg-background border border-border rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-background">
              <div className="mb-4">
                <input 
                  type="month" 
                  value={searchMonth}
                  onChange={(e) => setSearchMonth(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-border bg-muted/30 text-foreground"
                />
              </div>
              
              {sortedReadings.filter(r => r.date.includes(searchMonth)).length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-4">{texts.nothing_found || 'Нічого не знайдено'}</p>
              ) : (
                sortedReadings.filter(r => r.date.includes(searchMonth)).map((reading) => (
                  <div key={reading.id} className="p-4 bg-muted/10 rounded-xl border border-border flex flex-col gap-3 relative group">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-base">{reading.date.slice(0, 7)}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">{reading.total_cost.toFixed(2)} PLN</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground bg-muted/20 p-2.5 rounded-lg border border-border/50">
                      <div>
                        <span className="block mb-0.5 text-xs">{texts.prev_reading}</span>
                        <span className="font-medium text-foreground">{reading.previous_reading}</span>
                      </div>
                      <div>
                        <span className="block mb-0.5 text-xs">{texts.current_reading}</span>
                        <span className="font-medium text-foreground">{reading.current_reading}</span>
                      </div>
                      <div>
                        <span className="block mb-0.5 text-xs">{texts.price}</span>
                        <span className="font-medium text-foreground">{reading.price_per_unit}</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        deleteMeterReading(reading.id);
                        if (sortedReadings.length === 1) setIsHistoryExpanded(false);
                      }}
                      className="absolute top-3 right-3 p-1.5 bg-destructive/10 text-destructive rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      title={texts.delete}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
