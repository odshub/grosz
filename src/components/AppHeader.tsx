import { ProfileModal } from "./ProfileModal";
import Image from "next/image";

export function AppHeader({ title }: { title: string }) {
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Image src="/icon.png" alt="Logo" width={32} height={32} className="rounded-lg object-contain shrink-0" />
        <h1 className="text-2xl font-bold truncate">{title}</h1>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <ProfileModal />
      </div>
    </header>
  );
}
