
import React from 'react';
import Image from 'next/image';
import { Product } from '../../types';

interface ProductPreviewProps {
  data: Partial<Product>;
}

const ProductPreview: React.FC<ProductPreviewProps> = ({ data }) => {
  const {
    name = 'Product Name',
    price = '29.99',
    imageUrl = 'https://picsum.photos/seed/product-placeholder/400/400',
    description = 'A detailed and convincing description of the product will be displayed here. Highlight the key features and benefits.',
    gallery = [],
  } = data;
  
  const mainImage = gallery[0] || imageUrl || 'https://picsum.photos/seed/product-placeholder/400/400';
  const displayGallery = gallery.length > 0 ? gallery : (imageUrl ? [imageUrl] : []);

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            <div>
                <div className="bg-gray-800 rounded-2xl overflow-hidden mb-4 aspect-square relative w-full">
                   <Image src={mainImage} alt={name || 'Product Preview'} key={mainImage} fill sizes="100vw" className="object-cover" />
                </div>
                {displayGallery.length > 1 && (
                    <div className="flex gap-2">
                        {displayGallery.map((img, index) => (
                            <div key={index} className="w-1/4 rounded-lg overflow-hidden aspect-square border-2 relative border-gray-700">
                                <Image src={img} alt={`${name} thumbnail ${index + 1}`} fill sizes="25vw" className="object-cover" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="flex flex-col">
                 <h1 className="text-3xl font-extrabold text-white mb-2">{name}</h1>
                 <p className="text-3xl font-bold text-purple-400 mb-6">${price}</p>
                 <div className="prose prose-invert prose-p:text-gray-300 mb-8">
                     <p>{description}</p>
                 </div>
                 <button className="mt-auto w-full text-center bg-green-500 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-green-600 transition-colors">Buy Now</button>
            </div>
        </div>
    </div>
  );
};

export default ProductPreview;
