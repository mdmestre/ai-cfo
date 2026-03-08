import { Search, Bell, ChevronDown, Building } from "lucide-react";

export function TopNavbar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background px-6">
      {/* Search */}
      <div className="flex items-center gap-2.5 rounded-md bg-secondary px-3 py-1.5 w-full max-w-sm">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
        <kbd className="hidden rounded bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground border border-border sm:inline-block">
          ⌘K
        </kbd>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 ml-4">
        {/* Company Selector */}
        <button className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-accent/10">
            <Building className="h-3.5 w-3.5 text-accent" />
          </div>
          <span className="hidden sm:inline text-[13px]">Acme Inc</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>

        <div className="h-5 w-px bg-border mx-1" />

        {/* Notifications */}
        <button className="relative rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
        </button>

        {/* Avatar */}
        <button className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity">
          JD
        </button>
      </div>
    </header>
  );
}
