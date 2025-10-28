import type { Metadata } from 'next';
import { ClientLayout } from './layout.client';
import './globals.css';

export const metadata: Metadata = {
  title: 'Course Downloader - Whop App',
  description: 'Download and manage your course videos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}

