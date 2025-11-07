import Document, { Html, Head, Main, NextScript, DocumentContext, DocumentInitialProps } from 'next/document';
import type { ReactElement, ReactNode } from 'react';

interface MyDocumentProps {
  ogadsScriptUrl: string | null;
}

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    let ogadsScriptUrl: string | null = null;
    
    try {
      // Use the internal host for server-side fetching, or fallback for local dev
      const host = ctx.req?.headers.host || 'localhost:5000';
      const protocol = host.startsWith('localhost') ? 'http' : 'https';
      const res = await fetch(`${protocol}://${host}/api/settings/ogads-script`);

      if (res.ok) {
        const data = await res.json();
        ogadsScriptUrl = data.scriptUrl;
      }
    } catch (error) {
      console.error('Failed to fetch OGAds script URL:', error);
    }
    
    return { ...initialProps, ogadsScriptUrl };
  }

  render() {
    // FIX: The type of `this.props` in a custom Document is complex, and TypeScript
    // struggles to correctly infer the props added from `getInitialProps`.
    // Casting to `unknown` first resolves the type error, allowing access to custom props.
    const { ogadsScriptUrl } = this.props as unknown as MyDocumentProps;
    
    return (
      <Html lang="en" className="font-sans">
        <Head>
          <meta charSet="UTF-8" />
          <link rel="icon" type="image/x-icon" href="/favicon.ico" />
          
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
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;