import React, { useState, useRef, useEffect } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Trash2, X } from 'lucide-react';
import { useAIChat } from '@/hooks/useAIChat';
import { cn } from '@/lib/utils';

interface ChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ChatDrawer: React.FC<ChatDrawerProps> = ({ open, onOpenChange }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, sendMessage, clearHistory } = useAIChat();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Scroll to bottom when drawer opens
  useEffect(() => {
    if (open && scrollRef.current) {
      // Small delay to ensure DOM is rendered
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    await sendMessage(userMessage);
  };

  const handleClearHistory = () => {
    if (confirm('¿Estás seguro de que quieres borrar todo el historial de chat?')) {
      clearHistory();
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="h-screen top-0 right-0 left-auto mt-0 w-full sm:w-[500px] rounded-none">
        <div className="flex flex-col h-full bg-background">
          <DrawerHeader className="border-b px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-xl font-semibold">
                Asistente de IA - Skyranch
              </DrawerTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearHistory}
                  disabled={messages.length === 0}
                  title="Borrar historial"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  title="Cerrar"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DrawerHeader>

          <ScrollArea className="flex-1 px-6" ref={scrollRef}>
            <div className="space-y-4 py-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                  <div className="mb-4 text-4xl">🤖</div>
                  <p className="text-lg font-medium mb-2">¡Hola! Soy tu asistente de IA</p>
                  <p className="text-sm max-w-sm mx-auto">
                    Puedo ayudarte con preguntas sobre animales, reproducción, lotes y mejores prácticas ganaderas.
                  </p>
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-3 shadow-sm',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted border border-border'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.message}
                    </p>
                    <p className={cn(
                      "text-xs mt-2 opacity-60",
                      message.role === 'user' ? 'text-right' : 'text-left'
                    )}>
                      {new Date(message.created_at).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted border border-border rounded-2xl px-4 py-3 shadow-sm">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <form onSubmit={handleSubmit} className="border-t p-4 flex-shrink-0 bg-background">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu pregunta..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                size="icon"
                className="flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ChatDrawer;
