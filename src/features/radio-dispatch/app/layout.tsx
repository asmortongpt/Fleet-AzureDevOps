import './globals.css';
import { Providers } from './providers';

// Metadata for the Radio Fleet Dispatch feature
export const metadata = {
  title: 'Radio Fleet Dispatch',
  description: 'AI-powered radio transcription and fleet dispatch management',
  icons: {
    icon: '/favicon.ico',
  },
} as const;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="font-sans">
      <Providers>{children}</Providers>
    </div>
  );
}
