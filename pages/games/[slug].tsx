import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import type { GetStaticPaths, GetStaticProps } from 'next';
import { getGameBySlug, getAllGames } from '../../lib/data';
import type { Game } from '../../types';
import Ad from '../../components/Ad';
import SEO from '../../components/SEO';

declare global {
    interface Window { og_load: () => void; }
}

interface GameDetailPageProps { game: Game; }

const GameDetailPage: React.FC<GameDetailPageProps> = ({ game }) => {
    const router = useRouter();

    if (router.isFallback) {
        return <div className="text-center p-10">Chargement du jeu...</div>;
    }

    const gameSchema = {
        "@context": "https://schema.org",
        "@type": "VideoGame",
        "name": game.title,
        "description": game.description,
        "image": game.imageUrl,
        "applicationCategory": "Game",
        "operatingSystem": "Windows, macOS, Linux",
        "genre": game.category,
        "keywords": game.tags?.join(', ') || ''
    };
    
    const handleDownloadClick = () => {
        if (typeof window.og_load === 'function') {
            window.og_load();
        } else {
            console.error("OGAds script not loaded.");
            window.open(game.downloadUrl, '_blank');
        }
    };

    return (
        <>
            <SEO
                title={game.title}
                description={game.description}
                image={game.imageUrl}
                url={`/games/${game.slug}`}
                schema={gameSchema}
            />
            <div className="max-w-7xl mx-auto">
                <div className="mb-4">
                    <Link href="/games" className="text-sm text-purple-400 hover:underline">&lt; Back to Games</Link>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-lg">
                            <div className="aspect-video bg-black relative">
                                {game.videoUrl ? <video src={game.videoUrl} controls autoPlay muted className="w-full h-full object-contain"></video> : <Image src={game.gallery[0] || game.imageUrl} alt={game.title} fill sizes="100vw" className="object-cover" />}
                            </div>
                            <div className="p-6">
                                <h1 className="text-4xl font-extrabold text-white mb-3">{game.title}</h1>
                                <div className="flex flex-wrap gap-2 mb-6">{game.tags?.map(tag => <span key={tag} className="text-xs font-semibold bg-gray-700 text-gray-300 px-2.5 py-1 rounded-full">{tag}</span>)}</div>
                                <p className="text-gray-300 leading-relaxed">{game.description}</p>
                                <button onClick={handleDownloadClick} className="mt-8 inline-block w-full sm:w-auto text-center bg-green-500 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-green-600 transition-colors">Download Now</button>
                            </div>
                        </div>
                        <div className="mt-8 flex justify-center">
                          <Ad placement="game_horizontal" />
                        </div>
                    </div>
                    <div className="space-y-8">
                        <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2">Screenshots</h3>
                        <div className="grid grid-cols-2 gap-4">{game.gallery.map((img, index) => (
                            <div key={index} className="relative rounded-lg object-cover aspect-video overflow-hidden">
                                <Image src={img} alt={`${game.title} screenshot ${index + 1}`} fill sizes="50vw" className="object-cover" />
                            </div>
                        ))}</div>
                        <Ad placement="game_vertical" />
                    </div>
                </div>
            </div>
        </>
    );
};

export const getStaticPaths: GetStaticPaths = async () => {
    const games = await getAllGames();
    const paths = games.map(game => ({
        params: { slug: game.slug },
    }));
    return { paths, fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps = async (context) => {
    const slug = context.params?.slug as string;
    if (!slug) return { notFound: true };

    const game = await getGameBySlug(slug);
    if (!game) return { notFound: true };

    return {
        props: { game },
        revalidate: 60,
    };
};

export default GameDetailPage;