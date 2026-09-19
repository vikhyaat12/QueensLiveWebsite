import type * as React from "react";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  description: string;
  note: string;
  image: string;
  tag: string;
  stock: number;
  rating?: number;
  reviewCount?: number;
  benefits?: string[];
  bestSeller?: boolean;
  newArrival?: boolean;
  featured?: boolean;
  /** Admin visibility controls mirrored from lib/commerce Product */
  homepageVisible?: boolean;
  visible?: boolean;
};

export type BlogPostItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category?: string;
  readTime?: string;
  image?: string;
  author?: string;
  createdAt: string;
  featured?: boolean;
};

export type HomeShared = {
  loading: boolean;
  products: Product[];
  search: string;
  setSearch: (s: string) => void;
  shown: Product[];
  wish: string[];
  toggleWish: (name: string) => void;
  add: (product: Product) => void;
  setQuizOpen: (open: boolean) => void;
  testimonials: Array<{ id: string; name: string; title: string; body: string; rating?: number }>;
  testimonialIndex: number;
  setTestimonialIndex: React.Dispatch<React.SetStateAction<number>>;
  subscribe: (event: React.FormEvent<HTMLFormElement>) => void;
  getHpContent: (type: string) => Record<string, unknown>;
  blogPosts: BlogPostItem[];
  // header + footer brand chrome
  logoUrl: string;
  logoFailed: boolean;
  logoHeight: string;
  logoMaxWidth: string;
  logoRetryCount: number;
  setLogoRetryCount: React.Dispatch<React.SetStateAction<number>>;
  setLogoFailed: React.Dispatch<React.SetStateAction<boolean>>;
  menu: boolean;
  setMenu: (v: boolean) => void;
  headerNav: Array<{ label: string; href: string; visible: boolean; sort: number }>;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  startVoiceSearch: boolean;
  setStartVoiceSearch: (v: boolean) => void;
  setNotice: (v: string) => void;
  cartCount: number;
  user: { name?: string; email?: string; role?: string } | null;
  footerSettings: { tagline?: string; newsletterTitle?: string; copyright?: string; bg?: string; textColor?: string };
  footerLinks: Array<{ section: string; links: Array<{ label: string; href: string; visible: boolean; sort: number }> }>;
  socialLinks: Array<{ id: string; platform: string; label: string; url: string; iconSize?: number; desktopIconSize?: number; mobileIconSize?: number; customIconUrl?: string; openNewTab?: boolean; visible?: boolean; sortOrder?: number }>;
};
