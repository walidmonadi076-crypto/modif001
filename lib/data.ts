// lib/data.ts
import { query } from '../db';
import type { BlogPost, Comment, Product, Game } from '../types';

/* ========== 📰 BLOG POSTS ========== */

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const result = await query(`
    SELECT 
      id, slug, title, summary, image_url AS "imageUrl", video_url AS "videoUrl",
      author, publish_date AS "publishDate", rating::float, affiliate_url AS "affiliateUrl",
      content, category
    FROM blog_posts ORDER BY id ASC
  `);
  return result.rows;
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const result = await query(`
    SELECT 
      id, slug, title, summary, image_url AS "imageUrl", video_url AS "videoUrl",
      author, publish_date AS "publishDate", rating::float, affiliate_url AS "affiliateUrl",
      content, category
    FROM blog_posts WHERE slug = $1
  `, [slug]);
  return result.rows.length > 0 ? result.rows[0] : null;
}

/* ========== 💬 COMMENTS ========== */

export async function getCommentsByBlogId(blogId: number): Promise<Comment[]> {
  const result = await query(`
    SELECT id, author, avatar_url AS "avatarUrl", text, date
    FROM comments WHERE blog_post_id = $1 AND status = 'approved' ORDER BY id DESC
  `, [blogId]);
  return result.rows;
}

/* ========== 🛍️ PRODUCTS ========== */

export async function getAllProducts(): Promise<Product[]> {
  const result = await query(`
    SELECT id, slug, name, image_url AS "imageUrl", price, url, description, gallery, category
    FROM products ORDER BY id ASC
  `);
  return result.rows;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const result = await query(`
    SELECT id, slug, name, image_url AS "imageUrl", price, url, description, gallery, category
    FROM products WHERE slug = $1
  `, [slug]);
  return result.rows.length > 0 ? result.rows[0] : null;
}

/* ========== 🎮 GAMES ========== */

export async function getAllGames(): Promise<Game[]> {
  const result = await query(`
    SELECT
      id, slug, title, image_url AS "imageUrl", category, tags, theme, description,
      video_url AS "videoUrl", download_url AS "downloadUrl", gallery
    FROM games ORDER BY id ASC
  `);
  return result.rows;
}

export async function getGameBySlug(slug: string): Promise<Game | null> {
  const result = await query(`
    SELECT
      id, slug, title, image_url AS "imageUrl", category, tags, theme, description,
      video_url AS "videoUrl", download_url AS "downloadUrl", gallery
    FROM games WHERE slug = $1
  `, [slug]);
  return result.rows.length > 0 ? result.rows[0] : null;
}