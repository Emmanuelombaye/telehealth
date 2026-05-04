import { useState } from "react";
import { Send, Lock, Search, ChevronLeft, Paperclip, Smile } from "lucide-react";
import { Button, Badge, cn } from "../../../components/ui/shared";

const conversations = [
  { id: 1, name: "Dr. Sarah Johnson", role: "General Practice", lastMsg: "Your blood pressure looks good. Keep monitoring daily.", time: "2m", unread: 2, online: true },
  { id: 2, name: "Dr. Michael Chen", role: "Cardiology", lastMsg: "Please complete the cardiac intake form before our visit.", time: "1h", unread: 1, online: false },
  { id: 3, name: "Nurse Maria", role: "Care Coordinator", lastMsg: "Your prescription has been sent to the pharmacy.", time: "3h", unread: 0, online: true },
  { id: 4, name: "Dr. Amira Hassan", role: "Dermatology", lastMsg: "The photos you sent look like contact dermatitis.", time: "1d", unread: 0, online: false },
];

const mockMessages = [
  { id: 1, from: "doctor", text: "Hello John! How are you feeling today?", time: "10:00 AM" },
  { id: 2, from: "patient", text: "Hi Dr. Johnson! I've been having some chest tightness since yesterday.", time: "10:02 AM" },
  { id: 3, from: "doctor", text: "I see. On a scale of 1-10, how would you rate the discomfort?", time: "10:03 AM" },
  { id: 4, from: "patient", text: "About a 4. It comes and goes.", time: "10:05 AM" },
  { id: 5, from: "doctor", text: "Your blood pressure looks good based on your last reading. Keep monitoring daily and let me know if it gets worse. I'll order an ECG just to be safe.", time: "10:07 AM" },
];

export function MessagesPage() {
  const [active, setActive] = useState<number | null>(null);
  const [input, setInput] = useState("");

  const activeConv = conversations.find(c => c.id === active);

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {!active ? (
        <>
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div>
              <h1 className="text-xl font-bold">Messages</h1>
              <div className="flex items-center gap-1 mt-0.5">
                <Lock className="h-3 w-3 text-emerald-500" />
                <span className="text-xs text-emerald-600 font-medium">End-to-end encrypted</span>
              </div>
            </div>
          </div>

          <div className="relative mb-3 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input className="w-full pl-9 pr-4 py-2.5 bg-muted rounded-xl text-sm border-none focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Search messages..." />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1">
            {conversations.map(conv => (
              <button key={conv.id} onClick={() => setActive(conv.id)}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl hover:bg-accent transition-colors text-left">
                <div className="relative shrink-0">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                    {conv.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  {conv.online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold truncate">{conv.name}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{conv.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{conv.lastMsg}</p>
                </div>
                {conv.unread > 0 && (
                  <span className="h-5 w-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {conv.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Chat header */}
          <div className="flex items-center gap-3 pb-3 border-b border-border mb-3 shrink-0">
            <button onClick={() => setActive(null)} className="p-1.5 rounded-xl hover:bg-accent">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="relative">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                {activeConv?.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              {activeConv?.online && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">{activeConv?.name}</p>
              <p className="text-xs text-muted-foreground">{activeConv?.role} · {activeConv?.online ? "Online" : "Offline"}</p>
            </div>
            <div className="flex items-center gap-1">
              <Lock className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[10px] text-emerald-600 font-medium">Encrypted</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 pb-2">
            {mockMessages.map(msg => (
              <div key={msg.id} className={cn("flex", msg.from === "patient" ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[80%] px-4 py-2.5 rounded-2xl text-sm",
                  msg.from === "patient"
                    ? "bg-primary text-white rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm")}>
                  <p className="leading-relaxed">{msg.text}</p>
                  <p className={cn("text-[10px] mt-1", msg.from === "patient" ? "text-white/70 text-right" : "text-muted-foreground")}>{msg.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 pt-3 border-t border-border shrink-0">
            <button className="p-2 rounded-xl hover:bg-accent text-muted-foreground"><Paperclip className="h-4 w-4" /></button>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && setInput("")}
              className="flex-1 bg-muted rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Type a secure message..."
            />
            <button className="p-2 rounded-xl hover:bg-accent text-muted-foreground"><Smile className="h-4 w-4" /></button>
            <Button size="sm" className="rounded-xl h-9 w-9 p-0" onClick={() => setInput("")}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
