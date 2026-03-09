import { AppLayout } from "@/components/layout/AppLayout";
import { Bot, Send, User, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { useInsights } from "@/hooks/use-insights";
import { useCompany } from "@/hooks/use-company";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const suggestedQuestions = [
  "How much can I spend next month?",
  "Why did expenses increase?",
  "Tell me about my cash position",
  "How is my burn rate currently?",
];

const AIAssistant = () => {
  const { company } = useCompany();
  const { chat } = useInsights(company?.id);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI CFO assistant. I have access to all your financial data and can help you make better financial decisions. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = async (text?: string) => {
    const message = text || input;
    if (!message.trim() || !company) return;

    const userMessage: Message = { role: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const response = await chat.mutateAsync({
        message,
        companyId: company.id
      });

      setMessages((prev) => [...prev, {
        role: "assistant",
        content: response.content || "I'm processing your financial data. Could you rephrase that?"
      }]);
    } catch (error) {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "I'm having trouble accessing the financial engine right now. Please try again in a moment."
      }]);
    }
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-7rem)] flex-col max-w-[800px] animate-fade-in">
        <div className="mb-6">
          <div className="flex items-center gap-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/10">
              <Sparkles className="h-4 w-4 text-accent" />
            </div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">AI Copilot</h1>
          </div>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Digital CFO with real-time access to your company infrastructure</p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pb-6 px-1">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3.5 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 border border-accent/20">
                  <Bot className="h-4 w-4 text-accent" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed shadow-sm ${msg.role === "user"
                    ? "bg-primary text-white font-medium rounded-tr-none"
                    : "bg-white border border-border/60 text-foreground rounded-tl-none"
                  }`}
              >
                {msg.content.split("\n").map((line, j) => (
                  <p key={j} className={j > 0 ? "mt-2" : ""}>
                    {line.split("**").map((part, k) =>
                      k % 2 === 1 ? (
                        <strong key={k} className="font-bold">{part}</strong>
                      ) : (
                        <span key={k}>{part}</span>
                      )
                    )}
                  </p>
                ))}
              </div>
              {msg.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                  <User className="h-4 w-4 text-primary" />
                </div>
              )}
            </div>
          ))}
          {chat.isPending && (
            <div className="flex gap-3.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 animate-pulse">
                <Bot className="h-4 w-4 text-accent/40" />
              </div>
              <div className="bg-white border border-border/40 rounded-2xl px-6 py-4 rounded-tl-none shadow-sm flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-accent/50" />
                <span className="text-xxs font-bold uppercase tracking-widest text-muted-foreground/40">Analyzing Atlas Intelligence...</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto space-y-4">
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  disabled={chat.isPending}
                  className="rounded-full border border-border/60 bg-white px-4 py-1.5 text-[12px] font-medium text-foreground hover:border-primary/40 hover:bg-primary/[0.02] transition-all active:scale-95 disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-white p-2.5 shadow-lg focus-within:border-primary/40 transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !chat.isPending && handleSend()}
              disabled={chat.isPending}
              placeholder="Message your financial operating system..."
              className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground/50 outline-none px-2"
            />
            <button
              onClick={() => handleSend()}
              disabled={chat.isPending || !input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 shadow-md"
            >
              {chat.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-center text-[10px] text-muted-foreground/40 font-medium uppercase tracking-widest">
            AI can make financial mistakes. Always verify critical decisions.
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default AIAssistant;
