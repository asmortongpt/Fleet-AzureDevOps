import {
  Gear,
  Bell,
  SignOut,
  List,
  X
} from "@phosphor-icons/react";
import { useState, useMemo } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";

import { ThemeToggle } from "@/components/ThemeToggle";
import { ToastContainer } from "@/components/common/ToastContainer";
import { RoleSwitcher } from "@/components/demo/RoleSwitcher";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { navigationItems } from "@/lib/navigation";

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const activeModule = useMemo(() => {
    const currentPath = location.pathname.split("/")[1];
    return navigationItems.find((item) => item.id === currentPath) || navigationItems[0];
  }, [location.pathname]);

  const groupedNav = useMemo(() => {
    const groups: Record<string, typeof navigationItems> = {
      main: [],
      management: [],
      procurement: [],
      communication: [],
      tools: [],
    };

    navigationItems.forEach((item) => {
      const section = item.section || "main";
      groups[section].push(item);
    });

    return groups;
  }, []);

  return (
    <>
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>

      <div className="min-h-screen bg-background flex">
        <aside
          className={`fixed left-0 top-0 h-full bg-card border-r transition-all duration-300 z-50 ${
            sidebarOpen ? "w-64" : "w-0"
          } overflow-hidden`}
        >
          <div className="p-6 flex items-center justify-between border-b">
            <div className="flex items-center gap-3">
              <img
                src="/logos/logo-horizontal.svg"
                alt="Fleet Management"
                className="h-8 w-auto"
              />
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-140px)]">
            <div className="p-4 space-y-6">
              {Object.entries(groupedNav).map(([section, items]) => {
                if (items.length === 0) return null;

                return (
                  <div key={section}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                      {section}
                    </p>
                    <div className="space-y-1">
                      {items.map((item) => (
                          <Button
                            key={item.id}
                            variant={
                              activeModule.id === item.id ? "secondary" : "ghost"
                            }
                            className="w-full justify-start gap-2"
                            asChild
                            aria-label={`Navigate to ${item.label}`}>
                            <Link to={item.path}>
                              {item.icon}
                              <span className="text-sm">{item.label}</span>
                            </Link>
                          </Button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-card">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => setSidebarOpen(false)}
              aria-label="Collapse sidebar"
            >
              <X className="w-4 h-4" />
              <span className="text-sm">Collapse</span>
            </Button>
          </div>
        </aside>

        <div
          className={`flex-1 transition-all duration-300 ${
            sidebarOpen ? "ml-64" : "ml-0"
          }`}
        >
          <header className="border-b bg-card sticky top-0 z-40">
            <div className="px-6 h-16 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                  title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                >
                  <List className="w-5 h-5" />
                </Button>
                <div>
                  <h2 className="font-semibold">{activeModule.label}</h2>
                  <p className="text-xs text-muted-foreground">
                    Fleet Management System
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Button variant="ghost" size="icon" aria-label="Action button">
                  <Bell className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                 aria-label="Action button">
                  <Link to="/settings">
                    <Gear className="w-5 h-5" />
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full"
                     aria-label="Action button">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          FM
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Gear className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <SignOut className="w-4 h-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main id="main-content" className="p-6">
            <Outlet />
          </main>
        </div>

        {/* Role Switcher FAB button */}
        <RoleSwitcher />

        {/* Toast notifications */}
        <ToastContainer />
      </div>
    </>
  );
}
