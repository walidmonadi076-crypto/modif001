
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import type { GetStaticPaths, GetStaticProps } from 'next';
import { getProductBySlug, getAllProducts } from '../../lib/data';
import type { Product } from '../../types';
import Ad from '../../components/Ad';
import SEO from '../../components/SEO';
import Lightbox from '../../components/Lightbox';

interface ProductDetailPageProps { product: Product; }

const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ product }) => {
    const router = useRouter();
    const [mainImage, setMainImage] = useState<string>('');
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const mediaItems = useMemo(() => 
        product.gallery.map(img => ({ type: 'image' as const, src: img }))
    , [product.gallery]);

    const openLightbox = (index: number) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    useEffect(() => {
        if (product) setMainImage(product.gallery[0] || product.imageUrl);
    }, [product]);

    if (router.isFallback) {
        return <div className="text-center p-10">Chargement du produit...</div>;
    }

    const productSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "image": product.imageUrl,
        "description": product.description,
        "offers": {
            "@type": "Offer",
            "url": product.url,
            "priceCurrency": "USD",
            "price": product.price.replace('$', ''),
            "availability": "https://schema.org/InStock"
        }
    };
    
    const mainImageIndex = product.gallery.findIndex(img => img === mainImage);

    return (
        <>
            <SEO
                title={product.name}
                description={product.description}
                image={product.imageUrl}
                url={`/shop/${product.slug}`}
                schema={productSchema}
            />
            <div className="max-w-6xl mx-auto">
                <div className="mb-4">
                    <Link href="/shop" className="text-sm text-purple-400 hover:underline">&lt; Back to Shop</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    <div>
                        <button className="bg-gray-800 rounded-2xl overflow-hidden mb-4 aspect-square relative w-full group" onClick={() => openLightbox(mainImageIndex > -1 ? mainImageIndex : 0)}>
                           {mainImage && <Image src={mainImage} alt={product.name} fill sizes="100vw" className="object-cover" />}
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                            </div>
                        </button>
                        <div className="flex gap-2">
                            {product.gallery.map((img, index) => (
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
                         <a href={product.url} target="_blank" rel="noopener noreferrer" className="mt-auto w-full text-center bg-green-500 text-white font-bold py-4 px-8 rounded-lg text-lg hover:bg-green-600 transition-colors">Buy Now</a>
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

export const getStaticPaths: GetStaticPaths = async () => {
    const products = await getAllProducts();
    const paths = products
        .filter(product => product && product.slug && typeof product.slug === 'string')
        .map(product => ({
            params: { slug: product.slug },
        }));
    return { paths, fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps = async (context) => {
    const slug = context.params?.slug as string;
    if (!slug) return { notFound: true };

    const product = await getProductBySlug(slug);
    if (!product) return { notFound: true };

    return {
        props: { product },
        revalidate: 60,
    };
};

export default ProductDetailPage;
