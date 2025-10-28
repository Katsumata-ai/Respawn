'use client';

import { FC, PropsWithChildren } from 'react';
import { WhopIframeSdkProvider } from '@whop/react';

export const ClientLayout: FC<PropsWithChildren> = ({ children }) => {
  const appId = process.env.NEXT_PUBLIC_WHOP_APP_ID;

  console.log('[ClientLayout] Initializing WhopIframeSdkProvider with appId:', appId);

  return (
    <WhopIframeSdkProvider options={{ appId }}>
      {children}
    </WhopIframeSdkProvider>
  );
};

