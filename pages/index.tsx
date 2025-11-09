import React, { useMemo } from 'react';
import { useRouter } from 'next/router';
import type { GetStaticProps } from 'next';
import type { Game } from '../types';
import { getAllGames } from '../lib/data';
import GameCarousel from '../components/GameCarousel';
import GameCard from '../components/GameCard';

const Section: React.FC<{ title: string; children: React.ReactNode, viewMore?: boolean, onViewMore?: () => void }> = ({ title, children, viewMore = true, onViewMore }) => (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-text">{title}</h2>
        {viewMore && onViewMore && <button onClick={onViewMore} className="text-sm font-semibold text-accent hover:text-accent-600">View more</button>}
      </div>
      {children}
    </section>
);

interface HomeProps {
    games: Game[];
}

const Home: React.FC<HomeProps> = ({ games }) => {
  const router = useRouter();

  const { topGames, featuredGames, otherSections } = useMemo(() => {
    // Top games are those with the 'Top' tag.
    const topGames = games.filter(g => g.tags?.includes('Top'));
    
    // Featured games are 'Play on Comet' games based on screenshot badges.
    const featuredGames = games.filter(g => g.tags?.includes('Play on Comet'));

    // All other tags will get their own sections.
    const usedTags = ['Top', 'Play on Comet'];
    const otherTags = [...new Set(games.flatMap(game => game.tags || []))]
      .filter(tag => tag && !usedTags.includes(tag)) // ensure tag is not empty or used
      .sort();

    const otherSections = otherTags
      .map(tag => {
        const sectionGames = games.filter(g => g.tags?.includes(tag));
        const title = `${tag} Games`; // e.g., "New Games"
        return {
          key: tag.toLowerCase().replace(/\s+/g, '-'),
          title: title,
          games: sectionGames,
          tag: tag,
        };
      })
      .filter(section => section.games.length > 0);

    return { topGames, featuredGames, otherSections };
  }, [games]);

  const handleViewMore = (tag: string) => {
    router.push({
        pathname: '/games',
        query: { tags: tag }
    });
  };

  return (
    <div className="space-y-4">
        {topGames.length > 0 && (
            <section className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-text">Top Games</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {topGames.map(game => (
                  <GameCard key={game.id} game={game} variant="featured" />
                ))}
              </div>
            </section>
        )}

        {featuredGames.length > 0 && (
            <>
                <Section 
                    title="Featured Games"
                    onViewMore={() => handleViewMore('Play on Comet')}
                >
                    <GameCarousel games={featuredGames} cardVariant="default" />
                </Section>
                {/* Decorative progress bar to match screenshot */}
                <div className="relative -mt-8 mb-8 px-4 sm:px-6 lg:px-8">
                    <div className="w-full bg-surface-alt rounded-full h-1.5 flex items-center">
                        <div className="bg-accent h-1.5 rounded-full" style={{ width: '30%' }} />
                    </div>
                </div>
            </>
        )}
        
        {otherSections.map(section => (
            <Section 
                key={section.key} 
                title={section.title} 
                onViewMore={() => handleViewMore(section.tag)}
            >
                <GameCarousel games={section.games} cardVariant="default" />
            </Section>
        ))}
    </div>
  );
};

export const getStaticProps: GetStaticProps = async () => {
    const games = await getAllGames();
    return {
        props: {
            games,
        },
        revalidate: 60,
    };
};

export default Home;
