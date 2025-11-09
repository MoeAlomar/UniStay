// frontend/src/components/Messages.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Send, Search } from "lucide-react";

import {
  getTwilioClient,
  listSubscribedConversations,
  getConversationBySid,
  getMessages,
  sendMessage as sendViaAPI,
  markAllRead,
  type Conversation,
  type Message,
} from "../services/messaging";

type UIConversation = {
  id: string;              // Twilio Conversation SID
  name: string;            // other participant's display name
  listingTitle?: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  avatar: string;
};

// Accepts string | null | undefined for fallback
function otherParticipantName(
  attrs: any,
  myId?: string,
  fallback?: string | null
): string {
  const safeFallback = (fallback ?? undefined) as string | undefined;

  // attrs.usernames = { "<id1>": "Alice", "<id2>": "Bob" }
  if (attrs?.usernames && myId) {
    const keys: string[] = Object.keys(attrs.usernames);
    const otherId = keys.find((k) => k !== myId);
    if (otherId) {
      const val = attrs.usernames[otherId];
      if (typeof val === "string" && val.trim()) return val;
    }
  }
  return safeFallback || "Conversation";
}

export function Messages() {
  const [convList, setConvList] = useState<UIConversation[]>([]);
  const [selectedSid, setSelectedSid] = useState<string>("");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [myIdentity, setMyIdentity] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Read ?conversation=<sid> once
  const initialSidFromURL = (() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("conversation") || "";
    } catch {
      return "";
    }
  })();

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Init client + load conversations
  useEffect(() => {
    let mounted = true;

    (async () => {
      const client = await getTwilioClient();
      if (!mounted) return;

      setMyIdentity(client.user?.identity);

      const items = await listSubscribedConversations();
      if (!mounted) return;

      const uiConvs = await Promise.all(
        items.map(async (c) => {
          const summary = await c.getMessages(1);
          const last = summary.items[summary.items.length - 1];
          const lastBody = last?.body || "";
          const ts = last?.dateCreated
            ? last.dateCreated.toLocaleString([], { hour: "2-digit", minute: "2-digit" })
            : "";

          let unread = false;
          try {
            const count = await c.getUnreadMessagesCount();
            unread = (count ?? 0) > 0;
          } catch {}

          const attrs = (await c.getAttributes()) as any;

          // FIX: pass (c.friendlyName ?? undefined) OR let helper accept null
          const name = otherParticipantName(attrs, client.user?.identity, c.friendlyName);

          const initials = name
            .split(" ")
            .map((s: string) => s[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return {
            id: c.sid,
            name,
            listingTitle: attrs?.listingTitle,
            lastMessage: lastBody,
            timestamp: ts,
            unread,
            avatar: initials || "UN",
          } as UIConversation;
        })
      );

      setConvList(uiConvs);

      // Respect URL param
      if (initialSidFromURL) {
        setSelectedSid(initialSidFromURL);
      } else if (!selectedSid && uiConvs[0]) {
        setSelectedSid(uiConvs[0].id);
      }

      // Conversation added/removed listeners
      client.on("conversationAdded", async (c) => {
        const summary = await c.getMessages(1);
        const last = summary.items[summary.items.length - 1];
        const ts = last?.dateCreated
          ? last.dateCreated.toLocaleString([], { hour: "2-digit", minute: "2-digit" })
          : "";

        let unread = false;
        try {
          const count = await c.getUnreadMessagesCount();
          unread = (count ?? 0) > 0;
        } catch {}

        const attrs = (await c.getAttributes()) as any;

        // FIX here too
        const name = otherParticipantName(attrs, client.user?.identity, c.friendlyName);

        const initials = name
          .split(" ")
          .map((s: string) => s[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        setConvList((prev) => [
          {
            id: c.sid,
            name,
            listingTitle: attrs?.listingTitle,
            lastMessage: last?.body || "",
            timestamp: ts,
            unread,
            avatar: initials || "UN",
          },
          ...prev,
        ]);
      });

      client.on("conversationRemoved", (c) => {
        setConvList((prev) => prev.filter((x) => x.id !== c.sid));
        if (selectedSid === c.sid) {
          setSelectedSid("");
          setSelectedConversation(null);
          setMessages([]);
        }
      });
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // once

  // Subscribe to the selected conversation
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let mounted = true;

    (async () => {
      if (!selectedSid) return;

      const convo = await getConversationBySid(selectedSid);
      if (!mounted) return;

      setSelectedConversation(convo);

      // Load history
      const items = await getMessages(convo, 100);
      if (!mounted) return;
      setMessages(items);

      // Mark read on open
      await markAllRead(convo);

      const onMsgAdded = async (m: Message) => {
        setMessages((prev) => [...prev, m]);

        // Auto-mark read if it's from the other user
        const client = await getTwilioClient();
        const me = client.user?.identity;
        const isFromOther = me && m.author !== me;
        if (isFromOther) {
          clearTimeout((onMsgAdded as any)._t);
          (onMsgAdded as any)._t = setTimeout(() => markAllRead(convo), 150);
        }
      };

      const onUpdated = async () => {
        const summary = await convo.getMessages(1);
        const last = summary.items[summary.items.length - 1];
        const ts = last?.dateCreated
          ? last.dateCreated.toLocaleString([], { hour: "2-digit", minute: "2-digit" })
          : "";

        let unread = false;
        try {
          const count = await convo.getUnreadMessagesCount();
          unread = (count ?? 0) > 0;
        } catch {}

        setConvList((prev) =>
          prev.map((c) =>
            c.id === convo.sid
              ? {
                  ...c,
                  lastMessage: last?.body || c.lastMessage,
                  timestamp: ts || c.timestamp,
                  unread,
                }
              : c
          )
        );
      };

      convo.on("messageAdded", onMsgAdded);
      convo.on("updated", onUpdated);

      unsubscribe = () => {
        convo.removeListener("messageAdded", onMsgAdded);
        convo.removeListener("updated", onUpdated);
      };
    })();

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [selectedSid]);

  // Re-mark read when tab becomes visible
  useEffect(() => {
    if (!selectedConversation) return;
    const onVisible = async () => {
      if (document.visibilityState === "visible") {
        await markAllRead(selectedConversation);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [selectedConversation]);

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return convList;
    return convList.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.listingTitle || "").toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
    );
  }, [convList, searchQuery]);

  const handleSendMessage = async () => {
    const text = messageText.trim();
    if (!text || !selectedSid) return;
    setMessageText("");

    try {
      // send via backend (persists in Django) – Twilio emits messageAdded for UI
      await sendViaAPI(selectedSid, text);
      if (selectedConversation) await markAllRead(selectedConversation);
    } catch {
      try {
        if (selectedConversation) await selectedConversation.sendMessage(text);
      } catch {}
    }
  };

  const renderTime = (m: Message) =>
    m.dateCreated
      ? m.dateCreated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";

  const isOwn = (m: Message) => {
    if (!myIdentity) return false;
    return m.author === myIdentity;
    // NOTE: author is the Twilio identity (we set it to user.id on the server)
  };

  const handleSelectConversation = async (sid: string) => {
    setSelectedSid(sid);
    const convo = await getConversationBySid(sid);
    await markAllRead(convo);
    setConvList((prev) => prev.map((c) => (c.id === sid ? { ...c, unread: false } : c)));
    // keep URL synced
    try {
      const u = new URL(window.location.href);
      u.searchParams.set("conversation", sid);
      window.history.replaceState(null, "", u.toString());
    } catch {}
  };

  const activeUIConv = convList.find((c) => c.id === selectedSid);

  return (
    <div className="min-h-screen bg-secondary">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="mb-6 text-foreground">Messages</h1>
        <Card className="overflow-hidden">
          <div className="grid md:grid-cols-3 h-[calc(100vh-200px)]">
            {/* Left column: conversations */}
            <div className="border-r border-border bg-card">
              <div className="p-4 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="divide-y divide-border">
                  {filteredConversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => handleSelectConversation(conversation.id)}
                      className={`w-full p-4 text-left hover:bg-secondary transition-colors ${
                        selectedSid === conversation.id ? "bg-secondary" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarFallback>{conversation.avatar}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span>{conversation.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {conversation.timestamp}
                            </span>
                          </div>
                          {conversation.listingTitle && (
                            <p className="text-xs text-primary mb-1">
                              {conversation.listingTitle}
                            </p>
                          )}
                          <p
                            className={`text-sm truncate ${
                              conversation.unread ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {conversation.lastMessage || "No messages yet"}
                          </p>
                        </div>
                        {conversation.unread && (
                          <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Right column: chat */}
            <div className="md:col-span-2 flex flex-col bg-secondary">
              {/* Header */}
              <div className="p-4 bg-card border-b border-border">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {(activeUIConv?.avatar || "UN").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-foreground">
                      {activeUIConv?.name || "Select a conversation"}
                    </h3>
                    {activeUIConv?.listingTitle && (
                      <p className="text-sm text-primary">{activeUIConv.listingTitle}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((m) => (
                    <div key={m.sid} className={`flex ${isOwn(m) ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] ${isOwn(m) ? "order-2" : "order-1"}`}>
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            isOwn(m)
                              ? "bg-primary text-white rounded-tr-sm"
                              : "bg-card rounded-tl-sm"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {m.body}
                          </p>
                        </div>
                        <p
                          className={`text-xs text-muted-foreground mt-1 ${
                            isOwn(m) ? "text-right" : "text-left"
                          }`}
                        >
                          {renderTime(m)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Composer */}
              <div className="p-4 bg-card border-t border-border">
                <div className="flex gap-2">
                  <Input
                    placeholder={
                      selectedSid
                        ? "Type a message..."
                        : "Select a conversation to start chatting"
                    }
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1"
                    disabled={!selectedSid}
                  />
                  <Button onClick={handleSendMessage} size="icon" disabled={!selectedSid}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
