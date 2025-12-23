import { useState } from 'react';
import { CommandCenterSidebar } from './CommandCenterSidebar';
import { CommandCenterHeader } from './CommandCenterHeader';

interface CommandCenterLayoutProps {
    children: React.ReactNode;
}

export function CommandCenterLayout({ children }: CommandCenterLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="flex h-screen w-full bg-[#0a0f1c] text-slate-100 overflow-hidden font-sans">
            {/* SIDEBAR */}
            <CommandCenterSidebar
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
            />

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col relative z-10 overflow-hidden bg-[#0a0f1c]">
                {/* Header */}
                <CommandCenterHeader />

                {/* Content Wrapper */}
                <div className="flex-1 overflow-auto relative p-6">
                    <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                    <div className="relative z-10 h-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
