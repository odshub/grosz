import { MobileAppLayout } from "@/components/MobileAppLayout";
import { AppHeader } from "@/components/AppHeader";
import { supabaseAdmin } from "@/lib/supabase";
import { NotepadClient } from "@/components/NotepadClient";
import { getTranslation } from "@/lib/i18n";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function NotepadPage() {
  type Note = {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    users?: { email: string; name?: string | null } | null;
  };
  const t = await getTranslation();
  
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("email", session.user.email)
    .single();

  if (!user) {
    return <div className="p-4 text-center">User not found in database.</div>;
  }

  // Fetch all notes (with users)
  const { data: notes } = await supabaseAdmin
    .from("notes")
    .select(`
      *,
      users (email, name)
    `)
    .order("created_at", { ascending: false });

  const typedNotes = (notes || []) as unknown as Note[];

  return (
    <MobileAppLayout>
      <div className="p-4 h-full flex flex-col space-y-4">
        <AppHeader title={t('page.notes') as string} />
        <p className="text-sm text-muted-foreground">
          {t('page.notes_desc')}
        </p>
        
        <div className="flex-1 overflow-hidden">
          <NotepadClient 
            initialNotes={typedNotes} 
            currentUser={{ email: user.email, id: user.id, name: user.name }} 
          />
        </div>
      </div>
    </MobileAppLayout>
  );
}
