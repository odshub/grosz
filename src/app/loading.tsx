import { getTranslation } from "@/lib/i18n";

export default async function Loading() {
  const t = await getTranslation();

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] w-full animate-in fade-in zoom-in-95 duration-500">
      <div className="relative flex items-center justify-center w-24 h-24 mb-8">
        {/* Світіння на фоні */}
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl animate-pulse" />
        
        {/* Зовнішнє кільце */}
        <div className="absolute inset-0 rounded-full border-y-[1.5px] border-primary/20 animate-[spin_3s_linear_infinite]" />
        
        {/* Внутрішнє кільце */}
        <div className="absolute inset-3 rounded-full border-x-[1.5px] border-primary/50 animate-[spin_2s_linear_infinite_reverse]" />
        
        {/* Центральне ядро */}
        <div className="absolute inset-8 rounded-full bg-linear-to-tr from-primary/80 to-primary/40 animate-pulse shadow-lg shadow-primary/20" />
      </div>
      
      <div className="flex flex-col items-center space-y-2">
        <h3 className="text-xl font-medium tracking-tight text-foreground/90">
          {t('app.loading_title')}
        </h3>
        <p className="text-sm text-muted-foreground/80 animate-pulse font-light tracking-wide">
          {t('app.loading_subtitle')}
        </p>
      </div>
    </div>
  );
}
