import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import type { GetStaticPaths, GetStaticProps } from 'next';
import { getBlogPostBySlug, getAllBlogPosts, getCommentsByBlogId } from '../../lib/data';
import type { BlogPost, Comment } from '../../types';
import Ad from '../../components/Ad';
import SEO from '../../components/SEO';
import StarRating from '../../components/StarRating';
import CommentCard from '../../components/CommentCard';
import CommentForm from '../../components/CommentForm';

interface BlogDetailPageProps { post: BlogPost; comments: Comment[]; }

const BlogDetailPage: React.FC<BlogDetailPageProps> = ({ post, comments: initialComments }) => {
    const router = useRouter();
    const [comments, setComments] = useState<Comment[]>(initialComments);

    if (router.isFallback) {
        return <div className="text-center p-10">Chargement de l'article...</div>;
    }

    const blogSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": post.title,
        "author": {
            "@type": "Person",
            "name": post.author
        },
        "datePublished": new Date(post.publishDate).toISOString(),
        "image": post.imageUrl,
        "description": post.summary
    };

    const handleCommentAdded = (newComment: Comment) => {
        // Ajoute le nouveau commentaire à l'état local pour un retour visuel immédiat
        // pour l'utilisateur qui vient de poster.
        setComments(prevComments => [newComment, ...prevComments]);
    };

    return (
        <>
            <SEO
                title={post.title}
                description={post.summary}
                image={post.imageUrl}
                url={`/blog/${post.slug}`}
                schema={blogSchema}
            />
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                <aside className="hidden lg:block lg:col-span-2">
                    <div className="sticky top-24"><Ad placement="blog_skyscraper_left" /></div>
                </aside>
                
                <main className="col-span-12 lg:col-span-8">
                     <div className="mb-4">
                        <Link href="/blog" className="text-sm text-purple-400 hover:underline">&lt; Back to Blog</Link>
                    </div>
                    <header className="mb-8">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">{post.title}</h1>
                        <div className="flex items-center text-sm text-gray-400">
                            <span>By {post.author}</span><span className="mx-2">&bull;</span><span>Published on {post.publishDate}</span>
                        </div>
                    </header>

                    <StarRating rating={post.rating} size="large" className="mb-6" />

                    <div className="aspect-video bg-black rounded-2xl overflow-hidden mb-8 shadow-lg relative">
                        {post.videoUrl ? <video src={post.videoUrl} controls autoPlay muted className="w-full h-full object-contain"></video> : <Image src={post.imageUrl} alt={post.title} fill sizes="100vw" className="object-cover" />}
                    </div>
                    
                    <article className="prose prose-invert prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />

                    {post.affiliateUrl && (
                        <div className="my-12 p-6 bg-gray-800 rounded-2xl text-center shadow-lg">
                            <h3 className="text-xl font-bold text-white mb-2">Like what you see?</h3>
                            <p className="text-gray-400 mb-6">Explore it through the link below</p>
                            <a
                                href={post.affiliateUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block bg-green-500 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-green-600 transition-colors"
                            >
                                Explore Here
                            </a>
                        </div>
                    )}

                    <div className="mt-12 pt-8 border-t border-gray-700">
                        <h2 className="text-2xl font-bold text-white mb-6">Comments ({comments.length})</h2>
                        {comments.length > 0 ? (
                            <div className="space-y-6">
                                {comments.map(comment => (
                                    <CommentCard key={comment.id} comment={comment} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400">Be the first to leave a comment!</p>
                        )}
                    </div>

                    <div className="mt-12">
                        <CommentForm postId={post.id} onCommentAdded={handleCommentAdded} />
                    </div>
                </main>

                <aside className="hidden lg:block lg:col-span-2">
                    <div className="sticky top-24"><Ad placement="blog_skyscraper_right" /></div>
                </aside>
            </div>
        </>
    );
};

export const getStaticPaths: GetStaticPaths = async () => {
    const posts = await getAllBlogPosts();
    const paths = posts
        .filter(post => post && post.slug && typeof post.slug === 'string') // Ensures only posts with valid string slugs are processed
        .map(post => ({
            params: { slug: post.slug },
        }));
    return { paths, fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps = async (context) => {
    const slug = context.params?.slug as string;
    if (!slug) return { notFound: true };
    
    const post = await getBlogPostBySlug(slug);
    if (!post) return { notFound: true };
    
    const comments = await getCommentsByBlogId(post.id);
    return {
        props: { post, comments },
        revalidate: 60,
    };
};

export default BlogDetailPage;