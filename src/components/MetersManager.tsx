"use client";

import { useState } from "react";
import { addMeter } from "@/app/actions";
import { MeterCard } from "./MeterCard";

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

interface MetersManagerProps {
  meters: Meter[];
  readings: MeterReading[];
  texts: Record<string, string>;
}

export function MetersManager({ meters, readings, texts }: MetersManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleAddMeter(formData: FormData) {
    setIsPending(true);
    const result = await addMeter(formData);
    if (result && result.error) {
      alert("Error adding meter: " + result.error);
    } else {
      setIsAdding(false);
    }
    setIsPending(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-2 border-b border-border">
        <h2 className="text-xl font-semibold">{texts.title}</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="text-primary font-medium flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          {texts.add}
        </button>
      </div>

      {isAdding && (
        <form action={handleAddMeter} className="bg-card p-5 rounded-2xl border border-border shadow-sm space-y-4">
          <h3 className="font-semibold">{texts.add}</h3>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">{texts.name}</label>
              <input 
                type="text" 
                name="name" 
                required 
                placeholder={texts.name_placeholder}
                className="w-full p-3 rounded-xl border border-border bg-background"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">{texts.unit}</label>
                <input 
                  type="text" 
                  name="unit" 
                  required 
                  placeholder={texts.unit_placeholder}
                  className="w-full p-3 rounded-xl border border-border bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{texts.price} (необов&apos;язково)</label>
                <input 
                  type="number" 
                  name="defaultPricePerUnit" 
                  step="0.0001"
                  placeholder="0.00"
                  className="w-full p-3 rounded-xl border border-border bg-background"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button 
              type="submit" 
              disabled={isPending}
              className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-medium"
            >
              {isPending ? texts.saving : texts.add}
            </button>
            <button 
              type="button" 
              onClick={() => setIsAdding(false)}
              disabled={isPending}
              className="flex-1 bg-muted text-foreground py-3 rounded-xl font-medium"
            >
              {texts.cancel}
            </button>
          </div>
        </form>
      )}

      {meters.length === 0 ? (
        <div className="text-center py-10 bg-muted/30 rounded-2xl border border-dashed border-border">
          <p className="text-muted-foreground">{texts.empty}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {meters.map(meter => {
            const meterReadings = readings.filter(r => r.meter_id === meter.id);
            return (
              <MeterCard 
                key={meter.id} 
                meter={meter} 
                readings={meterReadings} 
                texts={texts} 
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
