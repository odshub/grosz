"use client";

import { useState } from "react";

interface TabsViewProps {
  tab1Title: string;
  tab2Title: string;
  tab1Content: React.ReactNode;
  tab2Content: React.ReactNode;
  floatingButton?: React.ReactNode;
}

export function TabsView({ 
  tab1Title, 
  tab2Title, 
  tab1Content, 
  tab2Content, 
  floatingButton 
}: TabsViewProps) {
  const [currentTab, setCurrentTab] = useState<"budget" | "envelopes">("budget");
  
  return (
    <>
      <div className="flex bg-muted p-1 rounded-xl mb-6">
        <button 
          onClick={() => setCurrentTab('budget')} 
          className={`flex-1 text-center py-2.5 rounded-lg text-sm font-semibold transition-all ${currentTab === 'budget' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          {tab1Title}
        </button>
        <button 
          onClick={() => setCurrentTab('envelopes')} 
          className={`flex-1 text-center py-2.5 rounded-lg text-sm font-semibold transition-all ${currentTab === 'envelopes' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          {tab2Title}
        </button>
      </div>
      
      {currentTab === 'budget' && tab1Content}
      {currentTab === 'envelopes' && tab2Content}
      
      {currentTab !== 'envelopes' && floatingButton}
    </>
  );
}
