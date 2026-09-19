import React, { useState, useRef, useEffect } from "react";
import { X, Sparkles, Send, Bot, User, RefreshCw, Copy, Check } from "lucide-react";
import Markdown from "react-markdown";
import { apiService } from "../services/api.ts";

interface AIChatAssistantModalProps {
  onClose: () => void;
  candidateName: string;
}

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
}

export const AIChatAssistantModal: React.FC<AIChatAssistantModalProps> = ({
  onClose,
  candidateName,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-1",
      sender: "assistant",
      text: `Hello ${candidateName}! I'm your JobPilot AI Career Coach. I can analyze your resume qualifications, suggest missing ATS keywords, help rephrase bullet points with quantifiable impact, or review job offer salaries. What would you like to explore?`,
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const starterPrompts = [
    "How can I rephrase my resume bullets for higher ATS impact?",
    "What are the highest-paying skills for Senior Full Stack Engineers in 2026?",
    "How do I explain an experience gap during a technical interview?",
    "Help me negotiate a senior engineer base salary offer.",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    try {
      const history = messages.map((m) => ({
        role: m.sender === "user" ? ("user" as const) : ("model" as const),
        text: m.text,
      }));

      const reply = await apiService.sendChatMessage(text.trim(), history);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "assistant",
        text: reply,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: "assistant",
          text: "I encountered an issue connecting to the AI career advisor service. Please ensure your query is formulated clearly.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-xl h-[85vh] bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">JobPilot AI Career Coach</h2>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Context Loaded
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-800 text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.sender === "assistant" && (
                <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[82%] p-3 rounded-2xl leading-relaxed ${
                  m.sender === "user"
                    ? "bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/20 whitespace-pre-wrap"
                    : "bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none space-y-2"
                }`}
              >
                {m.sender === "assistant" ? (
                  <>
                    <div className="markdown-body space-y-2 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_strong]:text-indigo-300 [&_h3]:font-bold [&_h3]:text-white [&_h3]:text-xs [&_h3]:mb-1">
                      <Markdown>{m.text}</Markdown>
                    </div>
                    <div className="pt-1 flex items-center justify-end border-t border-slate-800/60">
                      <button
                        onClick={() => handleCopyMessage(m.text, m.id)}
                        className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-indigo-300 transition-colors py-0.5 px-1.5 rounded hover:bg-slate-900"
                        title="Copy answer to clipboard"
                      >
                        {copiedMessageId === m.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-medium">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Answer</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  m.text
                )}
              </div>

              {m.sender === "user" && (
                <div className="w-6 h-6 rounded-lg bg-slate-700 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-2.5 items-center text-slate-400 text-xs">
              <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <span className="animate-pulse">Thinking & evaluating career insights...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Starter Chips */}
        {messages.length < 3 && (
          <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {starterPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p)}
                className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-[11px] whitespace-nowrap transition-all"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Ask a question about your CV, interview prep, or job match..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isTyping}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
