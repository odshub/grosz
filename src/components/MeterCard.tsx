"use client";

import { useState, useEffect, useCallback } from "react";
import { addMeterReading, deleteMeter, deleteMeterReading, updateMeterReading } from "@/app/actions";
import { useDialog } from "./DialogProvider";

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

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const datePart = dateStr.split('T')[0];
  const parts = datePart.split('-');
  if (parts.length >= 3) {
    return `${parts[2].padStart(2, '0')}.${parts[1].padStart(2, '0')}.${parts[0]}`;
  }
  return dateStr;
}

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function MeterCard({ meter, readings, texts }: MeterCardProps) {
  const { showConfirm } = useDialog();
  const [isAdding, setIsAdding] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [searchMonth, setSearchMonth] = useState("");
  const [editingReadingId, setEditingReadingId] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchStream, setTorchStream] = useState<MediaStream | null>(null);

  const sortedReadings = [...readings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const suggestedPreviousReading = sortedReadings.length > 0 ? sortedReadings[0].current_reading : 0;
  const suggestedPrice = sortedReadings.length > 0 ? sortedReadings[0].price_per_unit : meter.default_price_per_unit || 0;

  // Torch toggle
  const toggleTorch = useCallback(async () => {
    if (torchOn && torchStream) {
      torchStream.getTracks().forEach(t => t.stop());
      setTorchStream(null);
      setTorchOn(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      const track = stream.getVideoTracks()[0];
      // @ts-expect-error - torch constraint is not in standard TS types
      await track.applyConstraints({ advanced: [{ torch: true }] });
      setTorchStream(stream);
      setTorchOn(true);
    } catch {
      alert(texts.torch_not_supported || 'Ліхтарик не підтримується');
    }
  }, [torchOn, torchStream, texts]);

  // Cleanup torch on unmount
  useEffect(() => {
    return () => {
      torchStream?.getTracks().forEach(t => t.stop());
    };
  }, [torchStream]);

  const turnOffTorch = useCallback(() => {
    if (torchStream) {
      torchStream.getTracks().forEach(t => t.stop());
      setTorchStream(null);
      setTorchOn(false);
    }
  }, [torchStream]);

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
      alert("Error: " + result.error);
    } else {
      setIsAdding(false);
      turnOffTorch();
    }
    setIsPending(false);
  }

  async function handleDeleteMeter() {
    const confirmed = await showConfirm(texts.delete_confirm);
    if (!confirmed) return;
    setIsPending(true);
    await deleteMeter(meter.id);
  }

  async function handleDeleteReading(readingId: string) {
    const confirmed = await showConfirm(texts.delete_reading_confirm || texts.delete_confirm);
    if (!confirmed) return;
    await deleteMeterReading(readingId);
    if (sortedReadings.length <= 1) setIsHistoryExpanded(false);
  }

  async function handleEditReading(readingId: string, formData: FormData) {
    const previousReading = parseFloat(formData.get("previousReading") as string);
    const currentReading = parseFloat(formData.get("currentReading") as string);

    if (currentReading < previousReading) {
      alert(texts.validation_reading_less);
      return;
    }

    setIsPending(true);
    const result = await updateMeterReading(readingId, formData);
    if (result && result.error) {
      alert("Error: " + result.error);
    } else {
      setEditingReadingId(null);
    }
    setIsPending(false);
  }

  function renderEditForm(reading: MeterReading) {
    return (
      <form
        action={(formData) => handleEditReading(reading.id, formData)}
        className="space-y-3 bg-muted/50 p-3 rounded-xl border border-primary/30"
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">{texts.date}</label>
            <input
              type="date"
              name="date"
              required
              defaultValue={reading.date.split('T')[0].slice(0, 10)}
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
              defaultValue={reading.price_per_unit}
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
              defaultValue={reading.previous_reading}
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
              defaultValue={reading.current_reading}
              className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 bg-primary text-primary-foreground py-2 rounded-xl font-medium text-sm"
          >
            {isPending ? texts.saving : (texts.save || 'Зберегти')}
          </button>
          <button
            type="button"
            onClick={() => setEditingReadingId(null)}
            disabled={isPending}
            className="flex-1 bg-muted text-foreground py-2 rounded-xl font-medium text-sm"
          >
            {texts.cancel}
          </button>
        </div>
      </form>
    );
  }

  function renderReadingCard(reading: MeterReading, isInModal = false) {
    if (editingReadingId === reading.id) {
      return <div key={reading.id}>{renderEditForm(reading)}</div>;
    }

    return (
      <div
        key={reading.id}
        className={`${isInModal ? 'p-4' : 'p-3'} bg-muted/30 rounded-xl border border-border flex flex-col gap-2`}
      >
        <div className="flex justify-between items-center">
          <span className="font-semibold">{formatDate(reading.date)}</span>
          <div className="flex items-center gap-1">
            <span className="font-bold text-emerald-600 dark:text-emerald-400 mr-1">
              {reading.total_cost.toFixed(2)} PLN
            </span>
            <button
              onClick={() => setEditingReadingId(reading.id)}
              className="p-1.5 text-muted-foreground hover:text-primary rounded-md transition-colors"
              title={texts.edit || 'Редагувати'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            </button>
            <button
              onClick={() => handleDeleteReading(reading.id)}
              className="p-1.5 text-muted-foreground hover:text-red-500 rounded-md transition-colors"
              title={texts.delete}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </div>

        <div className={`grid grid-cols-3 gap-2 text-xs text-muted-foreground ${isInModal ? 'bg-muted/20 p-2.5 rounded-lg border border-border/50' : ''}`}>
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
      </div>
    );
  }

  return (
    <div className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-muted/30 flex justify-between items-center border-b border-border">
        <div>
          <h3 className="font-bold text-lg">{meter.name}</h3>
          <p className="text-sm text-muted-foreground">{texts.unit}: {meter.unit}</p>
        </div>
        <button
          onClick={handleDeleteMeter}
          className="text-muted-foreground hover:text-red-500 p-2 transition-colors"
          title={texts.delete}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </button>
      </div>

      <div className="p-4">
        {/* Add Reading Form */}
        {isAdding ? (
          <form action={handleAddReading} className="space-y-3 bg-muted/50 p-4 rounded-xl mb-4 border border-border">
            {/* Header with torch */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{texts.add_reading}</span>
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-2 rounded-lg border transition-colors ${
                  torchOn
                    ? 'bg-yellow-400/20 border-yellow-400 text-yellow-500'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
                title={texts.torch || 'Ліхтарик'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={torchOn ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6c0 2-2 2-2 4v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V10c0-2-2-2-2-4V2h12z"/>
                  <line x1="9" y1="2" x2="9" y2="6"/><line x1="15" y1="2" x2="15" y2="6"/>
                </svg>
              </button>
            </div>

            {/* Single column layout — no overlapping */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">{texts.date}</label>
                <input
                  type="date"
                  name="date"
                  required
                  defaultValue={getTodayStr()}
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

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl font-medium"
              >
                {isPending ? texts.saving : texts.add_reading}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  turnOffTorch();
                }}
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

        {/* Latest Reading */}
        <div className="space-y-3">
          <div
            className="flex justify-between items-center cursor-pointer select-none"
            onClick={() => sortedReadings.length > 1 && setIsHistoryExpanded(true)}
          >
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">{texts.history}</h4>
            {sortedReadings.length > 1 && (
              <button className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm">
                {texts.all_records || 'Всі записи'} ({sortedReadings.length})
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                </svg>
              </button>
            )}
          </div>

          {sortedReadings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">{texts.no_history}</p>
          ) : (
            <div className="space-y-2">
              {renderReadingCard(sortedReadings[0])}
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
              <button
                onClick={() => { setIsHistoryExpanded(false); setEditingReadingId(null); }}
                className="p-2 text-muted-foreground hover:text-foreground bg-background border border-border rounded-lg"
              >
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
                sortedReadings.filter(r => r.date.includes(searchMonth)).map((reading) =>
                  renderReadingCard(reading, true)
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
