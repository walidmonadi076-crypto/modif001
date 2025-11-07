import type { ReactElement } from 'react';

export interface Game {
  id: number;
  slug: string;
  title: string;
  imageUrl: string;
  category: string;
  tags?: string[];
  theme?: 'dark' | 'light' | 'colorful' | 'retro';
  description: string;
  videoUrl?: string;
  downloadUrl: string;
  gallery: string[];
}

export interface Product {
  id: number;
  slug: string;
  name: string;
  imageUrl: string;
  price: string;
  url: string;
  description: string;
  gallery: string[];
  category: string;
}

export interface Comment {
  id: number;
  author: string;
  avatarUrl: string;
  date: string;
  text: string;
}

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  summary: string;
  imageUrl: string;
  videoUrl?: string;
  author: string;
  publishDate: string;
  rating: number; // out of 5
  affiliateUrl: string;
  content: string; // This will be markdown/html string
  category: string;
}

export interface SocialLink {
  id: number;
  name: string;
  url: string;
  icon_svg: string; // Storing the full SVG code as text
}

export interface Ad {
  placement: string;
  code: string;
}