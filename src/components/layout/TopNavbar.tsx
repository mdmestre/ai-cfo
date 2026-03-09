import { Search, Bell, ChevronDown, Building, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/use-profile";
import { useCompany } from "@/hooks/use-company";

export function TopNavbar() {
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const { company } = useCompany();

  const displayName = profile?.name || profile?.email || "";
  const initials = displayName
    ? displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-border/60 bg-card/80 backdrop-blur-sm px-8">
      {/* Search */}
      <div className="flex items-center gap-2 rounded-lg bg-background border border-border/50 px-3 py-1.5 w-full max-w-xs">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search..."
          className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
        />
        <kbd className="hidden rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
          ⌘K
        </kbd>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1.5 ml-4">
        <button className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-foreground hover:bg-secondary transition-colors">
          <Building className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="hidden sm:inline">{company?.name || "Company"}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>

        <div className="h-4 w-px bg-border mx-1" />

        <button className="relative rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
          <Bell className="h-4 w-4" />
        </button>

        <button className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background text-[11px] font-semibold hover:opacity-80 transition-opacity">
          {initials}
        </button>

        <button
          onClick={signOut}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
