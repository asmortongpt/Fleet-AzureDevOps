/**
 * AI Assistant Button - Draggable Floating Action Button
 *
 * Features:
 * - Draggable anywhere on screen via Framer Motion
 * - Default position: bottom-right corner
 * - Opens AI chat panel in dialog/drawer
 * - Context-aware based on hub type
 * - Responsive design
 * - Persists position in localStorage
 */

import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import React, { useState, useRef } from 'react';

import { AIChatPanel } from './AIChatPanel';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useMediaQuery } from '@/hooks/use-media-query';

const POSITION_KEY = 'cta-ai-assistant-position';

function getSavedPosition(): { x: number; y: number } | null {
  try {
    const saved = localStorage.getItem(POSITION_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return null;
}

function savePosition(x: number, y: number) {
  try {
    localStorage.setItem(POSITION_KEY, JSON.stringify({ x, y }));
  } catch { /* ignore */ }
}

interface AIAssistantButtonProps {
  hubType?: string;
  variant?: 'floating' | 'inline';
  className?: string;
}

export function AIAssistantButton({
  hubType = 'general',
  variant = 'floating',
  className = ''
}: AIAssistantButtonProps) {
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const constraintsRef = useRef<HTMLDivElement>(null);

  // Inline variant - simple button, no drag
  if (variant === 'inline') {
    return (
      <Button
        onClick={() => setOpen(true)}
        className={`gap-2 ${className}`}
        size="default"
        title="Open AI Assistant"
      >
        <Bot className="h-4 w-4" />
        <span>AI Assistant</span>
      </Button>
    );
  }

  // Floating variant - draggable
  const handleClick = () => {
    if (!isDragging) {
      setOpen(true);
    }
  };

  const chatDialog = isDesktop ? (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl h-[80vh] p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>AI Fleet Assistant</DialogTitle>
        </DialogHeader>
        <div className="h-full">
          <AIChatPanel hubType={hubType} onClose={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  ) : (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent className="h-[90vh]">
        <DrawerHeader className="sr-only">
          <DrawerTitle>AI Fleet Assistant</DrawerTitle>
        </DrawerHeader>
        <div className="h-full overflow-hidden">
          <AIChatPanel hubType={hubType} onClose={() => setOpen(false)} />
        </div>
      </DrawerContent>
    </Drawer>
  );

  return (
    <>
      {/* Full-screen drag constraint boundary */}
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[9998]" />

      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={(_, info) => {
          setTimeout(() => setIsDragging(false), 100);
          // Save position relative to viewport
          const el = document.getElementById('cta-ai-fab');
          if (el) {
            const rect = el.getBoundingClientRect();
            savePosition(rect.left, rect.top);
          }
        }}
        initial={getSavedPosition() || { x: 0, y: 0 }}
        className="fixed bottom-6 right-6 z-[9999] pointer-events-auto"
        id="cta-ai-fab"
        style={{ touchAction: 'none' }}
      >
        <button
          onClick={handleClick}
          title="AI Fleet Assistant - Drag to reposition"
          className={`
            group relative flex items-center justify-center
            h-14 w-14 rounded-full
            bg-gradient-to-br from-[#242424] via-[#1F3076] to-[#242424]
            text-white shadow-lg shadow-[#242424]/30
            hover:shadow-xl hover:shadow-white/15
            hover:scale-105
            active:scale-95
            transition-all duration-200
            border border-white/20
            cursor-grab active:cursor-grabbing
            ${className}
          `}
        >
          <Bot className="h-6 w-6 group-hover:scale-110 transition-transform" />
          {/* White accent ring on hover */}
          <div className="absolute inset-0 rounded-full border-2 border-white/0 group-hover:border-white/40 transition-all duration-300" />
          {/* Pulse indicator */}
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-white border-2 border-white/[0.15]" />
        </button>
      </motion.div>

      {chatDialog}
    </>
  );
}

/**
 * AI Assistant Inline Button - For use in toolbars/headers
 */
export function AIAssistantInlineButton({ hubType = 'general' }: { hubType?: string }) {
  return <AIAssistantButton hubType={hubType} variant="inline" />;
}

/**
 * AI Assistant Floating Button - Global floating action button (draggable)
 */
export function AIAssistantFloatingButton({ hubType = 'general' }: { hubType?: string }) {
  return <AIAssistantButton hubType={hubType} variant="floating" />;
}
