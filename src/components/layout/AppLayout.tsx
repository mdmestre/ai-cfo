import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { TopNavbar } from "./TopNavbar";
import { AICopilot } from "../ai/AICopilot";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col ml-[220px] transition-all duration-200">
        <TopNavbar />
        <main className="flex-1 px-8 py-6">
          {children}
        </main>
        <AICopilot />
      </div>
    </div>
  );
}
