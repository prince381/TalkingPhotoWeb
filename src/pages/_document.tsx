/* eslint-disable @next/next/no-sync-scripts */
import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang='en'>
      <Head>
        <link
          rel='preload'
          href='/fonts/inter-var-latin.woff2'
          as='font'
          type='font/woff2'
          crossOrigin='anonymous'
        />
        <link
          rel='stylesheet'
          href='https://use.fontawesome.com/releases/v5.15.4/css/all.css'
          integrity='sha384-DyZ88mC6Up2uqS4h/KRgHuoeGwBcD4Ng9SiP4dIRy0EXTlnuz47vAwmeGwVChigm'
          crossOrigin='anonymous'
        ></link>
      </Head>
      <body>
        <Main />
        <NextScript />
        <script
          type='module'
          src='https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.esm.js'
        ></script>
        <script
          noModule
          src='https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.js'
        ></script>
      </body>
    </Html>
  );
}
