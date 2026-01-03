/**
 * AI Assistant Button - Floating Action Button
 *
 * Features:
 * - Floating button for easy access
 * - Opens AI chat panel in dialog/drawer
 * - Context-aware based on hub type
 * - Responsive design
 *
 * Created: 2025-01-03
 */

import { Bot, X } from 'lucide-react';
import React, { useState } from 'react';

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
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const buttonContent = (
    <Button
      onClick={() => setOpen(true)}
      className={`${variant === 'floating'
        ? 'fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50'
        : 'gap-2'
      } ${className}`}
      size={variant === 'floating' ? 'icon' : 'default'}
      title="Open AI Assistant"
    >
      <Bot className={variant === 'floating' ? 'h-6 w-6' : 'h-4 w-4'} />
      {variant === 'inline' && <span>AI Assistant</span>}
    </Button>
  );

  if (isDesktop) {
    return (
      <>
        {buttonContent}
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
      </>
    );
  }

  return (
    <>
      {buttonContent}
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
 * AI Assistant Floating Button - Global floating action button
 */
export function AIAssistantFloatingButton({ hubType = 'general' }: { hubType?: string }) {
  return <AIAssistantButton hubType={hubType} variant="floating" />;
}
