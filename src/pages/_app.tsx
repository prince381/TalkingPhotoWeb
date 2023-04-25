import { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import Script from 'next/script';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

import '@/styles/all.css';
import '@/styles/globals.css';
// !STARTERCONF This is for demo purposes, remove @/styles/colors.css import immediately
import '@/styles/colors.css';

import Header from '@/components/layout/Header';

// import { LoaderContextProvider } from '@/context/loader';

/**
 * !STARTERCONF info
 * ? `Layout` component is called in every page using `np` snippets. If you have consistent layout across all page, you can add it here too
 */

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [showHeader, setShowHeader] = React.useState(true);

  React.useLayoutEffect(() => {
    if (
      ['/', '/login', '/success', '/payment-success'].includes(router.pathname)
    ) {
      setShowHeader(false);
    } else {
      setShowHeader(true);
    }
  }, [router]);

  return (
    <>
      <Script
        strategy='afterInteractive'
        src='https://www.googletagmanager.com/gtag/js?id=G-8QX2TDB059'
      />
      <Script id='google-analytics' strategy='afterInteractive'>
        {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-8QX2TDB059');
          `}
      </Script>
      <QueryClientProvider client={queryClient}>
        {showHeader && <Header />}
        <Component {...pageProps} />
      </QueryClientProvider>
    </>
  );
}

export default MyApp;
