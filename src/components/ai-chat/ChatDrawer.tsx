import React, { useState, useRef, useEffect } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Trash2, X, Paperclip, FileIcon, Copy, Check, Download, ImagePlus } from 'lucide-react';
import { useAIChat } from '@/hooks/useAIChat';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Utility types
interface DownloadableContent {
  type: 'code' | 'image';
  content: string;
  filename: string;
  language?: string;
  mimeType?: string;
}

// Parse downloadable text content (code blocks)
const parseDownloadableContent = (text: string): DownloadableContent[] => {
  const items: DownloadableContent[] = [];
  const codeBlockRegex = /```(\w+)\n([\s\S]*?)```/g;
  let match;
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    const language = match[1];
    const content = match[2];
    
    // Determine mime type and file extension
    const mimeTypes: Record<string, string> = {
      html: 'text/html',
      json: 'application/json',
      csv: 'text/csv',
      txt: 'text/plain',
      svg: 'image/svg+xml',
      xml: 'application/xml',
      css: 'text/css',
      javascript: 'text/javascript',
      typescript: 'text/typescript',
      python: 'text/x-python',
      java: 'text/x-java',
    };
    
    const mimeType = mimeTypes[language] || 'text/plain';
    
    // Try to find filename in surrounding text
    const beforeText = text.substring(0, match.index);
    const filenameMatch = beforeText.match(/([a-zA-Z0-9_-]+\.(html|json|csv|txt|svg|xml|css|js|ts|py|java))(?!.*\1)/i);
    const filename = filenameMatch ? filenameMatch[1] : `download.${language}`;
    
    items.push({
      type: 'code',
      content,
      filename,
      language,
      mimeType,
    });
  }
  
  return items;
};

// Parse image content (base64 or URLs)
const parseImageContent = (text: string): DownloadableContent[] => {
  const items: DownloadableContent[] = [];
  
  // Base64 images
  const base64ImageRegex = /data:image\/(png|jpeg|jpg|webp|gif);base64,([A-Za-z0-9+/=]+)/gi;
  let match;
  
  while ((match = base64ImageRegex.exec(text)) !== null) {
    const format = match[1];
    const base64Data = match[0]; // Full data URL
    
    // Try to find filename in surrounding text
    const beforeText = text.substring(0, match.index);
    const filenameMatch = beforeText.match(/([a-zA-Z0-9_-]+\.(png|jpg|jpeg|webp|gif))(?!.*\1)/i);
    const filename = filenameMatch ? filenameMatch[1] : `image.${format}`;
    
    items.push({
      type: 'image',
      content: base64Data,
      filename,
      mimeType: `image/${format}`,
    });
  }
  
  return items;
};

