import React from 'react';
import type { GetStaticProps } from 'next';
import Link from 'next/link';
import type { Game } from '../types';
import { getAllGames } from '../lib/data';
import GameCarousel from '../components/GameCarousel';
import GameCard from '../components/GameCard';

const Section: React.FC<{ title: string; children: React.ReactNode; viewMoreLink?: string }> = ({ title, children, viewMoreLink }) => (
    <section className="mb-12">
        <div className="flex justify-between items-baseline mb-4">
            <h2 className="text-3xl font-bold text-text">{title}</h2>
            {viewMoreLink && (
                <Link href={viewMoreLink} className="text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors">
                    View more
                </Link>
            )}
        </div>
        {children}
    </section>
);

interface HomeProps {
    games: Game[];
}

const Home: React.FC<HomeProps> = ({ games }) => {
  const topGame = games.find(g => g.tags?.includes('Top'));
  // The screenshot shows multiple "Play on Comet" games, so we filter for that tag.
  const featuredGames = games.filter(g => g.tags?.includes('Play on Comet'));

  return (
    <div className="space-y-4">
      {topGame && (
        <Section title="Top Games">
          <div className="w-full sm:w-2/3 md:w-1/2 lg:w-2/5">
            <GameCard game={topGame} />
          </div>
        </Section>
      )}
      {featuredGames.length > 0 && (
        <Section title="Featured Games" viewMoreLink="/games">
          <GameCarousel games={featuredGames} cardVariant="featured" />
        </Section>
      )}
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
