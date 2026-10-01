"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/client";

interface CustomDatePickerProps {
  name: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
}

const MONTHS = {
  uk: [
    "Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
    "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"
  ],
  ru: [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ]
};

const DAYS = {
  uk: ["Пн", "Вв", "Ср", "Чт", "Пт", "Сб", "Нд"],
  ru: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
};

export function CustomDatePicker({ name, defaultValue, required, className = "" }: CustomDatePickerProps) {
  const { locale } = useTranslation();
  const lang = (locale as "uk" | "ru") || "uk";
  
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState<Date | null>(defaultValue ? new Date(defaultValue) : null);
  
  const [currentMonth, setCurrentMonth] = useState(date ? date.getMonth() : new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(date ? date.getFullYear() : new Date().getFullYear());

  const modalRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const formattedDate = date 
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` 
    : "";
    
  const displayDate = date 
    ? `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}` 
    : (lang === 'ru' ? 'Выберите дату' : 'Оберіть дату');

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  // Adjust for Monday start
  const startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const selectDate = (d: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newDate = new Date(currentYear, currentMonth, d, 12, 0, 0);
    setDate(newDate);
    setIsOpen(false);
  };

  // Generate calendar grid
  const renderCalendarDays = () => {
    const days = [];
    
    // Empty slots
    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2" />);
    }
    
    // Day numbers
    for (let i = 1; i <= daysInMonth; i++) {
      const isSelected = date?.getDate() === i && date?.getMonth() === currentMonth && date?.getFullYear() === currentYear;
      const isToday = new Date().getDate() === i && new Date().getMonth() === currentMonth && new Date().getFullYear() === currentYear;
      
      days.push(
        <button
          type="button"
          key={i}
          onClick={(e) => selectDate(i, e)}
          className={`p-2 w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
            isSelected
              ? 'bg-primary text-primary-foreground'
              : isToday
                ? 'bg-muted text-foreground border border-border'
                : 'hover:bg-muted text-foreground'
          }`}
        >
          {i}
        </button>
      );
    }
    
    return days;
  };

  return (
    <div className="relative">
      <input type="hidden" name={name} value={formattedDate} required={required} />
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between text-left ${className} ${!date ? 'text-muted-foreground' : 'text-foreground'}`}
      >
        <span>{displayDate}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 sm:absolute sm:inset-auto sm:top-full sm:left-0 sm:mt-1 sm:bg-transparent">
          <div 
            ref={modalRef} 
            className="bg-card border border-border p-4 rounded-2xl shadow-xl w-[320px] animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <button type="button" onClick={handlePrevMonth} className="p-2 hover:bg-muted rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <div className="font-bold text-base">
                {MONTHS[lang][currentMonth]} {currentYear}
              </div>
              <button type="button" onClick={handleNextMonth} className="p-2 hover:bg-muted rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS[lang].map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">
                  {d}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1 place-items-center">
              {renderCalendarDays()}
            </div>

            <div className="mt-4 flex justify-between items-center border-t border-border pt-3 sm:hidden">
              <button 
                type="button" 
                onClick={() => setIsOpen(false)}
                className="w-full bg-muted text-foreground py-2.5 rounded-xl font-medium"
              >
                {lang === 'ru' ? 'Закрыть' : 'Закрити'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
