import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import type { GetStaticProps } from 'next';
import type { BlogPost } from '../../types';
import { getAllBlogPosts } from '../../lib/data';
import StarRating from '../../components/StarRating';

const BlogCard: React.FC<{ post: BlogPost }> = ({ post }) => (
    <Link href={`/blog/${post.slug}`} className="bg-gray-800 rounded-2xl overflow-hidden group shadow-lg transform hover:-translate-y-1 transition-transform duration-200 flex flex-col">
        <div className="aspect-video relative">
            <Image src={post.imageUrl} alt={post.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
        <div className="p-6 flex flex-col flex-grow">
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">{post.title}</h3>
            <p className="text-gray-400 text-sm mb-4 flex-grow">{post.summary}</p>
            <div className="mt-auto pt-4 border-t border-gray-700 flex justify-between items-center">
                <div>
                    <p className="text-xs text-gray-500">{post.author}</p>
                    <p className="text-xs text-gray-500">{post.publishDate}</p>
                </div>
                <StarRating rating={post.rating} />
            </div>
        </div>
    </Link>
);

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

interface BlogsPageProps {
    searchQuery: string;
    posts: BlogPost[];
}

const BlogsPage: React.FC<BlogsPageProps> = ({ searchQuery, posts }) => {
    const router = useRouter();
    const selectedCategory = (router.query.category as string) || 'All';

    const categories = useMemo(() => ['All', ...Array.from(new Set(posts.map(p => p.category)))], [posts]);

    const filteredPosts = useMemo(() => {
        return posts.filter(post => {
            const matchesQuery = post.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
            return matchesQuery && matchesCategory;
        });
    }, [posts, selectedCategory, searchQuery]);

    const handleCategorySelect = (cat: string) => {
        const newQuery = { ...router.query };
        if (cat === 'All' || cat === selectedCategory) {
            delete newQuery.category;
        } else {
            newQuery.category = cat;
        }
        router.push({ pathname: '/blog', query: newQuery }, undefined, { shallow: true });
    };

    const areFiltersActive = searchQuery || (selectedCategory && selectedCategory !== 'All');

    return (
        <div>
            <h1 className="text-4xl font-bold mb-4">
                {areFiltersActive ? `Results (${filteredPosts.length})` : 'Blog, Guides & Reviews'}
            </h1>
            
            <div className="flex flex-wrap gap-2 items-center mb-8">
                <span className="text-sm font-medium text-gray-400 mr-2 hidden sm:inline">Categories:</span>
                {categories.map(cat => (
                    <FilterButton key={cat} label={cat} isActive={selectedCategory === cat} onClick={() => handleCategorySelect(cat)} />
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map(post => <BlogCard key={post.id} post={post} />)}
            </div>
            {filteredPosts.length === 0 && (
                <div className="text-center py-10 col-span-full">
                    <p className="text-gray-400">No blog posts found. Try adjusting your search or filters.</p>
                </div>
            )}
        </div>
    );
};

export const getStaticProps: GetStaticProps = async () => {
    const posts = await getAllBlogPosts();
    return {
        props: {
            posts,
        },
        revalidate: 60,
    };
};

export default BlogsPage;