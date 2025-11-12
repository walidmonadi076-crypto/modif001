import React, { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ICONS, POPULAR_GAME_CATEGORIES, POPULAR_BLOG_CATEGORIES, POPULAR_SHOP_CATEGORIES } from '../constants';
import { useTheme, useSettings } from '../contexts/AdContext';

interface SidebarProps {
    isExpanded: boolean;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    isMobileOpen: boolean;
    onMobileClose: () => void;
}

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const ThemeToggle: React.FC<{ isExpanded: boolean }> = ({ isExpanded }) => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className={
        `flex items-center p-3 rounded-lg transition-all duration-200 text-gray-400 hover:bg-gray-700 hover:text-white
         ${isExpanded ? 'w-full' : 'w-12 h-12 justify-center'}`
      }
      title={isExpanded ? '' : 'Toggle Theme'}
      aria-label="Toggle light and dark theme"
    >
      {theme === 'light' ? <MoonIcon /> : <SunIcon />}
      <span className={`whitespace-nowrap transition-all duration-200 ${isExpanded ? 'ml-4 opacity-100' : 'w-0 opacity-0'}`}>
        {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
      </span>
    </button>
  );
};


const Sidebar: React.FC<SidebarProps> = ({ isExpanded, onMouseEnter, onMouseLeave, isMobileOpen, onMobileClose }) => {
  const router = useRouter();
  const { settings } = useSettings();
  
  const navItems = [
    { href: '/', icon: ICONS.HOME, label: 'Home' },
    { href: '/games', icon: ICONS.ACTION, label: 'Games' },
    { href: '/blog', icon: ICONS.BLOG, label: 'Blog' },
    { href: '/shop', icon: ICONS.STORE, label: 'Shop' },
    { href: '/ai-chat', icon: ICONS.AI_CHAT, label: 'AI Chat' },
  ];

  const { popularLinks, parentPath } = useMemo(() => {
    const path = router.pathname;
    if (path.startsWith('/blog')) {
      return { popularLinks: POPULAR_BLOG_CATEGORIES, parentPath: '/blog' };
    }
    if (path.startsWith('/shop')) {
      return { popularLinks: POPULAR_SHOP_CATEGORIES, parentPath: '/shop' };
    }
    // Default to games for '/', '/games', and '/ai-chat'
    return { popularLinks: POPULAR_GAME_CATEGORIES, parentPath: '/games' };
  }, [router.pathname]);

  const isFullyExpanded = isExpanded || isMobileOpen;

  return (
    <nav 
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`fixed top-0 left-0 h-full bg-gray-800 border-r border-gray-700 flex flex-col py-4 z-[60]
                   transition-all duration-300 ease-in-out
                   ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}
                   md:translate-x-0 
                   ${isExpanded ? 'md:w-64' : 'md:w-20'}
                   ${isFullyExpanded ? 'items-start' : 'items-center'}`}
    >
      <div className={`flex items-center text-purple-500 mb-6 w-full ${isFullyExpanded ? 'pl-6' : 'justify-center'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span className={`text-xl font-bold text-white whitespace-nowrap transition-all duration-200 ${isFullyExpanded ? 'ml-3 opacity-100' : 'w-0 opacity-0'}`}>
            {settings.site_name}
        </span>
      </div>

      <ul className="w-full px-4 space-y-2">
        {navItems.map(item => {
          const isActive = (item.href === '/' && router.pathname === '/') || (item.href !== '/' && router.pathname.startsWith(item.href));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onMobileClose}
                className={
                  `flex items-center p-3 rounded-lg transition-all duration-200
                   ${isActive ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}
                   ${isFullyExpanded ? 'w-full' : 'w-12 h-12 justify-center'}`
                }
                title={isFullyExpanded ? '' : item.label}
              >
                {React.cloneElement(item.icon, { className: 'h-6 w-6 flex-shrink-0' })}
                <span className={`whitespace-nowrap transition-all duration-200 ${isFullyExpanded ? 'ml-4 opacity-100' : 'w-0 opacity-0'}`}>
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto pt-4 w-full">
         <div className="w-full px-4 mb-2">
            <ThemeToggle isExpanded={isFullyExpanded} />
        </div>
        <div className={`w-full px-4 mb-2 ${isFullyExpanded ? 'pl-7' : 'text-center'}`}>
            <h3 className={`text-xs font-semibold text-gray-500 uppercase tracking-wider transition-opacity duration-200 ${isFullyExpanded ? 'opacity-100' : 'opacity-0'}`}>
                Popular
            </h3>
        </div>
        <ul className="w-full px-4 space-y-2">
            {popularLinks.map(item => {
                const href = {
                  pathname: parentPath,
                  query: { category: item.value },
                };
                const isActive = router.pathname === href.pathname && router.query.category === item.value;
                
                return (
                    <li key={item.value}>
                        <Link
                          href={href}
                          onClick={onMobileClose}
                          className={
                              `flex items-center p-3 rounded-lg transition-all duration-200
                              ${isActive ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}
                              ${isFullyExpanded ? 'w-full' : 'w-12 h-12 justify-center'}`
                          }
                          title={isFullyExpanded ? '' : item.label}
                        >
                          {React.cloneElement(item.icon, { className: 'h-6 w-6 flex-shrink-0' })}
                          <span className={`whitespace-nowrap transition-all duration-200 ${isFullyExpanded ? 'ml-4 opacity-100' : 'w-0 opacity-0'}`}>
                              {item.label}
                          </span>
                        </Link>
                    </li>
                );
            })}
        </ul>
      </div>
    </nav>
  );
};

export default Sidebar;