import Head from 'next/head';
import { useRouter } from 'next/router';

// !STARTERCONF Change these default meta
const defaultMeta = {
  title: 'Allinpod.ai - AI speech software',
  siteName: 'Allinpod.ai',
  description:
    "Make All-in podcast Besties talk with AI Speech Software. Create content you've always wanted with prime AI speech and video generation software. Discover the future of podcasting - Allinpod.ai",
  /** Without additional '/' on the end, e.g. https://theodorusclarence.com */
  url: 'https://allinpod.ai',
  type: 'website',
  robots: 'follow, index',
  /**
   * No need to be filled, will be populated with openGraph function
   * If you wish to use a normal image, just specify the path below
   */
  image: 'https://allinpod.ai/images/CoverOpen.png',
};

type SeoProps = {
  date?: string;
  templateTitle?: string;
} & Partial<typeof defaultMeta>;

export default function Seo(props: SeoProps) {
  const router = useRouter();
  const meta = {
    ...defaultMeta,
    ...props,
  };
  meta['title'] = props.templateTitle
    ? `${props.templateTitle} | ${meta.siteName}`
    : meta.title;

  // Use siteName if there is templateTitle
  // but show full title if there is none
  // !STARTERCONF Follow config for opengraph, by deploying one on https://github.com/theodorusclarence/og
  // ? Uncomment code below if you want to use default open graph
  // meta['image'] = openGraph({
  //   description: meta.description,
  //   siteName: props.templateTitle ? meta.siteName : meta.title,
  //   templateTitle: props.templateTitle,
  // });

  return (
    <Head>
      <title>{meta.title}</title>
      <meta name='robots' content={meta.robots} />
      <meta content={meta.description} name='description' />
      <meta property='og:url' content={`${meta.url}${router.asPath}`} />
      <link rel='canonical' href={`${meta.url}${router.asPath}`} />
      {/* Open Graph */}
      <meta property='og:type' content={meta.type} />
      <meta property='og:site_name' content={meta.siteName} />
      <meta property='og:description' content={meta.description} />
      <meta property='og:title' content={meta.title} />
      <meta name='image' property='og:image' content={meta.image} />
      {/* Twitter */}
      <meta name='twitter:card' content='summary_large_image' />
      {/* // !STARTERCONF Remove or change to your handle */}
      {/* <meta name='twitter:site' content='@th_clarence' /> */}
      <meta name='twitter:title' content={meta.title} />
      <meta name='twitter:description' content={meta.description} />
      <meta name='twitter:image' content={meta.image} />
      {meta.date && (
        <>
          <meta property='article:published_time' content={meta.date} />
          <meta
            name='publish_date'
            property='og:publish_date'
            content={meta.date}
          />
          {/* // !STARTERCONF Remove or change to your name */}
          <meta
            name='author'
            property='article:author'
            content='Theodorus Clarence'
          />
        </>
      )}

      {/* Favicons */}
      {favicons.map((linkProps) => (
        <link key={linkProps.href} {...linkProps} />
      ))}
      <meta name='msapplication-TileColor' content='#ffffff' />
      <meta name='msapplication-config' content='/favicon/browserconfig.xml' />
      <meta name='theme-color' content='#ffffff' />
      {/* <link
        rel='stylesheet'
        href='https://use.fontawesome.com/releases/v5.15.4/css/all.css'
        integrity='sha384-DyZ88mC6Up2uqS4h/KRgHuoeGwBcD4Ng9SiP4dIRy0EXTlnuz47vAwmeGwVChigm'
      ></link> */}
    </Head>
  );
}

// !STARTERCONF this is the default favicon, you can generate your own from https://realfavicongenerator.net/
// ! then replace the whole /public/favicon folder and favicon.ico
const favicons: Array<React.ComponentPropsWithoutRef<'link'>> = [
  {
    rel: 'apple-touch-icon',
    sizes: '180x180',
    href: '/favicon/allinpod-icon.png',
  },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '32x32',
    href: '/favicon/allinpod-icon.png',
  },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '16x16',
    href: '/favicon/allinpod-icon.png',
  },
  { rel: 'manifest', href: '/favicon/site.webmanifest' },
  {
    rel: 'mask-icon',
    href: '/favicon/allinpod-icon.png',
    color: '#00e887',
  },
  { rel: 'shortcut icon', href: '/favicon/allinpod-icon.png' },
];
