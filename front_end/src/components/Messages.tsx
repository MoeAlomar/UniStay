import { useState } from "react";
import { Card } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Send, Search } from "lucide-react";

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
}

interface Conversation {
  id: string;
  name: string;
  listingTitle: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  avatar: string;
}

const mockConversations: Conversation[] = [
  {
    id: "1",
    name: "Ahmed Farsi",
    listingTitle: "Modern Studio Apartment",
    lastMessage: "The apartment is still available. Would you like to schedule a viewing?",
    timestamp: "10:30 AM",
    unread: true,
    avatar: "AF",
  },
  {
    id: "2",
    name: "Sara Hassan",
    listingTitle: "Looking for roommate",
    lastMessage: "That sounds great! I'd love to meet up this weekend.",
    timestamp: "Yesterday",
    unread: false,
    avatar: "SH",
  },
  {
    id: "3",
    name: "Mohammed Ali",
    listingTitle: "Shared Room Near Campus",
    lastMessage: "Thank you for your interest. The rent includes all utilities.",
    timestamp: "2 days ago",
    unread: false,
    avatar: "MA",
  },
];

const mockMessages: Message[] = [
  {
    id: "1",
    senderId: "other",
    text: "Hello! Thank you for your inquiry about the Modern Studio Apartment.",
    timestamp: "10:25 AM",
    isOwn: false,
  },
  {
    id: "2",
    senderId: "me",
    text: "Hi! I'm very interested in the apartment. Is it still available?",
    timestamp: "10:27 AM",
    isOwn: true,
  },
  {
    id: "3",
    senderId: "other",
    text: "Yes, it's still available! The apartment is perfect for students.",
    timestamp: "10:28 AM",
    isOwn: false,
  },
  {
    id: "4",
    senderId: "other",
    text: "The apartment is still available. Would you like to schedule a viewing?",
    timestamp: "10:30 AM",
    isOwn: false,
  },
];

export function Messages() {
  const [selectedConversation, setSelectedConversation] = useState<string>("1");
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState(mockMessages);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSendMessage = async () => {
    if (messageText.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        senderId: "me",
        text: messageText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isOwn: true,
      };
      setMessages([...messages, newMessage]);
      setMessageText("");
      try {
        const { createConversation, sendMessage } = await import("../services/messaging");
        const conv = await createConversation([1]);
        await sendMessage(conv.sid, newMessage.text);
      } catch (_) {}
    }
  };

  const filteredConversations = mockConversations.filter(
    (conv) =>
      conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.listingTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-secondary">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="mb-6 text-foreground">Messages</h1>

        <Card className="overflow-hidden">
          <div className="grid md:grid-cols-3 h-[calc(100vh-200px)]">
            {/* Conversations List */}
            <div className="border-r border-border bg-white">
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
                      onClick={() => setSelectedConversation(conversation.id)}
                      className={`w-full p-4 text-left hover:bg-secondary transition-colors ${
                        selectedConversation === conversation.id
                          ? "bg-secondary"
                          : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarFallback>{conversation.avatar}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className={conversation.unread ? "" : ""}>
                              {conversation.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {conversation.timestamp}
                            </span>
                          </div>
                          <p className="text-xs text-primary mb-1">
                            {conversation.listingTitle}
                          </p>
                          <p
                            className={`text-sm truncate ${
                              conversation.unread
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {conversation.lastMessage}
                          </p>
                        </div>
                        {conversation.unread && (
                          <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className="md:col-span-2 flex flex-col bg-secondary">
              {/* Chat Header */}
              <div className="p-4 bg-white border-b border-border">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>AF</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-foreground">Ahmed Farsi</h3>
                    <p className="text-sm text-primary">
                      Modern Studio Apartment
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.isOwn ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] ${
                          message.isOwn ? "order-2" : "order-1"
                        }`}
                      >
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            message.isOwn
                              ? "bg-primary text-white rounded-tr-sm"
                              : "bg-white rounded-tl-sm"
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                        </div>
                        <p
                          className={`text-xs text-muted-foreground mt-1 ${
                            message.isOwn ? "text-right" : "text-left"
                          }`}
                        >
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 bg-white border-t border-border">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} size="icon">
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
