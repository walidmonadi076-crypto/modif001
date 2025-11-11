
import React, { useMemo } from 'react';
import { useRouter } from 'next/router';
import type { GetStaticProps } from 'next';
import type { Game, SiteSettings } from '../types';
import { getAllGames, getSiteSettings } from '../lib/data';
import GameCarousel from '../components/GameCarousel';
import Image from 'next/image';

const Section: React.FC<{ title: string; children: React.ReactNode, viewMore?: boolean, onViewMore?: () => void }> = ({ title, children, viewMore = true, onViewMore }) => (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        {viewMore && <button onClick={onViewMore} className="text-sm font-semibold text-purple-400 hover:text-purple-300">View more</button>}
      </div>
      {children}
    </section>
);

interface HomeProps {
    games: Game[];
    settings: SiteSettings;
}

const Home: React.FC<HomeProps> = ({ games, settings }) => {
  const router = useRouter();

  const sections = useMemo(() => {
    const priorityOrder = ['Play on Comet', 'New', 'Hot', 'Updated', 'Top', 'Featured'];
    // FIX: Use reduce for robust type inference when flattening tags.
    const allTags: string[] = [...new Set(games.reduce<string[]>((acc, g) => acc.concat(g.tags || []), []))];
    const priorityTags = priorityOrder.filter(tag => allTags.includes(tag));
    const otherTags = allTags.filter(tag => !priorityOrder.includes(tag)).sort();
    const orderedTags = [...priorityTags, ...otherTags];

    return orderedTags
      .map(tag => {
        const sectionGames = games.filter(g => g.tags?.includes(tag));
        const title = tag === 'Play on Comet' ? 'Play on Comet' : `${tag} Games`;
        return {
          key: tag.toLowerCase().replace(/\s+/g, '-'),
          title: title,
          games: sectionGames,
          carouselProps: { cardVariant: 'default' as const },
          tag: tag,
        };
      })
      .filter(section => section.games.length > 0);
  }, [games]);

  const handleViewMore = (tag: string) => {
    router.push({
        pathname: '/games',
        query: { tags: tag }
    });
  };

  return (
    <div className="space-y-8">
        <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-12">
            <Image src={settings.hero_bg_url} alt="Welcome banner" fill sizes="100vw" className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent p-6 md:p-12 flex flex-col justify-center">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight" dangerouslySetInnerHTML={{ __html: settings.hero_title }} />
                <p className="mt-2 text-base sm:text-lg text-gray-300">{settings.hero_subtitle}</p>
                <button onClick={() => router.push(settings.hero_button_url)} className="mt-6 bg-purple-600 text-white font-bold py-2 px-5 text-base sm:py-3 sm:px-6 sm:text-lg rounded-lg w-fit hover:bg-purple-700 transition-colors">{settings.hero_button_text}</button>
            </div>
        </div>

        {settings.promo_enabled && (
            <div className="bg-gradient-to-r from-purple-800 to-indigo-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-6 my-12">
                <div className="flex items-center space-x-4">
                    <div className="bg-yellow-400 p-2 rounded-lg relative"><span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-purple-800">1</span><svg className="w-8 h-8 text-yellow-900" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"></path></svg></div>
                    <div><h3 className="text-lg sm:text-xl font-bold">{settings.promo_text}</h3></div>
                </div>
                <button onClick={() => router.push(settings.promo_button_url)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-colors flex-shrink-0">{settings.promo_button_text}</button>
            </div>
        )}
        
        {sections.map(section => (
            <Section 
                key={section.key} 
                title={section.title} 
                onViewMore={() => handleViewMore(section.tag)}
            >
                <GameCarousel games={section.games} {...section.carouselProps} />
            </Section>
        ))}
    </div>
  );
};

export const getStaticProps: GetStaticProps = async () => {
    const [games, settings] = await Promise.all([
        getAllGames(),
        getSiteSettings(),
    ]);

    return {
        props: {
            games,
            settings,
        },
        revalidate: 60,
    };
};

export default Home;