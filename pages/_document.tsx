
import React from 'react';
import Document, { Html, Head, Main, NextScript, DocumentContext, DocumentInitialProps } from 'next/document';
import { getSiteSettings } from '../lib/data';

interface MyDocumentProps extends DocumentInitialProps {
  siteIconUrl: string;
  ogadsScriptUrl: string | null;
}

class MyDocument extends Document<MyDocumentProps> {
  static async getInitialProps(ctx: DocumentContext): Promise<MyDocumentProps> {
    const initialProps = await Document.getInitialProps(ctx);
    try {
      const settings = await getSiteSettings();
      let scriptUrl: string | null = null;

      if (settings.ogads_script_src) {
        // Use a regex to extract the src attribute's value from the full script tag
        const srcMatch = settings.ogads_script_src.match(/src=["']([^"']+)["']/);
        if (srcMatch && srcMatch[1]) {
          scriptUrl = srcMatch[1];
        }
      }

      return { 
        ...initialProps,
        ogadsScriptUrl: scriptUrl,
        siteIconUrl: settings.site_icon_url,
      };
    } catch (error) {
      console.error('Failed to fetch site settings in _document:', error);
      // Fallback values to prevent site crash on error
      return { 
        ...initialProps,
        ogadsScriptUrl: null,
        siteIconUrl: '/favicon.ico',
      };
    }
  }

  render() {
    const { ogadsScriptUrl, siteIconUrl } = this.props;
    
    return (
      <Html lang="en" className="font-sans">
        <Head>
          <meta charSet="UTF-8" />
          
          {/* Favicon links - A modern, comprehensive set for all devices */}
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="manifest" href="/site.webmanifest" />
          <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#7c3aed" />
          <meta name="msapplication-TileColor" content="#603cba" />
          <meta name="theme-color" content="#ffffff" />
          {/* Use the dynamically fetched favicon URL */}
          <link rel="icon" href={siteIconUrl} />

          {/* OGAds Content Locker Script - Injected server-side for reliability */}
          {ogadsScriptUrl && (
            <script
              id="ogjs"
              type="text/javascript"
              src={ogadsScriptUrl}
            />
          )}

          {/* Google reCAPTCHA Script */}
          <script src="https://www.google.com/recaptcha/api.js" async defer></script>
        </Head>
        <body>
          <script
            dangerouslySetInnerHTML={{
              __html: `
              (function() {
                  function getInitialTheme() {
                      try {
                          const storedTheme = window.localStorage.getItem('theme');
                          if (storedTheme) return storedTheme;
                          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                      } catch (e) {
                          return 'dark'; // Default to dark on error
                      }
                  }
                  const theme = getInitialTheme();
                  if (theme === 'light') {
                      document.documentElement.classList.add('light');
                  }
              })();
              `,
            }}
          />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
