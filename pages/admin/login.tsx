import { useState, useEffect, useCallback, useMemo } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import type { Game, BlogPost, Product, SocialLink, Ad, Comment } from '../../types';
import AdminDashboard from '../../components/AdminDashboard';
import { paginate } from '../../lib/pagination';
import AdminForm from '../../components/AdminForm';
import ToastContainer from '../../components/ToastContainer';
import type { ToastData, ToastType } from '../../components/Toast';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

const AD_PLACEMENTS = ['game_vertical', 'game_horizontal', 'shop_square', 'blog_skyscraper_left', 'blog_skyscraper_right'];

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<'games' | 'blogs' | 'products' | 'social-links' | 'comments' | 'ads' | 'settings'>('games');
  
  const [games, setGames] = useState<Game[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [ads, setAds] = useState<Record<string, string>>({});
  const [ogadsScript, setOgadsScript] = useState('');
  
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

  const currentData = useMemo(() => {
    switch (activeTab) {
      case 'games': return games;
      case 'blogs': return blogs;
      case 'products': return products;
      case 'social-links': return socialLinks;
      case 'comments': return comments;
      default: return [];
    }
  }, [activeTab, games, blogs, products, socialLinks, comments]);

  const filteredData = useMemo(() => currentData.filter((item: any) => {
    const query = searchQuery.toLowerCase();
    return (item.title && item.title.toLowerCase().includes(query)) ||
           (item.name && item.name.toLowerCase().includes(query)) ||
           (item.author && item.author.toLowerCase().includes(query)) ||
           (item.text && item.text.toLowerCase().includes(query));
  }), [currentData, searchQuery]);

  const paginationData = useMemo(() => paginate(filteredData, currentPage, itemsPerPage), [filteredData, currentPage, itemsPerPage]);

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout');
    setIsAuthenticated(false);
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [gamesRes, blogsRes, productsRes, socialLinksRes, commentsRes, adsRes, settingsRes] = await Promise.all([
        fetch('/api/admin/games'),
        fetch('/api/admin/blogs'),
        fetch('/api/admin/products'),
        fetch('/api/admin/social-links'),
        fetch('/api/admin/comments'),
        fetch('/api/admin/ads'),
        fetch('/api/admin/settings'),
      ]);
      
      const responses = [gamesRes, blogsRes, productsRes, socialLinksRes, commentsRes, adsRes, settingsRes];
      if (responses.some(res => !res.ok)) throw new Error('Failed to fetch initial data');

      const [gamesData, blogsData, productsData, socialLinksData, commentsData, adsData, settingsData] = await Promise.all(responses.map(res => res.json()));

      setGames(gamesData);
      setBlogs(blogsData);
      setProducts(productsData);
      setSocialLinks(socialLinksData);
      setComments(commentsData);

      const adsObject = adsData.reduce((acc: Record<string, string>, ad: Ad) => ({ ...acc, [ad.placement]: ad.code || '' }), {});
      setAds(adsObject);
      setOgadsScript(settingsData.ogads_script_src || '');
    } catch (error) {
      console.error('Error fetching data:', error);
      addToast('Erreur lors du chargement des données.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
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
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchAllData();
  }, [isAuthenticated, fetchAllData]);
  
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
    if (!csrfToken) return addToast('Erreur de session. Veuillez vous reconnecter.', 'error');
    try {
      const res = await fetch(`/api/admin/${activeTab}?id=${id}`, { method: 'DELETE', headers: { 'X-CSRF-Token': csrfToken } });
      if (res.ok) {
        addToast('Élément supprimé avec succès!', 'success');
        fetchAllData();
      } else {
        const error = await res.json();
        addToast(`Erreur: ${error.error || 'La suppression a échoué'}`, 'error');
      }
    } catch (error) {
      addToast('Erreur lors de la suppression', 'error');
    }
  };

  const handleApproveComment = async (id: number) => {
    const csrfToken = getCookie('csrf_token');
    if (!csrfToken) return addToast('Erreur de session.', 'error');
    try {
        const res = await fetch('/api/admin/comments', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
            body: JSON.stringify({ id })
        });
        if (res.ok) {
            addToast('Commentaire approuvé!', 'success');
            fetchAllData();
        } else {
            const error = await res.json();
            addToast(`Erreur: ${error.message || 'L\'approbation a échoué'}`, 'error');
        }
    } catch (error) {
        addToast('Erreur lors de l\'approbation.', 'error');
    }
  };


  const handleSubmit = async (formData: any) => {
    const csrfToken = getCookie('csrf_token');
    if (!csrfToken) return addToast('Erreur de session. Veuillez vous reconnecter.', 'error');
    try {
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(`/api/admin/${activeTab}`, {
        method,
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        addToast(editingItem ? 'Élément modifié avec succès!' : 'Élément créé avec succès!', 'success');
        setShowForm(false);
        setEditingItem(null);
        fetchAllData();
      } else {
        const error = await res.json();
        addToast(`Erreur: ${error.error || 'La sauvegarde a échoué'}`, 'error');
      }
    } catch (error) {
      addToast('Erreur lors de la sauvegarde', 'error');
    }
  };
  
  const handleSaveAds = async () => {
    const csrfToken = getCookie('csrf_token');
    if (!csrfToken) return addToast('Erreur de session.', 'error');
    try {
      const res = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify(ads)
      });
      if (res.ok) addToast('Publicités sauvegardées!', 'success');
      else {
        const error = await res.json();
        addToast(`Erreur: ${error.error || 'La sauvegarde a échoué'}`, 'error');
      }
    } catch (error) {
      addToast('Erreur lors de la sauvegarde.', 'error');
    }
  };

  const handleSaveSettings = async () => {
    const csrfToken = getCookie('csrf_token');
    if (!csrfToken) return addToast('Erreur de session.', 'error');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ ogads_script_src: ogadsScript })
      });
      if (res.ok) {
        addToast('Paramètres sauvegardés!', 'success');
      } else {
        const error = await res.json();
        addToast(`Erreur: ${error.error || 'La sauvegarde a échoué'}`, 'error');
      }
    } catch (error) {
      addToast('Erreur lors de la sauvegarde des paramètres.', 'error');
    }
  };
  
  if (checkingAuth) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center">Chargement...</div>;
  }
  
  if (!isAuthenticated) {
     return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <Head><title>Admin Login - G2gaming</title></Head>
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-sm w-full">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Panel</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password-input" className="block mb-2 text-sm font-medium text-gray-300">Password</label>
              <input id="password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-600" required />
            </div>
            {loginError && <div className="bg-red-600 bg-opacity-20 border border-red-600 text-red-400 px-4 py-2 rounded text-sm">{loginError}</div>}
            <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-md font-semibold transition-colors">Log in</button>
          </form>
        </div>
      </div>
    );
  }

  // Le reste du panneau d'administration
  return (
    <div className="min-h-screen bg-gray-900 text-white">
        <Head><title>Admin Panel - G2gaming</title></Head>
        <ToastContainer toasts={toasts} onClose={removeToast} />
        {showForm && activeTab !== 'comments' && <AdminForm item={editingItem} type={activeTab as any} onClose={() => setShowForm(false)} onSubmit={handleSubmit} />}

        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <h1 className="text-3xl font-bold">Admin Panel</h1>
                <div className="flex gap-4">
                    <a href="/" target="_blank" rel="noopener noreferrer" className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md font-semibold transition-colors">Voir le Site</a>
                    <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md font-semibold transition-colors">Déconnexion</button>
                </div>
            </div>
            <AdminDashboard games={games} blogs={blogs} products={products} />
            
            <div className="flex gap-4 mb-6 flex-wrap">
              {['games', 'blogs', 'products', 'social-links', 'comments', 'ads', 'settings'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-3 rounded-lg font-semibold capitalize transition-colors ${activeTab === tab ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
                  {{ 'games': `Jeux (${games.length})`, 'blogs': `Blogs (${blogs.length})`, 'products': `Produits (${products.length})`, 'social-links': `Réseaux (${socialLinks.length})`, 'comments': `Commentaires (${comments.length})`, 'ads': 'Publicités', 'settings': 'Paramètres' }[tab]}
                </button>
              ))}
            </div>

            {activeTab === 'ads' ? (
              <div className="bg-gray-800 rounded-lg p-6 space-y-6">
                {AD_PLACEMENTS.map(placement => (
                  <div key={placement}><label htmlFor={`ad-${placement}`} className="block text-lg font-semibold text-gray-200 mb-2 capitalize">{placement.replace(/_/g, ' ')}</label><textarea id={`ad-${placement}`} value={ads[placement] || ''} onChange={(e) => setAds(prev => ({...prev, [placement]: e.target.value}))} rows={6} className="w-full px-3 py-2 bg-gray-700 rounded-md border border-gray-600 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" /></div>
                ))}
                <div className="flex justify-end"><button onClick={handleSaveAds} className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-md font-semibold transition-colors">Sauvegarder les Publicités</button></div>
              </div>
            ) : activeTab === 'settings' ? (
              <div className="bg-gray-800 rounded-lg p-6 space-y-6">
                <div>
                  <label htmlFor="ogads-script" className="block text-lg font-semibold text-gray-200 mb-2">Script OGAds</label>
                  <textarea
                    id="ogads-script"
                    value={ogadsScript}
                    onChange={(e) => setOgadsScript(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-700 rounded-md border border-gray-600 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder='<script type="text/javascript" id="ogjs" src="..."></script>'
                  />
                  <p className="text-xs text-gray-400 mt-2">Collez ici le code `&lt;script&gt;` complet fourni par OGAds. Le système le sauvegardera tel quel.</p>
                </div>
                <div className="flex justify-end"><button onClick={handleSaveSettings} className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-md font-semibold transition-colors">Sauvegarder les Paramètres</button></div>
              </div>
            ) : activeTab === 'comments' ? (
                 <div className="bg-gray-800 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr className="border-b border-gray-700 bg-gray-700/50"><th className="text-left p-3 text-sm font-semibold uppercase">Auteur</th><th className="text-left p-3 text-sm font-semibold uppercase">Commentaire</th><th className="text-left p-3 text-sm font-semibold uppercase">Article</th><th className="text-left p-3 text-sm font-semibold uppercase">Status</th><th className="text-right p-3 text-sm font-semibold uppercase">Actions</th></tr></thead>
                      <tbody>
                        {paginationData.items.map((comment: Comment) => (
                          <tr key={comment.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                            <td className="p-3 font-medium">{comment.author}<br/><span className="text-xs text-gray-400">{comment.email}</span></td>
                            <td className="p-3 text-sm text-gray-300 max-w-sm truncate">{comment.text}</td>
                            <td className="p-3 text-sm text-gray-400 truncate max-w-xs">{comment.blog_title}</td>
                            <td className="p-3 text-sm"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${comment.status === 'approved' ? 'bg-green-600/30 text-green-300' : 'bg-yellow-600/30 text-yellow-300'}`}>{comment.status}</span></td>
                            <td className="p-3 text-right">
                              {comment.status === 'pending' && <button onClick={() => handleApproveComment(comment.id)} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm font-semibold mr-2 transition-colors">Approuver</button>}
                              <button onClick={() => handleDelete(comment.id)} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm font-semibold transition-colors">Supprimer</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                  <input type="text" placeholder={`Rechercher dans ${activeTab}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="px-4 py-2 bg-gray-700 rounded-md w-full md:w-1/2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  <button onClick={() => { setEditingItem(null); setShowForm(true); }} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md font-semibold capitalize transition-colors">Ajouter {activeTab.slice(0, -1)}</button>
                </div>

                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  {loading ? <div className="text-center py-10">Chargement...</div> : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead><tr className="border-b border-gray-700 bg-gray-700/50"><th className="text-left p-3 text-sm font-semibold uppercase">ID</th><th className="text-left p-3 text-sm font-semibold uppercase">Titre/Nom</th><th className="text-left p-3 text-sm font-semibold uppercase">Catégorie/URL</th><th className="text-left p-3 text-sm font-semibold uppercase">Image/Icône</th><th className="text-right p-3 text-sm font-semibold uppercase">Actions</th></tr></thead>
                          <tbody>
                            {paginationData.items.map((item: any) => (
                              <tr key={item.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                                <td className="p-3 text-sm text-gray-400">{item.id}</td>
                                <td className="p-3 font-medium">{item.title || item.name}</td>
                                <td className="p-3 text-sm text-gray-400 truncate max-w-xs">{activeTab === 'social-links' ? item.url : item.category}</td>
                                <td className="p-3">
                                  {activeTab === 'social-links' ? <span className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded text-white" dangerouslySetInnerHTML={{ __html: item.icon_svg }} /> : <Image src={item.imageUrl} alt={item.title || item.name} width={64} height={40} className="object-cover rounded" />}
                                </td>
                                <td className="p-3 text-right"><button onClick={() => { setEditingItem(item); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm font-semibold mr-2 transition-colors">Modifier</button><button onClick={() => handleDelete(item.id)} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm font-semibold transition-colors">Supprimer</button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {paginationData.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 p-4 border-t border-gray-700">
                          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={!paginationData.hasPreviousPage} className="px-4 py-2 bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Précédent</button>
                          <span className="text-sm font-medium text-gray-400">Page {currentPage} sur {paginationData.totalPages}</span>
                          <button onClick={() => setCurrentPage(p => Math.min(paginationData.totalPages, p + 1))} disabled={!paginationData.hasNextPage} className="px-4 py-2 bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Suivant</button>
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