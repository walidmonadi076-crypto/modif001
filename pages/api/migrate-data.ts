
import type { NextApiRequest, NextApiResponse } from "next";
import { Client } from "pg";
import { GAMES_DATA } from "../../data/games";
import { BLOGS_DATA, COMMENTS_DATA } from "../../data/blogs";
import { PRODUCTS_DATA } from "../../data/products";
import { isAuthorized } from "./auth/check";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    return res.status(500).json({ error: "DATABASE_URL not configured" });
  }

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query('BEGIN');

    await client.query("DELETE FROM comments");
    await client.query("DELETE FROM blog_posts");
    await client.query("DELETE FROM games");
    await client.query("DELETE FROM products");
    
    await client.query("ALTER SEQUENCE comments_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE blog_posts_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE games_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE products_id_seq RESTART WITH 1");

    for (const game of GAMES_DATA) {
      await client.query(
        `INSERT INTO games (id, slug, title, image_url, category, tags, theme, description, video_url, download_url, gallery) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [game.id, game.slug, game.title, game.imageUrl, game.category, game.tags || [], game.theme || null, game.description, game.videoUrl || null, game.downloadUrl, game.gallery]
      );
    }

    for (const blog of BLOGS_DATA) {
      await client.query(
        `INSERT INTO blog_posts (id, slug, title, summary, image_url, video_url, author, publish_date, rating, affiliate_url, content, category) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [blog.id, blog.slug, blog.title, blog.summary, blog.imageUrl, blog.videoUrl || null, blog.author, blog.publishDate, blog.rating, blog.affiliateUrl, blog.content, blog.category]
      );
    }

    for (const product of PRODUCTS_DATA) {
      const numericPrice = parseFloat(product.price.replace(/[^0-9.]/g, '')) || 0;
      await client.query(
        `INSERT INTO products (id, slug, name, image_url, price, url, description, gallery, category) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [product.id, product.slug, product.name, product.imageUrl, numericPrice, product.url, product.description, product.gallery, product.category]
      );
    }

    for (const [blogId, comments] of Object.entries(COMMENTS_DATA)) {
      for (const comment of comments) {
        await client.query(
          `INSERT INTO comments (id, blog_post_id, author, avatar_url, date, text, status, email) 
           VALUES ($1, $2, $3, $4, $5, $6, 'approved', $7)`,
          [comment.id, parseInt(blogId), comment.author, comment.avatarUrl, comment.date, comment.text, `seeduser${comment.id}@example.com`]
        );
      }
    }

    await client.query(`SELECT setval('games_id_seq', (SELECT MAX(id) FROM games), true)`);
    await client.query(`SELECT setval('blog_posts_id_seq', (SELECT MAX(id) FROM blog_posts), true)`);
    await client.query(`SELECT setval('products_id_seq', (SELECT MAX(id) FROM products), true)`);
    await client.query(`SELECT setval('comments_id_seq', (SELECT MAX(id) FROM comments), true)`);
    
    await client.query('COMMIT');

    res.status(200).json({ 
      success: true, 
      message: "Data migrated successfully",
      counts: {
        games: GAMES_DATA.length,
        blogs: BLOGS_DATA.length,
        products: PRODUCTS_DATA.length,
        comments: Object.values(COMMENTS_DATA).flat().length
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  } finally {
    await client.end();
  }
}