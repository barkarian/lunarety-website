"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { SendIcon, XIcon, Loader2Icon, MessageCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface PropertyContext {
  name: string;
  description?: string;
  shortDescription?: string;
  address?: string;
  city?: string;
  country?: string;
  amenities?: string[];
  rooms?: Array<{
    name: string;
    description?: string;
    maxGuests?: number;
    bedType?: string;
  }>;
}

interface PropertyChatProps {
  propertyContext: PropertyContext;
}

export function PropertyChat({ propertyContext }: PropertyChatProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [mounted, setMounted] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Ensure we're on the client before rendering portal
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Create transport to pass propertyContext in body
  const transport = React.useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { propertyContext },
      }),
    [propertyContext]
  );

  // Use the useChat hook with transport
  const { messages, sendMessage, status, error } = useChat({ transport });

  const isLoading = status === "streaming" || status === "submitted";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    sendMessage({ text: inputValue.trim() });
    setInputValue("");
  };

  const handleSuggestionClick = (question: string) => {
    setInputValue(question);
  };

  const suggestedQuestions = [
    "What amenities are included?",
    "Tell me about the rooms",
    "What's nearby?",
  ];

  // Don't render until mounted (client-side)
  if (!mounted) return null;

  // Chat content to render via portal
  const chatContent = (
    <>
      {/* Floating action button - always visible */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-[9999] bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105 hover:shadow-xl"
          size="icon"
        >
          <MessageCircleIcon className="h-6 w-6" />
        </Button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[380px] sm:w-[420px] h-[520px] shadow-2xl z-[9999] flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-background/95 backdrop-blur-xl animate-fade-in-up">
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between py-3 px-4 border-b border-border/50 bg-primary text-primary-foreground">
            <div className="flex items-center gap-2 font-medium">
              <MessageCircleIcon className="h-5 w-5" />
              <span className="truncate max-w-[250px]">Ask about {propertyContext.name}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setIsOpen(false)}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="text-center text-muted-foreground text-sm py-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                    <MessageCircleIcon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-medium text-foreground mb-1">
                    Hi! I&apos;m your AI assistant
                  </p>
                  <p>Ask me anything about {propertyContext.name}</p>
                </div>

                {/* Suggested questions */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground text-center">
                    Try asking:
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {suggestedQuestions.map((question) => (
                      <button
                        key={question}
                        onClick={() => handleSuggestionClick(question)}
                        className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary hover:bg-primary/5 transition-colors"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="text-center text-destructive text-sm py-2 px-4 bg-destructive/10 rounded-lg">
                {error.message || "An error occurred. Please try again."}
              </div>
            )}

            {/* Render messages */}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted rounded-bl-sm"
                  }`}
                >
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case "text":
                        return <span key={`${message.id}-${i}`}>{part.text}</span>;
                      default:
                        return null;
                    }
                  })}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Loader2Icon className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input form */}
          <form onSubmit={handleSubmit} className="flex-shrink-0 p-3 border-t border-border/50 bg-background">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your question..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !inputValue.trim()}
              >
                {isLoading ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                  <SendIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );

  // Use portal to render directly to document.body
  // This ensures fixed positioning works regardless of parent CSS
  return createPortal(chatContent, document.body);
}