// Download button component
const DownloadButton: React.FC<{
  content: string;
  filename: string;
  mimeType: string;
  type: 'code' | 'image';
}> = ({ content, filename, mimeType, type }) => {
  const handleDownload = async () => {
    try {
      let blob: Blob;
      
      if (type === 'image' && content.startsWith('data:')) {
        // Handle base64 image
        const base64String = content.split(',')[1];
        const byteString = atob(base64String);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        
        blob = new Blob([ab], { type: mimeType });
      } else {
        // Handle text content
        blob = new Blob([content], { type: mimeType });
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success(`Descargado: ${filename}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Error al descargar el archivo');
    }
  };
  
  const fileSize = type === 'image' 
    ? `${Math.round(content.length * 0.75 / 1024)} KB`
    : `${Math.round(new Blob([content]).size / 1024)} KB`;
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      className="gap-2 mt-2"
    >
      <Download className="h-3 w-3" />
      <span className="text-xs">{filename}</span>
      <span className="text-xs opacity-60">({fileSize})</span>
    </Button>
  );
};

// Image with download component
const ImageWithDownload: React.FC<{
  src: string;
  filename: string;
  alt?: string;
}> = ({ src, filename, alt = 'Generated image' }) => {
  return (
    <div className="mt-2 space-y-2">
      <img 
        src={src} 
        alt={alt}
        className="max-w-full rounded-lg border border-border shadow-sm"
      />
      <DownloadButton 
        content={src}
        filename={filename}
        mimeType="image/png"
        type="image"
      />
    </div>
  );
};

const ChatDrawer: React.FC<ChatDrawerProps> = ({ open, onOpenChange }) => {
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showImagePrompt, setShowImagePrompt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, sendMessage, clearHistory } = useAIChat();

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scroll to bottom when drawer opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        scrollToBottom();
      }, 150);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Prefix message with image generation keyword if in image mode
    const userMessage = showImagePrompt 
      ? `Genera imagen: ${input.trim()}` 
      : input.trim();
    const fileToSend = selectedFile;
    
    setInput('');
    setSelectedFile(null);
    
    if (showImagePrompt) {
      setShowImagePrompt(false);
    }
    
    await sendMessage(userMessage, fileToSend || undefined);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 5MB.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleClearHistory = () => {
    if (confirm('¿Estás seguro de que quieres borrar todo el historial de chat?')) {
      clearHistory();
    }
  };

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast.success('Mensaje copiado');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Copy error:', error);
      toast.error('Error al copiar');
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
                  <p className="text-sm max-w-sm mx-auto mb-3">
                    Puedo ayudarte con <strong>cualquier pregunta</strong>, analizar imágenes y documentos, 
                    gestión ganadera, pedigrís y mucho más.
                  </p>
                  <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
                    <Paperclip className="h-3 w-3" />
                    Sube imágenes o archivos para análisis detallado
                  </p>
                </div>
              )}

{messages.map((message, index) => {
                const downloadableFiles = message.role === 'assistant' 
                  ? parseDownloadableContent(message.message) 
                  : [];
                const images = message.role === 'assistant' 
                  ? parseImageContent(message.message) 
                  : [];
                
                return (
                  <div
                    key={index}
                    className={cn(
                      'flex',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-4 py-3 shadow-sm relative group',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted border border-border'
                      )}
                    >
                      {/* Copy button - available for both user and assistant messages */}
                      {(message.role === 'assistant' || message.role === 'user') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(message.message, index)}
                          className={cn(
                            'absolute top-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity',
                            message.role === 'assistant' ? 'right-2' : 'left-2',
                            'sm:opacity-0 sm:group-hover:opacity-100',
                            'max-sm:opacity-60'
                          )}
                          title="Copiar mensaje"
                        >
                          {copiedIndex === index ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                      
                      <p className="text-sm whitespace-pre-wrap leading-relaxed select-text pr-8">
                        {message.message}
                      </p>
                      
                      {/* Render images */}
                      {images.map((img, imgIndex) => (
                        <ImageWithDownload
                          key={`img-${index}-${imgIndex}`}
                          src={img.content}
                          filename={img.filename}
                          alt={`Generated image ${imgIndex + 1}`}
                        />
                      ))}
                      
                      {/* Render download buttons for code files */}
                      {downloadableFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {downloadableFiles.map((file, fileIndex) => (
                            <DownloadButton
                              key={`file-${index}-${fileIndex}`}
                              content={file.content}
                              filename={file.filename}
                              mimeType={file.mimeType!}
                              type={file.type}
                            />
                          ))}
                        </div>
                      )}
                      
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
                );
              })}

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
            <div className="flex flex-col gap-2">
              {/* Image generation mode indicator */}
              {showImagePrompt && (
                <div className="p-3 bg-accent/50 rounded-md">
                  <div className="flex items-start gap-2">
                    <ImagePlus className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium mb-1">Generación de imagen</p>
                      <p className="text-xs text-muted-foreground">
                        Describe la imagen que quieres generar. Ejemplo: "5 swatches PNG de color violeta"
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowImagePrompt(false)}
                      className="h-6 w-6 flex-shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              
              {/* File preview */}
              {selectedFile && (
                <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                  <FileIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
                  <Button 
                    type="button"
                    size="sm" 
                    variant="ghost" 
                    onClick={clearFile}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e as any);
                    }
                  }}
                  placeholder={showImagePrompt 
                    ? "Describe la imagen a generar..." 
                    : "Escribe tu pregunta... (Shift+Enter para nueva línea)"
                  }
                  disabled={isLoading}
                  className="flex-1 min-h-[60px] max-h-[200px] resize-y"
                  rows={2}
                />
                
                {/* Image generation button */}
                <Button
                  type="button"
                  variant={showImagePrompt ? "default" : "outline"}
                  size="icon"
                  onClick={() => setShowImagePrompt(!showImagePrompt)}
                  disabled={isLoading}
                  title="Generar imagen con IA"
                  className="flex-shrink-0"
                >
                  <ImagePlus className="h-4 w-4" />
                </Button>
                
                {/* File upload button */}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={triggerFileInput}
                  disabled={isLoading}
                  title="Subir archivo o imagen"
                  className="flex-shrink-0"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.txt,.md"
                  onChange={handleFileSelect}
                  className="hidden"
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
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ChatDrawer;
