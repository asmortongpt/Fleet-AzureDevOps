// motion removed - React 19 incompatible
import { Layers, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

interface MapLayer {
    id: string;
    label: string;
    icon: React.ReactNode;
    active: boolean;
    count?: number;
    onToggle: (active: boolean) => void;
}

interface MapLayerControlProps {
    layers: MapLayer[];
}

export function MapLayerControl({ layers }: MapLayerControlProps) {
    const [isOpen, setIsOpen] = useState(false);

    const activeCount = layers.filter(l => l.active).length;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {isOpen && (
                <div
                    className="mb-2 bg-card/85 backdrop-blur-md border border-border/50 shadow-lg rounded-lg p-2 w-64 ring-1 ring-white/5"
                >
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/50">
                        <span className="text-sm font-semibold text-foreground">Map Layers</span>
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{activeCount} Active</Badge>
                    </div>
                    <div className="space-y-3">
                        {layers.map((layer) => (
                            <div key={layer.id} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg transition-colors ${layer.active ? 'bg-blue-500/15 text-blue-200' : 'bg-muted/40 text-muted-foreground group-hover:bg-muted/60'}`}>
                                        {layer.icon}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-sm font-medium ${layer.active ? 'text-foreground' : 'text-muted-foreground'}`}>{layer.label}</span>
                                        {layer.count !== undefined && (
                                            <span className="text-[10px] text-muted-foreground">{layer.count} items</span>
                                        )}
                                    </div>
                                </div>
                                <Switch
                                    checked={layer.active}
                                    onCheckedChange={layer.onToggle}
                                    className="scale-75 data-[state=checked]:bg-blue-500"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Button
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className={`h-9 w-12 rounded-full shadow-sm transition-all duration-300 ${isOpen ? 'bg-foreground rotate-90' : 'bg-card/90 hover:bg-muted/40 text-muted-foreground'
                    }`}
                aria-label={isOpen ? 'Close map layers menu' : 'Open map layers menu'}
                aria-expanded={isOpen}
            >
                {isOpen ? <ChevronRight className="h-5 w-5 text-white" aria-hidden="true" /> : <Layers className="h-5 w-5" aria-hidden="true" />}
            </Button>
        </div>
    );
}
