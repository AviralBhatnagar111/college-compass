import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useCommStore } from "@/stores";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Inbox, Archive, Clock, Send, Star, Search, Reply, Forward, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_app/communication/inbox")({
  head: () => ({ meta: [{ title: "Inbox — LearnNowX" }] }),
  component: InboxPage,
});

const FOLDERS = [
  { id: "todo", label: "To Do", icon: Star, color: "text-lnx-red-500" },
  { id: "awaiting", label: "Awaiting", icon: Clock, color: "text-lnx-amber-500" },
  { id: "recent", label: "Recent", icon: Inbox, color: "text-lnx-teal-500" },
  { id: "archived", label: "Archived", icon: Archive, color: "text-muted-foreground" },
] as const;

function InboxPage() {
  const inbox = useCommStore(s => s.inbox);
  const moveMessage = useCommStore(s => s.moveMessage);
  const [folder, setFolder] = useState<typeof FOLDERS[number]["id"]>("todo");
  const [selectedId, setSelectedId] = useState<string | null>(inbox[0]?.id ?? null);
  const list = inbox.filter(m => m.folder === folder);
  const selected = inbox.find(m => m.id === selectedId);

  return (
    <div>
      <PageHeader title="Inbox" subtitle="Triple-pane mail for institutional workflows" />
      <Card className="p-0 overflow-hidden">
        <div className="grid grid-cols-[200px,1fr,1.4fr] h-[calc(100vh-220px)] min-h-[500px]">
          {/* Folders */}
          <div className="border-r bg-muted/30 p-2">
            {FOLDERS.map(f => {
              const count = inbox.filter(m => m.folder === f.id).length;
              return (
                <button key={f.id} onClick={() => { setFolder(f.id); setSelectedId(inbox.find(m=>m.folder===f.id)?.id ?? null); }}
                  className={cn("w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition",
                    folder === f.id ? "bg-background shadow-sm font-medium" : "hover:bg-background/50")}>
                  <span className="flex items-center gap-2"><f.icon className={cn("h-4 w-4", f.color)} />{f.label}</span>
                  <Badge variant="secondary" className="text-[10px]">{count}</Badge>
                </button>
              );
            })}
            <Button className="w-full mt-4"><Send className="h-3 w-3 mr-1" />Compose</Button>
          </div>

          {/* Message List */}
          <div className="border-r flex flex-col">
            <div className="border-b p-2"><div className="relative"><Search className="h-3 w-3 absolute left-2.5 top-2.5 text-muted-foreground" /><Input placeholder="Search messages" className="pl-7 h-8 text-xs" /></div></div>
            <div className="flex-1 overflow-y-auto">
              {list.length === 0 && <div className="p-6 text-sm text-muted-foreground text-center">No messages</div>}
              {list.map(m => (
                <button key={m.id} onClick={() => setSelectedId(m.id)}
                  className={cn("w-full text-left p-3 border-b transition hover:bg-muted/30", selectedId === m.id && "bg-lnx-teal-500/5 border-l-2 border-l-lnx-teal-500")}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-xs font-semibold truncate">{m.from}</p>
                    <p className="text-[10px] text-muted-foreground whitespace-nowrap">{new Date(m.receivedAt).toLocaleDateString()}</p>
                  </div>
                  <p className="text-sm font-medium truncate">{m.subject}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.snippet}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Reading Pane */}
          <div className="flex flex-col">
            {selected ? (
              <>
                <div className="border-b p-4">
                  <h2 className="text-lg font-semibold text-lnx-navy-800">{selected.subject}</h2>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">From <span className="font-medium text-foreground">{selected.from}</span> · {new Date(selected.receivedAt).toLocaleString()}</p>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost"><Reply className="h-3 w-3" /></Button>
                      <Button size="sm" variant="ghost"><Forward className="h-3 w-3" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => { moveMessage(selected.id, "archived"); setSelectedId(null); }}><Trash2 className="h-3 w-3 text-lnx-red-500" /></Button>
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-4 overflow-y-auto">
                  <p className="text-sm leading-relaxed">{selected.body}</p>
                  {selected.actionLabel && (
                    <div className="mt-6 rounded-md border-l-4 border-l-lnx-teal-500 bg-lnx-teal-500/5 p-3">
                      <p className="text-xs font-semibold text-lnx-teal-500 uppercase">Action Required</p>
                      <Button size="sm" className="mt-2">{selected.actionLabel}</Button>
                    </div>
                  )}
                </div>
              </>
            ) : <div className="grid place-items-center h-full text-muted-foreground"><div className="text-center"><Inbox className="h-12 w-12 mx-auto mb-2 opacity-40" /><p className="text-sm">Select a message to read</p></div></div>}
          </div>
        </div>
      </Card>
    </div>
  );
}
