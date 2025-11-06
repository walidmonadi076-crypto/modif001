import { useState, useEffect, useCallback, useMemo } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import type { Game, BlogPost, Product, SocialLink, Ad } from '../types';
import AdminDashboard from '../components/AdminDashboard';
import { paginate } from '../lib/pagination';
import AdminForm from '../components/AdminForm';
import ToastContainer from '../components/ToastContainer';
import type { ToastData, ToastType } from '../components/Toast';


// Fonction `getCookie` encore plus robuste pour lire les cookies de manière fiable
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) {
    return match[2];
  }
  return null;
}

const AD_PLACEMENTS = ['game_vertical', 'game_horizontal', 'shop_square', 'blog_skyscraper_left', 'blog_skyscraper_right'];

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [activeTab, setActiveTab] = useState<'games' | 'blogs' | 'products' | 'social-links' | 'ads'>('games');
  const [games, setGames] = useState<Game[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [ads, setAds] = useState<Record<string, string>>({});
  
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  // Déplacement des useMemo en haut pour respecter les règles de React
  const currentData = useMemo(() =>
    activeTab === 'games' ? games :
    activeTab === 'blogs' ? blogs :
    activeTab === 'products' ? products :
    activeTab === 'social-links' ? socialLinks :
    [], [activeTab, games, blogs, products, socialLinks]);

  const filteredData = useMemo(() => currentData.filter((item: any) => {
    const query = searchQuery.toLowerCase();
    return (
      (item.title && item.title.toLowerCase().includes(query)) ||
      (item.name && item.name.toLowerCase().includes(query)) ||
      (item.category && item.category.toLowerCase().includes(query)) ||
      (item.author && item.author.toLowerCase().includes(query)) ||
      (item.url && item.url.toLowerCase().includes(query))
    );
  }), [currentData, searchQuery]);

  const paginationData = useMemo(() => paginate(filteredData, currentPage, itemsPerPage), [filteredData, currentPage, itemsPerPage]);


  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout');
    setIsAuthenticated(false);
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [gamesRes, blogsRes, productsRes, socialLinksRes, adsRes] = await Promise.all([
        fetch('/api/games'),
        fetch('/api/blogs'),
        fetch('/api/products'),
        fetch('/api/admin/social-links'),
        fetch('/api/admin/ads'),
      ]);
      
      if (!gamesRes.ok || !blogsRes.ok || !productsRes.ok || !socialLinksRes.ok || !adsRes.ok) {
        throw new Error('Failed to fetch initial data');
      }

      const [gamesData, blogsData, productsData, socialLinksData, adsData] = await Promise.all([
        gamesRes.json(),
        blogsRes.json(),
        productsRes.json(),
        socialLinksRes.json(),
        adsRes.json(),
      ]);

      setGames(gamesData);
      setBlogs(blogsData);
      setProducts(productsData);
      setSocialLinks(socialLinksData);
      
      const adsObject = adsData.reduce((acc: Record<string, string>, ad: Ad) => {
        acc[ad.placement] = ad.code || '';
        return acc;
      }, {});
      setAds(adsObject);

    } catch (error) {
      console.error('Error fetching all data:', error);
      addToast('Erreur lors du chargement des données.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);
  
  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/check');
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
    } catch (error) {
      setIsAuthenticated(false);
    }
    setCheckingAuth(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated, fetchAllData]);

  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
  }, [activeTab]);

  // Déconnexion automatique pour inactivité
  useEffect(() => {
    let logoutTimer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(logoutTimer);
      logoutTimer = setTimeout(() => {
        addToast("Vous avez été déconnecté pour inactivité.", 'error');
        handleLogout();
      }, 10 * 60 * 1000); // 10 minutes
    };

    const handleActivity = () => {
      resetTimer();
    };

    if (isAuthenticated) {
      const activityEvents = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
      activityEvents.forEach(event => window.addEventListener(event, handleActivity));
      resetTimer();

      return () => {
        clearTimeout(logoutTimer);
        activityEvents.forEach(event => window.removeEventListener(event, handleActivity));
      };
    }
  }, [isAuthenticated, handleLogout, addToast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setPassword('');
      } else {
        setLoginError(data.message || 'Mot de passe incorrect');
      }
    } catch (error) {
      setLoginError('Erreur de connexion');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément?')) return;

    const csrfToken = getCookie('csrf_token');
    if (!csrfToken) {
        addToast('Erreur de session. Veuillez vous reconnecter.', 'error');
        return;
    }

    try {
      const res = await fetch(`/api/admin/${activeTab}?id=${id}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrfToken },
      });
      if (res.ok) {
        addToast('Élément supprimé avec succès!', 'success');
        if (activeTab === 'games') setGames(prev => prev.filter(item => item.id !== id));
        else if (activeTab === 'blogs') setBlogs(prev => prev.filter(item => item.id !== id));
        else if (activeTab === 'products') setProducts(prev => prev.filter(item => item.id !== id));
        else if (activeTab === 'social-links') setSocialLinks(prev => prev.filter(item => item.id !== id));
      } else {
        const error = await res.json();
        addToast(`Erreur: ${error.error || error.message || 'La suppression a échoué'}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      addToast('Erreur lors de la suppression', 'error');
    }
  };

  const handleSubmit = async (formData: any) => {
    const csrfToken = getCookie('csrf_token');
    if (!csrfToken) {
        addToast('Erreur de session. Veuillez vous reconnecter.', 'error');
        return;
    }

    try {
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(`/api/admin/${activeTab}`, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken 
        },
        body: JSON.stringify(formData),
      });
    

      if (res.ok) {
        const savedItem = await res.json();
        addToast(editingItem ? 'Élément modifié avec succès!' : 'Élément créé avec succès!', 'success');
        setShowForm(false);
        setEditingItem(null);
        
        if (activeTab === 'games') {
          setGames(prev => editingItem ? prev.map(g => g.id === savedItem.id ? savedItem : g) : [savedItem, ...prev]);
        } else if (activeTab === 'blogs') {
          setBlogs(prev => editingItem ? prev.map(b => b.id === savedItem.id ? savedItem : b) : [savedItem, ...prev]);
        } else if (activeTab === 'products') {
          setProducts(prev => editingItem ? prev.map(p => p.id === savedItem.id ? savedItem : p) : [savedItem, ...prev]);
        } else if (activeTab === 'social-links') {
          setSocialLinks(prev => editingItem ? prev.map(sl => sl.id === savedItem.id ? savedItem : sl) : [savedItem, ...prev]);
        }

      } else {
        const error = await res.json();
        addToast(`Erreur: ${error.error || error.message || 'La sauvegarde a échoué'}`, 'error');
      }
    } catch (error) {
      console.error('Error saving:', error);
      addToast('Erreur lors de la sauvegarde', 'error');
    }
  };
  
  const handleSaveAds = async () => {
    const csrfToken = getCookie('csrf_token');
    if (!csrfToken) {
        addToast('Erreur de session. Veuillez vous reconnecter.', 'error');
        return;
    }
    
    try {
      const res = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify(ads)
      });
      
      if(res.ok) {
        addToast('Publicités sauvegardées avec succès!', 'success');
      } else {
        const error = await res.json();
        addToast(`Erreur: ${error.error || 'La sauvegarde a échoué'}`, 'error');
      }
    } catch (error) {
      addToast('Erreur lors de la sauvegarde des publicités.', 'error');
    }
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setShowForm(true);
  };
  
  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowForm(true);
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div>Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Head>
          <title>Connexion Admin</title>
        </Head>
        <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center">Panneau d'Administration</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block mb-2">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
                placeholder="Entrez le mot de passe admin"
                required
              />
            </div>
            {loginError && (
              <div className="bg-red-600 bg-opacity-20 border border-red-600 text-red-400 px-4 py-2 rounded">
                {loginError}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded font-semibold transition-colors"
            >
              Se connecter
            </button>
          </form>
        </div>
      </div>
    );
  }
  
  const renderAdsTab = () => (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      {AD_PLACEMENTS.map(placement => (
        <div key={placement}>
          <label htmlFor={`ad-${placement}`} className="block text-lg font-semibold text-gray-200 mb-2 capitalize">
            {placement.replace(/_/g, ' ')}
          </label>
          <textarea
            id={`ad-${placement}`}
            value={ads[placement] || ''}
            onChange={(e) => setAds(prev => ({...prev, [placement]: e.target.value}))}
            rows={6}
            className="w-full px-3 py-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
            placeholder={`Collez ici le code <script> pour l'emplacement ${placement}`}
          />
        </div>
      ))}
      <div className="flex justify-end">
        <button onClick={handleSaveAds} className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded font-semibold">
          Sauvegarder les publicités
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>Panneau d'Administration</title>
      </Head>
      
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {showForm && (
        <AdminForm 
            item={editingItem}
            type={activeTab as any}
            onClose={() => { setShowForm(false); setEditingItem(null); }}
            onSubmit={handleSubmit}
        />
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Panneau d'Administration</h1>
          <div className="flex gap-4">
            <a href="/" className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded">
              Retour au Site
            </a>
            <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">
              Déconnexion
            </button>
          </div>
        </div>

        <AdminDashboard games={games} blogs={blogs} products={products} />

        <div className="flex gap-4 mb-6 flex-wrap">
          {['games', 'blogs', 'products', 'social-links', 'ads'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 rounded-lg font-semibold capitalize ${
                activeTab === tab ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {
                {
                  'games': `Jeux (${games.length})`,
                  'blogs': `Blogs (${blogs.length})`,
                  'products': `Produits (${products.length})`,
                  'social-links': `Réseaux (${socialLinks.length})`,
                  'ads': 'Publicités'
                }[tab]
              }
            </button>
          ))}
        </div>
        
        {activeTab === 'ads' ? renderAdsTab() : (
          <>
            <div className="flex justify-between items-center mb-4">
              <input
                type="text"
                placeholder={`Rechercher dans ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 bg-gray-700 rounded w-full md:w-1/2 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <button onClick={handleAddNew} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold capitalize">
                Ajouter {activeTab.slice(0, -1)}
              </button>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              {loading ? (
                <div className="text-center py-10">Chargement...</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left p-3">ID</th>
                          <th className="text-left p-3">{activeTab === 'products' || activeTab === 'social-links' ? 'Nom' : 'Titre'}</th>
                          <th className="text-left p-3">{activeTab === 'social-links' ? 'URL' : 'Catégorie'}</th>
                          <th className="text-left p-3">{activeTab === 'social-links' ? 'Icône' : 'Image'}</th>
                          <th className="text-right p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginationData.items.map((item: any) => (
                          <tr key={item.id} className="border-b border-gray-700 hover:bg-gray-750">
                            <td className="p-3">{item.id}</td>
                            <td className="p-3">{item.title || item.name}</td>
                            <td className="p-3">{activeTab === 'social-links' ? item.url : item.category}</td>
                            <td className="p-3">
                              {activeTab === 'social-links' ? (
                                <span className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded text-white" dangerouslySetInnerHTML={{ __html: item.icon_svg }} />
                              ) : (
                                <Image
                                  src={item.imageUrl}
                                  alt={item.title || item.name}
                                  width={64}
                                  height={64}
                                  className="object-cover rounded"
                                />
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <button onClick={() => handleEdit(item)} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded mr-2">Modifier</button>
                              <button onClick={() => handleDelete(item.id)} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded">Supprimer</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {paginationData.totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-6">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={!paginationData.hasPreviousPage}
                        className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-600"
                      >
                        Précédent
                      </button>
                      <span className="text-gray-300">
                        Page {currentPage} sur {paginationData.totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(paginationData.totalPages, prev + 1))}
                        disabled={!paginationData.hasNextPage}
                        className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-600"
                      >
                        Suivant
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}