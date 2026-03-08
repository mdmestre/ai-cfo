import { useState } from "react";
import { useCompany } from "@/hooks/use-company";
import { Building2, Loader2 } from "lucide-react";

export function CompanySetup() {
  const [name, setName] = useState("");
  const { createCompany } = useCompany();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) createCompany.mutate(name.trim());
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
            <Building2 className="h-5 w-5 text-accent-foreground" />
          </div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Set up your company</h1>
          <p className="text-[13px] text-muted-foreground">Enter your company name to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Company name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={createCompany.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2 text-[13px] font-medium text-background hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {createCompany.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create company
          </button>
        </form>
      </div>
    </div>
  );
}
