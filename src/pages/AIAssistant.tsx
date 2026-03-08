import { AppLayout } from "@/components/layout/AppLayout";
import { Bot, Send, User, Sparkles } from "lucide-react";
import { useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const suggestedQuestions = [
  "How much can I spend next month?",
  "Why did expenses increase?",
  "Will my company run out of cash?",
  "What's my revenue forecast for Q2?",
];

const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI CFO assistant. I have access to all your financial data and can help you make better financial decisions. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = (text?: string) => {
    const message = text || input;
    if (!message.trim()) return;

    const userMsg: Message = { role: "user", content: message };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulated AI response
    setTimeout(() => {
      let response = "";
      if (message.toLowerCase().includes("spend")) {
        response =
          "Based on your current cash position of $1.24M and projected expenses of ~$310K/month, you have approximately **$170K in discretionary spending** available next month while maintaining a healthy 3-month cash runway.\n\nHowever, I'd recommend keeping at least $50K as a buffer given the upcoming payroll cycle on the 15th.";
      } else if (message.toLowerCase().includes("expense")) {
        response =
          "Your expenses increased by **$18,200 (6.2%)** compared to last month. The main drivers are:\n\n1. **Software subscriptions** — up $4,800 (new Hubspot tier)\n2. **Travel** — up $6,400 (Q1 client meetings)\n3. **Infrastructure** — up $3,200 (AWS scaling)\n\nI recommend reviewing the 3 overlapping project management tools which could save ~$2,400/month.";
      } else if (message.toLowerCase().includes("run out") || message.toLowerCase().includes("cash")) {
        response =
          "At your current burn rate of **$310K/month** with revenue of **$480K/month**, you have a healthy positive cash flow of $170K/month.\n\nYour cash runway is approximately **7.3 months** even with zero revenue. However, if the top client (38% of revenue) were to churn, runway would drop to **2.8 months**. I strongly recommend diversifying your client base.";
      } else {
        response =
          "Based on your financial data, here's what I can tell you:\n\n- **Cash Position**: $1.24M (healthy)\n- **Monthly Net**: +$170K\n- **Health Score**: 78/100\n\nWould you like me to dive deeper into any specific area?";
      }

      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    }, 1000);
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-7rem)] flex-col">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <h1 className="text-2xl font-semibold text-foreground">AI Assistant</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Ask anything about your company's finances</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent">
                  <Bot className="h-4 w-4 text-accent-foreground" />
                </div>
              )}
              <div
                className={`max-w-2xl rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-foreground"
                }`}
              >
                {msg.content.split("\n").map((line, j) => (
                  <p key={j} className={j > 0 ? "mt-2" : ""}>
                    {line.split("**").map((part, k) =>
                      k % 2 === 1 ? (
                        <strong key={k} className="font-semibold">{part}</strong>
                      ) : (
                        <span key={k}>{part}</span>
                      )
                    )}
                  </p>
                ))}
              </div>
              {msg.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Suggested questions */}
        {messages.length === 1 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about your finances..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            onClick={() => handleSend()}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default AIAssistant;
