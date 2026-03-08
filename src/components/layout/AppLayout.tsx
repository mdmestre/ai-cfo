import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { TopNavbar } from "./TopNavbar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-secondary/50">
      <AppSidebar />
      <div className="flex flex-1 flex-col ml-[240px] transition-all duration-200">
        <TopNavbar />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
