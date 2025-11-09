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

/* ========== ⚙️ SITE SETTINGS ========== */

export interface SiteSettings {
  site_name: string;
  site_icon_url: string;
  ogads_script_src: string;
  hero_title: string;
  hero_subtitle: string;
  hero_button_text: string;
  hero_button_url: string;
  hero_bg_url: string;
  promo_enabled: boolean;
  promo_text: string;
  promo_button_text: string;
  promo_button_url: string;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const result = await query('SELECT key, value FROM site_settings');
  const settings = result.rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {} as Record<string, string>);

  const parseBoolean = (value: string | undefined) => value === 'true';

  return {
    site_name: settings.site_name || 'G2gaming',
    site_icon_url: settings.site_icon_url || '/favicon.ico',
    ogads_script_src: settings.ogads_script_src || '',
    hero_title: settings.hero_title || 'Welcome to<br />G2gaming',
    hero_subtitle: settings.hero_subtitle || 'Your ultimate gaming destination.',
    hero_button_text: settings.hero_button_text || 'Explore Games',
    hero_button_url: settings.hero_button_url || '/games',
    hero_bg_url: settings.hero_bg_url || 'https://picsum.photos/seed/banner/1200/400',
    promo_enabled: parseBoolean(settings.promo_enabled ?? 'true'),
    promo_text: settings.promo_text || 'Climb the new G2gaming leaderboards',
    promo_button_text: settings.promo_button_text || 'Explore games',
    promo_button_url: settings.promo_button_url || '/games',
  };
}