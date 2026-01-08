import {
    Microphone,
    Radio,
    Warning,
    SpeakerHigh,
    SpeakerSlash
} from "@phosphor-icons/react";
import React, { useState, useEffect } from "react";

import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { ScrollArea } from "../../ui/scroll-area";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "../../ui/sheet";

import { useDispatchSocket } from "@/hooks/useDispatchSocket";
import { usePTT } from "@/hooks/usePTT";

interface DispatchPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const DispatchPanel: React.FC<DispatchPanelProps> = ({ open, onOpenChange }) => {
    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isPressing, setIsPressing] = useState(false);
    const [channels, setChannels] = useState<any[]>([]);

    // We reuse the existing hooks logic, adapting for the panel
    const dispatch = useDispatchSocket({
        channelId: selectedChannelId || undefined,
        autoConnect: open, // Only connect when panel is open to save resources
        onEmergencyAlert: (alert) => console.log('Emergency alert:', alert),
        onTransmission: (t) => console.log('Transmission:', t)
    });

    const ptt = usePTT({
        onAudioChunk: (data) => {
            if (ptt.currentTransmissionId) dispatch.sendAudioChunk(data, ptt.currentTransmissionId);
        },
        onTransmissionStart: () => console.log('PTT Start'),
        onTransmissionEnd: (blob) => {
            console.log('PTT End');
            if (ptt.currentTransmissionId) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64 = (reader.result as string).split(',')[1];
                    dispatch.endTransmission(ptt.currentTransmissionId!, base64);
                };
                reader.readAsDataURL(blob);
            }
        },
        enableKeyboardShortcut: open // Only enable shortcut when open
    });

    // Mock channels if API fails or for immediate feedback
    useEffect(() => {
        setChannels([
            { id: 'ch-1', name: 'Operations Main', status: 'ACTIVE', frequency: '450.025' },
            { id: 'ch-2', name: 'Maintenance', status: 'ACTIVE', frequency: '451.100' },
            { id: 'ch-3', name: 'Security', status: 'BUSY', frequency: '452.325' },
            { id: 'ch-4', name: 'Logistics', status: 'ACTIVE', frequency: '453.550' }
        ]);
        setSelectedChannelId('ch-1');
    }, []);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                className="w-[400px] sm:w-[480px] flex flex-col p-0 text-foreground border-l glass-panel border-white/10"
                side="right"
                // Override default bg to allow glass effect
                style={{ backgroundColor: 'transparent' }}
            >
                <SheetHeader className="p-6 border-b border-white/10 bg-black/20">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-xl font-semibold flex items-center gap-2 text-white">
                            <Radio className="w-6 h-6 text-emerald-400" weight="fill" />
                            Dispatch Radio
                        </SheetTitle>
                        <div className={`w-3 h-3 rounded-full ${dispatch.isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    </div>
                    <SheetDescription>
                        Live PTT communication and fleet alerts.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 flex flex-col min-h-0">
                    {/* PTT Section */}
                    <div className="p-6 flex flex-col items-center gap-4 border-b bg-card">
                        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            {channels.find(c => c.id === selectedChannelId)?.name || 'Select Channel'}
                        </div>

                        <Button
                            className={`h-24 w-full rounded-2xl relative overflow-hidden transition-all duration-300 flex flex-col items-center justify-center gap-2 ${(ptt.isTransmitting || isPressing)
                                ? "bg-red-500/20 border-red-500/50 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 hover:border-emerald-500/40"
                                } border-2`}
                            onMouseDown={() => { setIsPressing(true); ptt.startPTT(); }}
                            onMouseUp={() => { setIsPressing(false); ptt.stopPTT(); }}
                            onMouseLeave={() => { setIsPressing(false); ptt.stopPTT(); }}
                            onTouchStart={() => { setIsPressing(true); ptt.startPTT(); }}
                            onTouchEnd={() => { setIsPressing(false); ptt.stopPTT(); }}
                            disabled={!selectedChannelId}
                        >
                            {/* Waveform Visualizer - Only visible when transmitting */}
                            {(ptt.isTransmitting || isPressing) && (
                                <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-50">
                                    {[...Array(12)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-1.5 bg-red-500 h-4 rounded-full animate-waveform"
                                            style={{ animationDelay: `${i * 0.05}s` }}
                                        />
                                    ))}
                                </div>
                            )}

                            <div className="relative z-10 flex flex-col items-center">
                                <Microphone className={`w-8 h-8 mb-1 ${(ptt.isTransmitting || isPressing) ? "animate-pulse" : ""}`} weight="fill" />
                                <span className="font-bold tracking-wider font-mono">
                                    {(ptt.isTransmitting || isPressing) ? "TRANSMITTING" : "PUSH TO TALK"}
                                </span>
                            </div>
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsMuted(!isMuted)}
                            className={isMuted ? 'text-red-500' : 'text-muted-foreground'}
                        >
                            {isMuted ? <SpeakerSlash className="w-4 h-4 mr-2" /> : <SpeakerHigh className="w-4 h-4 mr-2" />}
                            {isMuted ? 'Audio Muted' : 'Audio Active'}
                        </Button>
                    </div>

                    {/* Channels & History */}
                    <div className="flex-1 min-h-0 grid grid-cols-2 divide-x">
                        {/* Channel List */}
                        <div className="flex flex-col bg-muted/5">
                            <div className="p-3 text-xs font-semibold text-muted-foreground uppercase bg-muted/10 border-b">Channels</div>
                            <ScrollArea className="flex-1">
                                <div className="p-2 space-y-1">
                                    {channels.map(channel => (
                                        <button
                                            key={channel.id}
                                            onClick={() => setSelectedChannelId(channel.id)}
                                            className={`
                                        w-full text-left p-2 rounded-md text-sm transition-colors flex items-center justify-between
                                        ${selectedChannelId === channel.id
                                                    ? 'bg-primary/10 text-primary font-medium'
                                                    : 'hover:bg-muted text-muted-foreground'}
                                    `}
                                        >
                                            <span>{channel.name}</span>
                                            {channel.status === 'BUSY' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                                        </button>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* History */}
                        <div className="flex flex-col">
                            <div className="p-3 text-xs font-semibold text-muted-foreground uppercase bg-muted/10 border-b">Recent Activity</div>
                            <ScrollArea className="flex-1">
                                <div className="divide-y">
                                    {/* Mock history items */}
                                    {[1, 2, 3].map((_, i) => (
                                        <div key={i} className="p-3 hover:bg-muted/5">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-bold">Unit 45</span>
                                                <span className="text-[10px] text-muted-foreground">10:42 AM</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground line-clamp-2">
                                                "Arrived at destination. Offloading cargo now."
                                            </div>
                                            <div className="flex items-center gap-1 mt-1">
                                                <Badge variant="outline" className="text-[10px] h-4 px-1">Normal</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                </div>

                {/* Emergency Footer */}
                <div className="p-4 border-t bg-destructive/5">
                    <Button variant="destructive" className="w-full font-bold" size="lg">
                        <Warning className="w-5 h-5 mr-2" />
                        EMERGENCY ALERT
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
};
