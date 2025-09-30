import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingChatButtonProps {
  onClick: () => void;
  unreadCount?: number;
}

const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({ onClick, unreadCount = 0 }) => {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50"
      aria-label="Abrir asistente de IA"
    >
      <MessageSquare className="h-6 w-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Button>
  );
};

export default FloatingChatButton;
