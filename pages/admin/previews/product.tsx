
import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import type { Product } from '../../../types';
import Ad from '../../../components/Ad';
import SEO from '../../../components/SEO';
import Lightbox from '../../../components/Lightbox';

const ProductPreviewPage: React.FC = () => {
    const [product, setProduct] = useState<Partial<Product>>({
        name: 'Product Preview',
        price: '0.00',
        imageUrl: 'https://picsum.photos/seed/product-placeholder/400/400',
        description: 'Product description will appear here.',
        gallery: [],
        url: '#',
    });
    
    const [mainImage, setMainImage] = useState<string>('');
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            if (event.data?.type === 'preview-update') {
                const payload = event.data.payload as Partial<Product>;
                setProduct(prev => ({ ...prev, ...payload }));
                
                // FIX: Use Array.isArray to safely check for the gallery property.
                // This resolves the TypeScript error by ensuring payload.gallery is an array
                // before we try to access its elements.
                if (Array.isArray(payload.gallery) && payload.gallery.length > 0) {
                    setMainImage(prevMain => payload.gallery.includes(prevMain) ? prevMain : payload.gallery[0]);
                } else if (payload.imageUrl) {
                    setMainImage(payload.imageUrl);
                }
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    useEffect(() => {
        if (!mainImage && product.gallery && product.gallery.length > 0) {
            setMainImage(product.gallery[0]);
        } else if (!mainImage && product.imageUrl) {
            setMainImage(product.imageUrl);
        }
    }, [product, mainImage]);

    const mediaItems = useMemo(() => 
        (product.gallery || []).map(img => ({ type: 'image' as const, src: img }))
    , [product.gallery]);

    const openLightbox = (index: number) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    const displayMainImage = mainImage || 'https://picsum.photos/seed/product-placeholder/400/400';
    const mainImageIndex = (product.gallery || []).findIndex(img => img === displayMainImage);

    return (
        <>
            <SEO title={`Preview: ${product.name}`} noindex={true} />
            <div className="max-w-6xl mx-auto">
                <div className="mb-4">
                    <span className="text-sm text-purple-400 cursor-not-allowed">&lt; Back to Shop</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    <div>
                        <button className="bg-gray-800 rounded-2xl overflow-hidden mb-4 aspect-square relative w-full group" onClick={() => openLightbox(mainImageIndex > -1 ? mainImageIndex : 0)}>
                           <Image key={displayMainImage} src={displayMainImage} alt={product.name || ''} fill sizes="100vw" className="object-cover" />
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                            </div>
                        </button>
                        <div className="flex gap-2">
                            {(product.gallery || []).map((img, index) => (
                                <button key={index} onClick={() => setMainImage(img)} className={`w-1/4 rounded-lg overflow-hidden aspect-square border-2 relative ${mainImage === img ? 'border-purple-500' : 'border-transparent hover:border-gray-500'}`}>
                                    <Image src={img} alt={`${product.name} thumbnail ${index + 1}`} fill sizes="25vw" className="object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col">
                         <h1 className="text-4xl font-extrabold text-white mb-2">{product.name}</h1>
                         <p className="text-4xl font-bold text-purple-400 mb-6">${product.price}</p>
                         <div className="prose prose-invert prose-p:text-gray-300 mb-8">
                             <p>{product.description}</p>
                         </div>
                         <a href={product.url} onClick={(e) => e.preventDefault()} className="mt-auto w-full text-center bg-green-500 text-white font-bold py-4 px-8 rounded-lg text-lg cursor-not-allowed">Buy Now</a>
                        <div className="mt-8 flex justify-center">
                            <Ad placement="shop_square" />
                        </div>
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

export default ProductPreviewPage;
