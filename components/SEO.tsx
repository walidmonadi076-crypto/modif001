import Head from 'next/head';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  keywords?: string[];
}

export default function SEO({
  title = 'G2gaming - Download Free Games, Guides & Gear',
  description = 'Your ultimate destination for free downloadable games, expert gaming guides and techniques, and top-quality gear to enhance your gameplay. G2gaming has everything you need to level up.',
  image = 'https://picsum.photos/seed/ogimage/1200/630',
  url = '',
  keywords = ['G2gaming', 'download games', 'free games', 'pc games', 'gaming guides', 'gaming tips', 'gaming techniques', 'gaming gear', 'gaming accessories', 'gaming products'],
}: SEOProps) {
  const fullTitle = title.includes('G2gaming') ? title : `${title} | G2gaming`;
  const fullUrl = url ? `https://yoursite.com${url}` : 'https://yoursite.com';

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="G2gaming" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta name="theme-color" content="#7c3aed" />
      <link rel="canonical" href={fullUrl} />

      <link rel="icon" href="/favicon.ico" />
    </Head>
  );
}