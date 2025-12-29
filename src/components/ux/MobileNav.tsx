import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { navigationItems } from '@/lib/navigation'

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="md:hidden min-w-[44px] min-h-[44px]"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <nav className="flex flex-col gap-1 p-4">
          {navigationItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className="justify-start min-h-[44px] text-base"
              onClick={() => setOpen(false)}
            >
              {item.icon}
              <span className="ml-3">{item.label}</span>
            </Button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
