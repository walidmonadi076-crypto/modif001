import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import type { GetStaticProps } from 'next';
import type { Game } from '../../types';
import { getAllGames } from '../../lib/data';
import GameCard from '../../components/GameCard';

const FilterButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-semibold rounded-full transition-colors duration-200 ${
            isActive 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
    >
        {label}
    </button>
);

interface GamesPageProps {
  searchQuery: string;
  games: Game[];
}

const GamesPage: React.FC<GamesPageProps> = ({ searchQuery, games }) => {
  const router = useRouter();
  const selectedCategory = (router.query.category as string) || 'All';

  const categories = useMemo(() => ['All', ...Array.from(new Set(games.map(g => g.category)))], [games]);
  
  const filteredGames = useMemo(() => {
    return games.filter(game => {
        const matchesQuery = game.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || game.category === selectedCategory;
        return matchesQuery && matchesCategory;
    });
  }, [games, selectedCategory, searchQuery]);
  
  const handleCategorySelect = (cat: string) => {
    const newQuery = { ...router.query };
    if (cat === 'All' || cat === selectedCategory) {
        delete newQuery.category;
    } else {
        newQuery.category = cat;
    }
    router.push({ pathname: '/games', query: newQuery }, undefined, { shallow: true });
  };
  
  const areFiltersActive = searchQuery || (selectedCategory && selectedCategory !== 'All');

  return (
    <div>
      <h1 className="text-4xl font-bold mb-4">
        {areFiltersActive ? `Results (${filteredGames.length})` : 'All Games'}
      </h1>
      
      <div className="flex flex-wrap gap-2 items-center mb-8">
        <span className="text-sm font-medium text-gray-400 mr-2 hidden sm:inline">Categories:</span>
        {categories.map(cat => (
          <FilterButton key={cat} label={cat} isActive={selectedCategory === cat} onClick={() => handleCategorySelect(cat)} />
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filteredGames.map(game => (
            <GameCard key={game.id} game={game} />
        ))}
      </div>
       {filteredGames.length === 0 && (
          <div className="text-center py-10 col-span-full">
              <p className="text-gray-400">No games found. Try adjusting your search or filters.</p>
          </div>
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

export default GamesPage;