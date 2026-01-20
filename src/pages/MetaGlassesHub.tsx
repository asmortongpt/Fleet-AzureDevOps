import { Eye, Lightning, Camera, VideoCamera } from "@phosphor-icons/react";
import React from "react";

import { HubLayout } from "@/components/layout/HubLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const MetaGlassesHub: React.FC = () => {
    return (
        <HubLayout title="MetaGlasses">
            <div className="p-6 space-y-6">
                <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-bold tracking-tight text-white">MetaGlasses Control Center</h2>
                    <p className="text-muted-foreground">Manage your AI-powered wearable devices.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-card">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <Eye className="w-8 h-8 text-blue-500" />
                                <Badge>Connected</Badge>
                            </div>
                            <CardTitle className="mt-4">Ray-Ban Meta</CardTitle>
                            <CardDescription>Primary Device</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm space-y-2">
                                <div className="flex justify-between">
                                    <span>Battery</span>
                                    <span className="text-green-500">85%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Storage</span>
                                    <span>12GB Free</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <Lightning className="w-8 h-8 text-yellow-500" />
                                <Badge variant="outline">AI Active</Badge>
                            </div>
                            <CardTitle className="mt-4">AI Vision</CardTitle>
                            <CardDescription>Object Detection</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full">Configure Model</Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-card">
                        <CardHeader>
                            <Camera className="w-8 h-8 text-purple-500" />
                            <CardTitle className="mt-4">Captures</CardTitle>
                            <CardDescription>24 New Photos</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" className="w-full">View Gallery</Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-card">
                        <CardHeader>
                            <VideoCamera className="w-8 h-8 text-red-500" />
                            <CardTitle className="mt-4">Live Stream</CardTitle>
                            <CardDescription>Offline</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="secondary" className="w-full">Start Stream</Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="rounded-lg border bg-card p-4">
                    <h3 className="font-semibold mb-4">Device Status</h3>
                    <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg bg-background/50">
                        <p className="text-muted-foreground">Live Telemetry Graph Placeholder</p>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
};

export default MetaGlassesHub;
