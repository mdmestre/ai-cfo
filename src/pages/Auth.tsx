import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (error) throw error;
        toast({
          title: "Account created",
          description: "Check your email to confirm your account.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-foreground via-foreground to-accent/20" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-background">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <span className="text-[13px] font-bold text-accent-foreground">A</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">Atlas</span>
          </div>
          <div className="max-w-sm">
            <h1 className="text-[32px] font-bold tracking-tight leading-[1.15]">
              Your AI-powered<br />financial copilot
            </h1>
            <p className="mt-4 text-[15px] text-background/60 leading-relaxed">
              Real-time cash management, intelligent forecasting, and automated financial operations — all in one platform.
            </p>
          </div>
          <p className="text-[12px] text-background/30">© {new Date().getFullYear()} Atlas Financial Inc.</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm space-y-8">
          <div>
            <div className="lg:hidden flex items-center gap-2.5 mb-8">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
                <span className="text-[11px] font-bold text-accent-foreground">A</span>
              </div>
              <span className="text-[15px] font-semibold tracking-tight text-foreground">Atlas</span>
            </div>
            <h2 className="text-[22px] font-bold tracking-tight text-foreground">
              {isLogin ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              {isLogin ? "Sign in to access your financial dashboard" : "Get started with Atlas in minutes"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLogin && (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-2.5 focus-within:border-foreground/30 transition-colors">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
                />
              </div>
            )}

            <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-2.5 focus-within:border-foreground/30 transition-colors">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-2.5 focus-within:border-foreground/30 transition-colors">
              <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-[13px] font-semibold text-background hover:bg-foreground/90 transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign in" : "Create account"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] text-muted-foreground">OR</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <p className="text-center text-[13px] text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-semibold text-foreground hover:underline"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
