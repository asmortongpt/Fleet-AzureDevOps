import { Save, RefreshCw, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigation } from '@/contexts/NavigationContext';
import { getModuleManager, ModuleDefinition } from '@/lib/moduleManager';
import { navigationItems } from '@/lib/navigation';

export default function ModuleAdminPage() {
    const [_modules, setModules] = useState<ModuleDefinition[]>([]);
    const [enabledModules, setEnabledModules] = useState<Set<string>>(new Set());
    const [hasChanges, setHasChanges] = useState(false);
    const manager = getModuleManager();
    const navigationContext = useNavigation();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        const allPackages = manager.getAllPackages();
        const enabled = new Set(manager.getEnabledModules());
        setModules(allPackages);
        setEnabledModules(enabled);
        setHasChanges(false);
    };

    const toggleModule = (moduleId: string, currentStatus: boolean) => {
        const newSet = new Set(enabledModules);
        if (currentStatus) {
            newSet.delete(moduleId);
        } else {
            newSet.add(moduleId);
        }
        setEnabledModules(newSet);
        setHasChanges(true);

        // Update manager immediately for preview (could be deferred)
        manager.setModuleStatus(moduleId, !currentStatus);
    };

    const handleSave = () => {
        try {
            // Persistence is handled inside toggleModule -> persistState
            // Just need to trigger navigation refresh
            navigationContext.updateNavigation();
            toast.success("Module configuration saved successfully");
            setHasChanges(false);
        } catch (error) {
            toast.error("Failed to save configuration");
        }
    };

    const handleReset = () => {
        // Reload from manager (reverting unsaved changes if we weren't auto-saving)
        // Since we auto-save to manager in toggleModule, this is essentially a reload
        loadData();
        navigationContext.updateNavigation();
        toast.info("Configuration reloaded");
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Module Management</h1>
                    <p className="text-muted-foreground mt-2">
                        Enable or disable system modules to customize the experience.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleReset}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reload
                    </Button>
                    <Button onClick={handleSave} disabled={!hasChanges}>
                        <Save className="mr-2 h-4 w-4" />
                        Apply Changes
                    </Button>
                </div>
            </div>

            <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>Admin Control</AlertTitle>
                <AlertDescription>
                    Disabling a module will remove it from the sidebar and navigation for all users.
                    Core modules cannot be disabled.
                </AlertDescription>
            </Alert>

            <Tabs defaultValue="all" className="w-full">
                <TabsList>
                    <TabsTrigger value="all">All Modules</TabsTrigger>
                    <TabsTrigger value="core">Core</TabsTrigger>
                    <TabsTrigger value="management">Management</TabsTrigger>
                    <TabsTrigger value="tools">Tools</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {navigationItems.map((item) => {
                            const packageId = manager.getAllPackages().find(p => p.modules.includes(item.id))?.id;
                            const isEnabled = enabledModules.has(item.id);

                            // Don't show system pages that aren't modules
                            if (item.section === 'hubs') return null;

                            return (
                                <Card key={item.id} className={!isEnabled ? "opacity-75 bg-muted/50" : ""}>
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-lg font-medium flex items-center gap-2">
                                                <span className="p-1.5 bg-primary/10 rounded-md text-primary">
                                                    {item.icon}
                                                </span>
                                                {item.label}
                                            </CardTitle>
                                            <Switch
                                                checked={isEnabled}
                                                onCheckedChange={() => toggleModule(item.id, isEnabled)}
                                            />
                                        </div>
                                        <CardDescription>{packageId ? `Package: ${packageId}` : 'Standalone Module'}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex gap-2 text-xs">
                                            <Badge variant="secondary">{item.section}</Badge>
                                            {item.roles && <Badge variant="outline">Restricted</Badge>}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}