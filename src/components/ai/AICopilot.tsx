import React, { useState, useRef, useEffect } from 'react';
import { useCompany } from '@/hooks/use-company';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Bot, User, Send, X, MessageSquare, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { streamChat, type AiMessage } from '@/lib/ai-stream';
import { toast } from 'sonner';

export function AICopilot() {
    const { company } = useCompany();
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<AiMessage[]>([
        { role: 'assistant', content: "Oi! Eu sou o Atlas AI, seu CFO digital. Quer olhar caixa, impostos, alertas ou previsao de 90 dias?" }
    ]);
    const [isStreaming, setIsStreaming] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!message.trim() || !company || isStreaming) return;

        const userMsg: AiMessage = { role: 'user', content: message.trim() };
        setMessage('');
        setMessages(prev => [...prev, userMsg]);
        setIsStreaming(true);

        let assistantSoFar = '';
        const upsert = (chunk: string) => {
            assistantSoFar += chunk;
            setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'user') {
                    return [...prev, { role: 'assistant' as const, content: assistantSoFar }];
                }
                return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
            });
        };

        try {
            await streamChat({
                messages: [...messages, userMsg],
                companyId: company.id,
                onDelta: upsert,
                onDone: () => setIsStreaming(false),
                onError: (err) => { toast.error(err); setIsStreaming(false); },
            });
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Falha de rede. Tente novamente.' }]);
            setIsStreaming(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 animate-fade-in"
                >
                    <MessageSquare className="h-6 w-6" />
                </Button>
            )}

            {isOpen && (
                <Card className="w-96 h-[500px] flex flex-col shadow-2xl animate-slide-up border-primary/20 bg-background/95 backdrop-blur-sm">
                    <div className="p-4 border-b bg-primary text-primary-foreground flex items-center justify-between rounded-t-lg">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-yellow-400" />
                            <div className="font-semibold">Atlas AI Copilot</div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-primary-foreground hover:bg-white/10">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                        {messages.map((msg, i) => (
                            <div key={i} className={cn("flex gap-3 animate-fade-in", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                                <div className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                    msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                                )}>
                                    {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                </div>
                                <div className={cn(
                                    "p-3 rounded-2xl text-[13px] leading-relaxed max-w-[80%] shadow-sm",
                                    msg.role === 'user'
                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                        : "bg-card border text-foreground rounded-tl-none font-medium"
                                )}>
                                    {msg.content.split("\n").map((line, j) => (
                                        <p key={j} className={j > 0 ? "mt-1.5" : ""}>
                                            {line.split("**").map((part, k) =>
                                                k % 2 === 1 ? <strong key={k}>{part}</strong> : <span key={k}>{part}</span>
                                            )}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
                            <div className="flex gap-3 animate-fade-in">
                                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                                    <Bot className="h-4 w-4" />
                                </div>
                                <div className="p-3 rounded-2xl bg-card border flex items-center gap-2 rounded-tl-none shadow-sm">
                                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Analisando</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t flex gap-2">
                        <Input
                            placeholder="Pergunte sobre seu caixa, impostos, clientes..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            disabled={isStreaming}
                            className="bg-secondary/30"
                        />
                        <Button size="icon" onClick={handleSend} disabled={isStreaming || !message.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
}
