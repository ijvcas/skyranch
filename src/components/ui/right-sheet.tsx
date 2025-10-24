import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface RightSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function RightSheet({ open, onOpenChange, children }: RightSheetProps) {
  const [isAnimating, setIsAnimating] = React.useState(false)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const startXRef = React.useRef<number | null>(null)
  const currentXRef = React.useRef<number>(0)

  // Prevent body scroll when sheet is open
  React.useEffect(() => {
    if (open) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflowY = 'scroll'
    } else {
      const scrollY = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflowY = ''
      window.scrollTo(0, parseInt(scrollY || '0', 10) * -1)
    }
  }, [open])

  // Handle swipe-to-close gesture
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.target instanceof Element && e.target.closest('[data-sheet-content]')) {
      startXRef.current = e.touches[0].clientX
      currentXRef.current = 0
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startXRef.current === null) return
    
    const currentX = e.touches[0].clientX
    const diff = currentX - startXRef.current
    
    // Only allow swiping to the right (closing)
    if (diff > 0) {
      currentXRef.current = diff
      if (contentRef.current) {
        contentRef.current.style.transform = `translateX(${diff}px)`
      }
    }
  }

  const handleTouchEnd = () => {
    if (startXRef.current === null) return
    
    // If swiped more than 100px, close the sheet
    if (currentXRef.current > 100) {
      onOpenChange(false)
    }
    
    // Reset transform
    if (contentRef.current) {
      contentRef.current.style.transform = ''
    }
    
    startXRef.current = null
    currentXRef.current = 0
  }

  // Handle ESC key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false)
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onOpenChange])

  // Animation state
  React.useEffect(() => {
    if (open) {
      setIsAnimating(true)
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300)
      return () => clearTimeout(timer)
    }
  }, [open])

  if (!open && !isAnimating) return null

  return (
    <div
      className={cn(
        "fixed inset-0 z-50",
        "transition-opacity duration-300",
        open ? "opacity-100" : "opacity-0"
      )}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      />

      {/* Sheet Content */}
      <div
        ref={contentRef}
        data-sheet-content
        className={cn(
          "fixed right-0 top-0 h-full w-full sm:w-[500px]",
          "bg-background border-l shadow-2xl",
          "transition-transform duration-300 ease-out",
          "flex flex-col",
          open ? "translate-x-0" : "translate-x-full"
        )}
        style={{
          height: '100dvh',
          maxHeight: '100dvh',
          willChange: 'transform',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}

interface RightSheetHeaderProps {
  children: React.ReactNode
  onClose: () => void
  className?: string
}

export function RightSheetHeader({ children, onClose, className }: RightSheetHeaderProps) {
  return (
    <div 
      className={cn(
        "flex-shrink-0 border-b bg-background",
        "sticky top-0 z-20",
        className
      )}
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingLeft: 'max(1.5rem, env(safe-area-inset-left))',
        paddingRight: 'max(1.5rem, env(safe-area-inset-right))',
        paddingBottom: '1rem'
      }}
    >
      <div className="flex items-center justify-between">
        {children}
        <button
          onClick={onClose}
          className="ml-4 rounded-md p-2 hover:bg-accent transition-colors"
          aria-label="Close"
          type="button"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

interface RightSheetContentProps {
  children: React.ReactNode
  className?: string
}

export function RightSheetContent({ children, className }: RightSheetContentProps) {
  return (
    <div 
      className={cn(
        "flex-1 overflow-y-auto overscroll-contain",
        className
      )}
      style={{
        WebkitOverflowScrolling: 'touch',
        paddingLeft: 'max(1.5rem, env(safe-area-inset-left))',
        paddingRight: 'max(1.5rem, env(safe-area-inset-right))',
      }}
    >
      {children}
    </div>
  )
}

interface RightSheetFooterProps {
  children: React.ReactNode
  className?: string
}

export function RightSheetFooter({ children, className }: RightSheetFooterProps) {
  return (
    <div 
      className={cn(
        "flex-shrink-0 border-t bg-background",
        "sticky bottom-0 z-20",
        className
      )}
      style={{
        paddingTop: '1rem',
        paddingLeft: 'max(1.5rem, env(safe-area-inset-left))',
        paddingRight: 'max(1.5rem, env(safe-area-inset-right))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      {children}
    </div>
  )
}
