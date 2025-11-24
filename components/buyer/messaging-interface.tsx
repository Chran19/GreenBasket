"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Search, MessageCircle, Clock } from "lucide-react";
import { buyerAPI, usersAPI } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender?: { id: string; name: string };
  receiver?: { id: string; name: string };
}

interface Conversation {
  id: string;
  partner: { id: string; name: string };
  lastMessage: {
    content: string;
    created_at: string;
    isFromMe: boolean;
  };
  unreadCount: number;
  messages: Message[];
}

export function BuyerMessagingInterface() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check for conversation query param
  const conversationParam = searchParams?.get("conversation");

  // Fetch user info by ID
  const fetchUserInfo = async (userId: string) => {
    try {
      // Try to get user info from admin API (may require admin role, but worth trying)
      const res: any = await usersAPI.getById(userId);
      if (res?.success && res?.data?.user) {
        return res.data.user;
      }
    } catch (e) {
      // If admin API fails, that's okay - we'll use placeholder
      console.error("Failed to fetch user info:", e);
    }
    // Return placeholder - the actual name will be loaded when messages are fetched
    return { id: userId, name: "Farmer" };
  };

  // Load conversations list
  const loadConversations = async () => {
    try {
      const res: any = await buyerAPI.getMessages();
      const list = Array.isArray(res?.data) ? res.data : [];
      const normalized: Conversation[] = list.map((c: any) => ({
        id: c.partner?.id || "",
        partner: c.partner || { id: "", name: "Unknown" },
        lastMessage: c.lastMessage || {
          content: "",
          created_at: new Date().toISOString(),
          isFromMe: false,
        },
        unreadCount: c.unreadCount || 0,
        messages: [],
      }));
      setConversations(normalized);

      // If conversation param exists, select that conversation
      if (conversationParam) {
        const found = normalized.find((c) => c.id === conversationParam);
        if (found) {
          setSelectedConversation(found);
        } else {
          // Create a new conversation entry if it doesn't exist yet
          try {
            const partnerInfo = await fetchUserInfo(conversationParam);
            const newConversation: Conversation = {
              id: conversationParam,
              partner: partnerInfo,
              lastMessage: {
                content: "",
                created_at: new Date().toISOString(),
                isFromMe: false,
              },
              unreadCount: 0,
              messages: [],
            };
            // Add to conversations list if not already there
            setConversations((prev) => {
              if (!prev.find((c) => c.id === conversationParam)) {
                return [newConversation, ...prev];
              }
              return prev;
            });
            setSelectedConversation(newConversation);
          } catch (e) {
            console.error("Failed to load conversation partner:", e);
            // Still create a placeholder so user can send message
            const placeholder: Conversation = {
              id: conversationParam,
              partner: { id: conversationParam, name: "Farmer" },
              lastMessage: {
                content: "",
                created_at: new Date().toISOString(),
                isFromMe: false,
              },
              unreadCount: 0,
              messages: [],
            };
            setConversations((prev) => {
              if (!prev.find((c) => c.id === conversationParam)) {
                return [placeholder, ...prev];
              }
              return prev;
            });
            setSelectedConversation(placeholder);
          }
        }
      } else if (!selectedConversation && normalized.length > 0) {
        // Auto-select first conversation if none selected and no param
        setSelectedConversation(normalized[0]);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
      // If there's a conversation param but loading failed, still try to create it
      if (conversationParam) {
        const placeholder: Conversation = {
          id: conversationParam,
          partner: { id: conversationParam, name: "Farmer" },
          lastMessage: {
            content: "",
            created_at: new Date().toISOString(),
            isFromMe: false,
          },
          unreadCount: 0,
          messages: [],
        };
        setConversations([placeholder]);
        setSelectedConversation(placeholder);
      }
    }
  };

  // Load messages for a specific conversation
  const loadMessages = async (conversationId: string) => {
    if (!conversationId) return;

    try {
      const res: any = await buyerAPI.getConversation(conversationId, 1, 100);
      const messages = Array.isArray(res?.data) ? res.data : [];

      // Extract partner info from messages if available
      let partnerName = null;
      if (messages.length > 0) {
        const firstMessage = messages[0];
        // Find the partner (the one who is not the current user)
        const partner =
          firstMessage.sender_id === user?.id
            ? firstMessage.receiver
            : firstMessage.sender;
        if (partner?.name) {
          partnerName = partner.name;
        }
      }

      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === conversationId) {
            const updated = { ...conv, messages: messages.reverse() };
            // Update partner name if we found it in messages
            if (partnerName && updated.partner.name === "Farmer") {
              updated.partner = { ...updated.partner, name: partnerName };
            }
            return updated;
          }
          return conv;
        })
      );

      setSelectedConversation((prev) => {
        if (prev && prev.id === conversationId) {
          const updated = {
            ...prev,
            messages: messages.reverse(),
            unreadCount: 0,
          };
          // Update partner name if we found it in messages
          if (partnerName && updated.partner.name === "Farmer") {
            updated.partner = { ...updated.partner, name: partnerName };
          }
          return updated;
        }
        return prev;
      });

      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      // If no messages exist yet, that's okay - just set empty array
      console.error("Failed to load messages:", err);
      setSelectedConversation((prev) =>
        prev && prev.id === conversationId ? { ...prev, messages: [] } : prev
      );
    }
  };

  // Poll for new messages
  // useEffect(() => {
  //   loadConversations()

  //   // Poll conversations every 3 seconds
  //   pollIntervalRef.current = setInterval(() => {
  //     loadConversations()
  //     if (selectedConversation) {
  //       loadMessages(selectedConversation.id)
  //     }
  //   }, 3000)

  //   return () => {
  //     if (pollIntervalRef.current) {
  //       clearInterval(pollIntervalRef.current)
  //     }
  //   }
  // }, [])
  // Load conversations once
  useEffect(() => {
    loadConversations();
  }, []);

  // Poll messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;
    const interval = setInterval(() => {
      loadMessages(selectedConversation.id);
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedConversation?.id]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (selectedConversation?.messages.length) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [selectedConversation?.messages.length]);

  const filteredConversations = conversations.filter((conv) =>
    conv.partner.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    // Validate receiver ID is a valid UUID
    const receiverId = selectedConversation.id;
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(receiverId)) {
      alert("Invalid receiver ID. Please try again.");
      return;
    }

    const messageText = newMessage.trim();
    setNewMessage("");
    setIsLoading(true);

    // Optimistically add message
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      sender_id: user?.id || "",
      receiver_id: selectedConversation.id,
      content: messageText,
      created_at: new Date().toISOString(),
      is_read: false,
      sender: { id: user?.id || "", name: user?.name || "You" },
    };

    setSelectedConversation((prev) =>
      prev
        ? {
            ...prev,
            messages: [...prev.messages, tempMessage],
            lastMessage: {
              content: messageText,
              created_at: new Date().toISOString(),
              isFromMe: true,
            },
          }
        : null
    );

    try {
      const response = await buyerAPI.sendMessage(receiverId, messageText);

      if (!response?.success) {
        throw new Error(
          response?.error || response?.message || "Failed to send message"
        );
      }

      // Reload messages to get the real one from server
      await loadMessages(receiverId);
      //await loadConversations();
      // Update the conversation in the list with the new last message
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === receiverId
            ? {
                ...conv,
                lastMessage: {
                  content: messageText,
                  created_at: new Date().toISOString(),
                  isFromMe: true,
                },
              }
            : conv
        )
      );
    } catch (err: any) {
      console.error("Failed to send message:", err);
      console.error("Error details:", {
        message: err?.message,
        status: err?.status,
        response: err?.response,
        receiverId: receiverId,
      });

      // Get detailed error message
      let errorMessage = "Failed to send message. Please try again.";
      if (err?.response) {
        errorMessage =
          err.response.error || err.response.message || errorMessage;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      // Remove optimistic message on error
      setSelectedConversation((prev) =>
        prev
          ? {
              ...prev,
              messages: prev.messages.filter((m) => !m.id.startsWith("temp-")),
            }
          : null
      );
      setNewMessage(messageText); // Restore message text
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const totalUnread = conversations.reduce(
    (sum, conv) => sum + conv.unreadCount,
    0
  );

  return (
    <div className="space-y-6">
      {/* Messaging Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{conversations.length}</p>
                <p className="text-sm text-muted-foreground">
                  Total Conversations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary/10 rounded-lg">
                <Clock className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalUnread}</p>
                <p className="text-sm text-muted-foreground">Unread Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messaging Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <Card>
          <CardHeader>
            <CardTitle>Messages</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <p>No conversations yet</p>
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const initials = conversation.partner.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <div
                      key={conversation.id}
                      className={`p-4 cursor-pointer hover:bg-muted/50 border-b ${
                        selectedConversation?.id === conversation.id
                          ? "bg-muted"
                          : ""
                      }`}
                      onClick={() => setSelectedConversation(conversation)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">
                              {conversation.partner.name}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.lastMessage.content}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTime(conversation.lastMessage.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {selectedConversation.partner.name
                          .split(" ")
                          .map((p) => p[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {selectedConversation.partner.name}
                      </CardTitle>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedConversation.messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    selectedConversation.messages.map((message) => {
                      const isFromMe = message.sender_id === user?.id;
                      const senderName = isFromMe
                        ? "You"
                        : message.sender?.name ||
                          selectedConversation.partner.name;

                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isFromMe ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              isFromMe
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 min-h-[60px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      disabled={isLoading}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || isLoading}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Select a conversation to start messaging
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
