import { PiggyBank, CircleDollarSign } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] w-full animate-in fade-in duration-300">
      <div className="relative flex flex-col items-center justify-center mb-6 w-24 h-24">
        {/* Монетка, що стрибає */}
        <div className="absolute -top-6 animate-bounce z-10">
          <CircleDollarSign className="w-8 h-8 text-yellow-500 fill-yellow-500/20" strokeWidth={1.5} />
        </div>
        
        {/* Скарбничка */}
        <PiggyBank className="w-16 h-16 text-primary relative z-20" strokeWidth={1.5} />
        
        {/* Тінь / світіння під скарбничкою */}
        <div className="absolute bottom-0 w-16 h-4 bg-primary/20 blur-md rounded-[100%] animate-pulse"></div>
      </div>
      <p className="text-muted-foreground font-medium animate-pulse text-lg tracking-wide">
        Рахуємо копієчки...
      </p>
    </div>
  );
}
