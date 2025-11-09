
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import type { GetStaticPaths, GetStaticProps } from 'next';
import { getGameBySlug, getAllGames } from '../../lib/data';
import type { Game } from '../../types';
import Ad from '../../components/Ad';
import SEO from '../../components/SEO';
import Lightbox from '../../components/Lightbox';

declare global {
    interface Window { 
        og_load: () => void;
        onLockerUnlock?: () => void;
    }
}

interface GameDetailPageProps { game: Game; }

const GameDetailPage: React.FC<GameDetailPageProps> = ({ game }) => {
    const router = useRouter();
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isOgadsReady, setIsOgadsReady] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const mediaItems = useMemo(() => {
        const items = [];
        if (game.videoUrl) {
            items.push({ type: 'video' as const, src: game.videoUrl });
        }
        game.gallery.forEach(img => {
            items.push({ type: 'image' as const, src: img });
        });
        if (items.length === 0 && game.imageUrl) {
            items.push({ type: 'image' as const, src: game.imageUrl });
        }
        return items;
    }, [game]);
    
    const openLightbox = (index: number) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    useEffect(() => {
        const handleUnlock = () => {
            console.log("OGAds locker unlocked! Enabling download button.");
            setIsUnlocked(true);
        };
        window.onLockerUnlock = handleUnlock;
        return () => {
            delete window.onLockerUnlock;
        };
    }, []);

    useEffect(() => {
        if (typeof window.og_load === 'function') {
            setIsOgadsReady(true);
            return;
        }
        
        const intervalId = setInterval(() => {
            if (typeof window.og_load === 'function') {
                setIsOgadsReady(true);
                clearInterval(intervalId);
            }
        }, 200);

        return () => clearInterval(intervalId);
    }, []);


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
    
    const handleVerificationClick = () => {
        if (isOgadsReady && typeof window.og_load === 'function') {
            window.og_load();
        } else {
            console.error("OGAds script (og_load) is not available.");
            alert("The verification service is currently unavailable. Please try again later.");
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
                            <button className="aspect-video bg-black relative w-full group" onClick={() => openLightbox(0)}>
                                {game.videoUrl ? <video src={game.videoUrl} autoPlay muted loop className="w-full h-full object-contain"></video> : <Image src={game.gallery[0] || game.imageUrl} alt={game.title} fill sizes="100vw" className="object-cover" />}
                                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path></svg>
                                </div>
                            </button>
                            <div className="p-6">
                                <h1 className="text-4xl font-extrabold text-white mb-3">{game.title}</h1>
                                <div className="flex flex-wrap gap-2 mb-6">{game.tags?.map(tag => <span key={tag} className="text-xs font-semibold bg-gray-700 text-gray-300 px-2.5 py-1 rounded-full">{tag}</span>)}</div>
                                <p className="text-gray-300 leading-relaxed">{game.description}</p>
                                
                                <div className="mt-8">
                                    {!isUnlocked ? (
                                        <button 
                                            onClick={handleVerificationClick}
                                            disabled={!isOgadsReady}
                                            className="inline-block w-full sm:w-auto text-center bg-purple-600 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-purple-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                                        >
                                            {isOgadsReady ? 'Verify & Unlock Download' : 'Initialisation...'}
                                        </button>
                                    ) : (
                                        <a 
                                            href={game.downloadUrl} 
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-block w-full sm:w-auto text-center bg-green-500 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-green-600 transition-colors animate-fade-in-right"
                                        >
                                            Download Now
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 flex justify-center">
                          <Ad placement="game_horizontal" />
                        </div>
                    </div>
                    <div className="space-y-8">
                        <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2">Screenshots</h3>
                        <div className="grid grid-cols-2 gap-4">{game.gallery.map((img, index) => (
                             <button key={index} className="relative rounded-lg object-cover aspect-video overflow-hidden group" onClick={() => openLightbox(game.videoUrl ? index + 1 : index)}>
                                <Image src={img} alt={`${game.title} screenshot ${index + 1}`} fill sizes="50vw" className="object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </button>
                        ))}</div>
                        <Ad placement="game_vertical" />
                    </div>
                </div>
            </div>
            {lightboxOpen && (
                <Lightbox
                    items={mediaItems}
                    startIndex={lightboxIndex}
                    onClose={() => setLightboxOpen(false)}
                />
            )}
        </>
    );
};

export const getStaticPaths: GetStaticPaths = async () => {
    const games = await getAllGames();
    const paths = games
        .filter(game => game && game.slug && typeof game.slug === 'string')
        .map(game => ({
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
