'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the default experience page
    router.push('/experiences/exp_om7W7jOk4F8btW');
  }, [router]);

  return null;
}

