import React, { useState, useEffect } from 'react';
import type { AppProps, AppContext } from 'next/app';
import App from 'next/app';
import { useRouter } from 'next/router';
import { Inter } from 'next/font/google';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import '../styles/globals.css';
import type { SocialLink, SiteSettings } from '@/types';
import { AdProvider, ThemeProvider, SettingsProvider } from '../contexts/AdContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

type MyAppProps = AppProps & {
  pageProps: {
    settings: SiteSettings;
  };
};

function MyApp({ Component, pageProps }: MyAppProps) {
  const router = useRouter();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  const isAdminPage = router.pathname.startsWith('/admin');

  useEffect(() => {
    if (!isAdminPage) {
      fetch('/api/social-links')
        .then(res => res.json())
        .then(data => {
            if(Array.isArray(data)) {
                setSocialLinks(data)
            }
        })
        .catch(console.error);
    }
  }, [isAdminPage]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    const searchablePages = ['/games', '/blog', '/shop'];
    if (query && !searchablePages.includes(router.pathname)) {
      router.push('/games');
    }
  };

  const enhancedPageProps = {
    ...pageProps,
    searchQuery,
    searchActive,
  };
  
  if (isAdminPage) {
    return <Component {...pageProps} />;
  }

  return (
    <ThemeProvider>
      <AdProvider>
        <SettingsProvider value={pageProps.settings}>
          <div className={`bg-gray-900 text-white min-h-screen flex ${inter.variable} font-sans`}>
            {isMobileSidebarOpen && (
              <div
                className="fixed inset-0 bg-black/60 z-50 md:hidden"
                onClick={() => setIsMobileSidebarOpen(false)}
                aria-hidden="true"
              ></div>
            )}
            <Sidebar
              isExpanded={isSidebarExpanded}
              onMouseEnter={() => setIsSidebarExpanded(true)}
              onMouseLeave={() => setIsSidebarExpanded(false)}
              isMobileOpen={isMobileSidebarOpen}
              onMobileClose={() => setIsMobileSidebarOpen(false)}
            />
            <div
              className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
                isSidebarExpanded ? 'md:ml-64' : 'md:ml-20'
              }`}
            >
              <Header
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                onSearchFocus={() => setSearchActive(true)}
                onSearchBlur={() => setTimeout(() => setSearchActive(false), 200)}
                onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                socialLinks={socialLinks}
              />
              <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
                <Component {...enhancedPageProps} />
              </main>
            </div>
          </div>
        </SettingsProvider>
      </AdProvider>
    </ThemeProvider>
  );
}

MyApp.getInitialProps = async (appContext: AppContext) => {
  const appProps = await App.getInitialProps(appContext);
  try {
    const isServer = !!appContext.ctx.req;
    const host = isServer ? appContext.ctx.req?.headers.host : window.location.host;
    const protocol = host?.startsWith('localhost') ? 'http:' : 'https:';
    const baseUrl = `${protocol}//${host}`;
    
    const settingsRes = await fetch(`${baseUrl}/api/settings`);
    if (!settingsRes.ok) {
        throw new Error(`Failed to fetch settings: ${settingsRes.statusText}`);
    }
    const settings = await settingsRes.json();
    appProps.pageProps.settings = settings;

  } catch (e) {
    console.error("Could not fetch site settings in _app", e);
    // Provide default settings if the fetch fails to prevent crash
    appProps.pageProps.settings = {
      site_name: 'G2gaming',
      site_icon_url: '/favicon.ico',
      ogads_script_src: '',
      hero_title: 'Welcome to G2gaming',
      hero_subtitle: 'Your ultimate gaming destination.',
      hero_button_text: 'Explore Games',
      hero_button_url: '/games',
      hero_bg_url: '',
      promo_enabled: false,
      promo_text: '',
      promo_button_text: '',
      promo_button_url: '',
      recaptcha_site_key: '',
    };
  }
  return appProps;
};

export default MyApp;