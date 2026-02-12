import {
    Mic,
    Radio,
    AlertTriangle,
    Volume2,
    VolumeX
} from "lucide-react";
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
import logger from '@/utils/logger';

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
        onEmergencyAlert: (alert) => logger.info('Emergency alert:', alert),
    });

    useEffect(() => {
        if (!open) return;
        if (!selectedChannelId) return;
        if (!dispatch.isConnected) return;
        dispatch.subscribeToChannel(selectedChannelId);
    }, [dispatch.isConnected, open, selectedChannelId]);

    const ptt = usePTT({
        onAudioChunk: (data) => {
            if (dispatch.activeTransmission?.id) dispatch.sendAudioChunk(data, dispatch.activeTransmission.id);
        },
        onTransmissionStart: () => logger.info('PTT Start'),
        onTransmissionEnd: (blob) => {
            logger.info('PTT End');
            if (dispatch.activeTransmission?.id) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64 = (reader.result as string).split(',')[1];
                    dispatch.endTransmission(dispatch.activeTransmission!.id, base64);
                };
                reader.readAsDataURL(blob);
            }
        },
        enableKeyboardShortcut: open // Only enable shortcut when open
    });

    // Load channels from DB-backed API when the panel opens.
    useEffect(() => {
        if (!open) return;
        let cancelled = false;

        const loadChannels = async () => {
            try {
                const res = await fetch('/api/dispatch/channels', { credentials: 'include' });
                const json = await res.json();
                if (!cancelled && json?.success) {
                    setChannels(Array.isArray(json.channels) ? json.channels : []);
                    if (Array.isArray(json.channels) && json.channels.length > 0) {
                        setSelectedChannelId((prev) => prev || json.channels[0].id);
                    }
                }
            } catch (err) {
                logger.error('[DispatchPanel] Failed to load channels', err);
            }
        };

        loadChannels();
        return () => {
            cancelled = true;
        };
    }, [open]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                className="w-[400px] sm:w-[480px] flex flex-col p-0 text-foreground border-l glass-panel border-white/10"
                side="right"
                // Override default bg to allow glass effect
                style={{ backgroundColor: 'transparent' }}
            >
                <SheetHeader className="p-3 border-b border-white/10 bg-black/20">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-base font-semibold flex items-center gap-2 text-white">
                            <Radio className="w-4 h-4 text-emerald-700" />
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
                    <div className="p-3 flex flex-col items-center gap-2 border-b bg-card">
                        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            {channels.find(c => c.id === selectedChannelId)?.name || 'Select Channel'}
                        </div>

                        <Button
                            className={`h-24 w-full rounded-lg relative overflow-hidden transition-all duration-300 flex flex-col items-center justify-center gap-2 ${(ptt.isTransmitting || isPressing)
                                ? "bg-red-500/20 border-red-500/50 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20 hover:border-emerald-500/40"
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
                                <Mic className={`w-4 h-4 mb-1 ${(ptt.isTransmitting || isPressing) ? "animate-pulse" : ""}`} />
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
                            {isMuted ? <VolumeX className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
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
                                            onClick={() => {
                                                setSelectedChannelId(channel.id);
                                                dispatch.subscribeToChannel(channel.id);
                                            }}
                                            className={`
                                        w-full text-left p-2 rounded-md text-sm transition-colors flex items-center justify-between
                                        ${selectedChannelId === channel.id
                                                    ? 'bg-primary/10 text-primary font-medium'
                                                    : 'hover:bg-muted text-muted-foreground'}
                                    `}
                                        >
                                            <span>{channel.name}</span>
                                            {String(channel.channel_type || channel.status || '').toUpperCase() === 'EMERGENCY' && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                            )}
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
                                    {dispatch.recentTransmissions.length === 0 ? (
                                        <div className="p-3 text-xs text-muted-foreground">No recent transmissions.</div>
                                    ) : (
                                        dispatch.recentTransmissions.slice(0, 10).map((t) => (
                                            <div key={t.id} className="p-3 hover:bg-muted/5">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-bold">{t.username || 'Unit'}</span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {new Date(t.startedAt).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-muted-foreground line-clamp-2">
                                                    Transmission {t.id}
                                                </div>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Badge variant="outline" className="text-[10px] h-4 px-1">
                                                        {t.isEmergency ? 'Emergency' : 'Normal'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                </div>

                {/* Emergency Footer */}
                <div className="p-2 border-t bg-destructive/5">
                    <Button variant="destructive" className="w-full font-bold" size="lg">
                        <AlertTriangle className="w-3 h-3 mr-2" />
                        EMERGENCY ALERT
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
};
