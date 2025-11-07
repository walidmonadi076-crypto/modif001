import { useEffect, useState } from 'react';

// Nouvelle interface pour les statistiques, découplée des données complètes
interface AdminStats {
  totalGames: number;
  totalBlogs: number;
  totalProducts: number;
  gameCategories: number;
  blogCategories: number;
  productCategories: number;
}

interface AdminDashboardProps {
  stats: AdminStats | null; // Accepte un objet de stats ou null pendant le chargement
}

export default function AdminDashboard({ stats }: AdminDashboardProps) {
  if (!stats) {
    // Affiche des placeholders pendant le chargement des statistiques
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 animate-pulse">
            <div className="bg-gray-700 h-32 rounded-lg"></div>
            <div className="bg-gray-700 h-32 rounded-lg"></div>
            <div className="bg-gray-700 h-32 rounded-lg"></div>
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <StatCard
        title="Total des Jeux"
        value={stats.totalGames}
        subtitle={`${stats.gameCategories} catégories`}
        icon="🎮"
        color="purple"
      />
      <StatCard
        title="Total des Blogs"
        value={stats.totalBlogs}
        subtitle={`${stats.blogCategories} catégories`}
        icon="📝"
        color="blue"
      />
      <StatCard
        title="Total des Produits"
        value={stats.totalProducts}
        subtitle={`${stats.productCategories} catégories`}
        icon="🛒"
        color="green"
      />
    </div>
  );
}

type ColorType = 'purple' | 'blue' | 'green';

interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: string;
  color: ColorType;
}

function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
  const colorClasses: Record<ColorType, string> = {
    purple: 'from-purple-600 to-purple-800',
    blue: 'from-blue-600 to-blue-800',
    green: 'from-green-600 to-green-800',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-lg p-6 shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-200 text-sm font-medium mb-1">{title}</p>
          <p className="text-4xl font-bold text-white mb-1">{value}</p>
          <p className="text-gray-300 text-xs">{subtitle}</p>
        </div>
        <div className="text-5xl opacity-20">{icon}</div>
      </div>
    </div>
  );
}
