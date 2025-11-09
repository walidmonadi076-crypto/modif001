import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import type { Game, BlogPost, Product, SocialLink, Ad, Comment, SiteSettings } from '../../types';
import AdminDashboard from '../../components/AdminDashboard';
import AdminForm from '../../components/AdminForm';
import ToastContainer from '../../components/ToastContainer';
import type { ToastData, ToastType } from '../../components/Toast';
import { useDebounce } from '../../hooks/useDebounce';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

type FormItem = Game | BlogPost | Product | SocialLink;
type FormItemType = 'games' | 'blogs' | 'products' | 'social-links';

const AD_PLACEMENTS = ['game_vertical', 'game_horizontal', 'shop_square', 'blog_skyscraper_left', 'blog_skyscraper_right'];

type TabType = 'games' | 'blogs' | 'products' | 'social-links' | 'comments' | 'ads' | 'settings';

type Item = Game | BlogPost | Product | SocialLink | Comment;

interface PaginationState {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
}

interface AdminStats {
  totalGames: number;
  totalBlogs: number;
  totalProducts: number;
  gameCategories: number;
  blogCategories: number;
  productCategories: number;
  totalSocialLinks: number;
  totalComments: number;
  totalAds: number;
}

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('games');
  
  const [items, setItems] = useState<Item[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [ads, setAds] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState<Partial<SiteSettings>>({});
  
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationState>({ totalItems: 0, totalPages: 1, currentPage: 1, itemsPerPage: 20 });
  
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });

  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout');
    setIsAuthenticated(false);
  }, []);

  const fetchDataForTab = useCallback(async (tab: TabType, page: number, search: string, sortKey: string, sortDir: string) => {
      if (['ads', 'settings'].includes(tab)) return;
      setLoading(true);
      try {
        const url = `/api/admin/${tab}?page=${page}&search=${encodeURIComponent(search)}&limit=${pagination.itemsPerPage}&sortBy=${sortKey}&sortOrder=${sortDir}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch data');
        const data = await res.json();
        setItems(data.items);
        setPagination(data.pagination);
      } catch (error) {
        console.error(`Error fetching ${tab}:`, error);
        addToast(`Erreur lors du chargement de ${tab}.`, 'error');
      } finally {
        setLoading(false);
      }
  }, [addToast, pagination.itemsPerPage]);
  
  const fetchInitialAdminData = useCallback(async () => {
      try {
        const [statsRes, adsRes, settingsRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/ads'),
          fetch('/api/admin/settings'),
        ]);

        if (!statsRes.ok || !adsRes.ok || !settingsRes.ok) throw new Error('Failed to fetch initial admin data');

        const [statsData, adsData, settingsData] = await Promise.all([statsRes.json(), adsRes.json(), settingsRes.json()]);
        
        setStats(statsData);
        const adsObject = adsData.reduce((acc: Record<string, string>, ad: Ad) => ({ ...acc, [ad.placement]: ad.code || '' }), {});
        setAds(adsObject);
        setSettings(settingsData);
      } catch (error) {
        console.error('Error fetching initial admin data:', error);
        addToast('Erreur de chargement des données initiales.', 'error');
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
    if (isAuthenticated) {
        setLoading(true);
        fetchInitialAdminData().finally(() => setLoading(false));
    }
  }, [isAuthenticated, fetchInitialAdminData]);
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchDataForTab(activeTab, currentPage, debouncedSearchQuery, sortConfig.key, sortConfig.direction);
    }
  }, [isAuthenticated, activeTab, currentPage, debouncedSearchQuery, sortConfig, fetchDataForTab]);

  useEffect(() => {
      setCurrentPage(1);
  }, [activeTab, debouncedSearchQuery, sortConfig]);

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

  const refreshCurrentTab = useCallback(() => {
    fetchDataForTab(activeTab, currentPage, debouncedSearchQuery, sortConfig.key, sortConfig.direction);
    fetchInitialAdminData();
  }, [activeTab, currentPage, debouncedSearchQuery, sortConfig, fetchDataForTab, fetchInitialAdminData]);

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément?')) return;
    const csrfToken = getCookie('csrf_token');
    if (!csrfToken) return addToast('Erreur de session. Veuillez vous reconnecter.', 'error');
    try {
      const res = await fetch(`/api/admin/${activeTab}?id=${id}`, { method: 'DELETE', headers: { 'X-CSRF-Token': csrfToken } });
      if (res.ok) {
        addToast('Élément supprimé avec succès!', 'success');
        refreshCurrentTab();
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
            refreshCurrentTab();
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
        refreshCurrentTab();
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
        body: JSON.stringify(settings)
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

  const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    // @ts-ignore
    setSettings(prev => ({ ...prev, [name]: isCheckbox ? e.target.checked : value }));
  };
  
  const requestSort = (key: string) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  if (checkingAuth) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Chargement...</div>;
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

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'games', label: 'Games', count: stats?.totalGames },
    { id: 'blogs', label: 'Blogs', count: stats?.totalBlogs },
    { id: 'products', label: 'Products', count: stats?.totalProducts },
    { id: 'social-links', label: 'Social-Links', count: stats?.totalSocialLinks },
    { id: 'comments', label: 'Comments', count: stats?.totalComments },
    { id: 'ads', label: 'Ads', count: stats?.totalAds },
    { id: 'settings', label: 'Personnalisation' }
  ];
  
  const SortableHeader: React.FC<{ label: string; columnKey: string; className?: string }> = ({ label, columnKey, className }) => {
    const isSorted = sortConfig.key === columnKey;
    const sortIcon = isSorted ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '';
    return (
      <th onClick={() => requestSort(columnKey)} className={`text-left p-3 text-sm font-semibold uppercase cursor-pointer ${className}`}>
        {label} <span className="text-purple-400 text-xs">{sortIcon}</span>
      </th>
    );
  };

  const renderSettingInput = (name: keyof SiteSettings, label: string, type: 'text' | 'url' | 'textarea' = 'text', rows?: number) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        {type === 'textarea' ? (
            <textarea id={name} name={name} value={settings[name] as string || ''} onChange={handleSettingChange} rows={rows || 3} className="w-full px-3 py-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500" />
        ) : (
            <input id={name} name={name} type={type} value={settings[name] as string || ''} onChange={handleSettingChange} className="w-full px-3 py-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500" />
        )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
        <Head><title>Admin Panel - G2gaming</title></Head>
        <ToastContainer toasts={toasts} onClose={removeToast} />
        {showForm && activeTab !== 'comments' && <AdminForm item={editingItem as FormItem | null} type={activeTab as FormItemType} onClose={() => setShowForm(false)} onSubmit={handleSubmit} />}

        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <h1 className="text-3xl font-bold">Admin Panel</h1>
                <div className="flex gap-4">
                    <a href="/" target="_blank" rel="noopener noreferrer" className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md font-semibold transition-colors">Voir le Site</a>
                    <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md font-semibold transition-colors">Déconnexion</button>
                </div>
            </div>
            <AdminDashboard stats={stats} />
            
            <div className="flex gap-4 mb-6 flex-wrap">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 rounded-lg font-semibold capitalize transition-colors ${activeTab === tab.id ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
                  {tab.label.replace('-', ' ')} {stats && typeof tab.count !== 'undefined' ? `(${tab.count})` : ''}
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
              <div className="bg-gray-800 rounded-lg p-6 space-y-8">
                <section>
                    <h3 className="text-xl font-bold border-b border-gray-700 pb-2 mb-4">Paramètres Généraux</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderSettingInput('site_name', 'Nom du Site')}
                        {renderSettingInput('site_icon_url', 'URL du Favicon', 'url')}
                    </div>
                </section>
                 <section>
                    <h3 className="text-xl font-bold border-b border-gray-700 pb-2 mb-4">Bannière d'Accueil (Hero)</h3>
                    <div className="space-y-4">
                        {renderSettingInput('hero_title', 'Titre (HTML autorisé)', 'textarea')}
                        {renderSettingInput('hero_subtitle', 'Sous-titre')}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {renderSettingInput('hero_button_text', 'Texte du bouton')}
                            {renderSettingInput('hero_button_url', 'URL du bouton')}
                        </div>
                        {renderSettingInput('hero_bg_url', 'URL de l\'image de fond', 'url')}
                    </div>
                </section>
                <section>
                    <h3 className="text-xl font-bold border-b border-gray-700 pb-2 mb-4">Bannière Promotionnelle</h3>
                    <div className="flex items-center gap-4 mb-4">
                        <input type="checkbox" id="promo_enabled" name="promo_enabled" checked={!!settings.promo_enabled} onChange={handleSettingChange} className="h-5 w-5 bg-gray-700 rounded border-gray-600 text-purple-600 focus:ring-purple-500" />
                        <label htmlFor="promo_enabled" className="text-lg font-medium text-gray-200">Activer la bannière promotionnelle</label>
                    </div>
                    {settings.promo_enabled && (
                        <div className="space-y-4">
                            {renderSettingInput('promo_text', 'Texte de la promo')}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {renderSettingInput('promo_button_text', 'Texte du bouton promo')}
                                {renderSettingInput('promo_button_url', 'URL du bouton promo')}
                            </div>
                        </div>
                    )}
                </section>
                <section>
                    <h3 className="text-xl font-bold border-b border-gray-700 pb-2 mb-4">Script OGAds</h3>
                    {renderSettingInput('ogads_script_src', 'Script OGAds', 'textarea', 4)}
                    <p className="text-xs text-gray-400 mt-2">Collez ici le code `&lt;script&gt;` complet fourni par OGAds.</p>
                </section>

                <div className="flex justify-end"><button onClick={handleSaveSettings} className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-md font-semibold transition-colors">Sauvegarder les Paramètres</button></div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                  <input type="text" placeholder={`Rechercher dans ${activeTab}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="px-4 py-2 bg-gray-700 rounded-md w-full md:w-1/2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  {activeTab !== 'comments' && <button onClick={() => { setEditingItem(null); setShowForm(true); }} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md font-semibold capitalize transition-colors">Ajouter {activeTab.slice(0, -1)}</button>}
                </div>

                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  {loading ? <div className="text-center py-10">Chargement...</div> : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          {activeTab === 'comments' ? (
                            <>
                            <thead><tr className="border-b border-gray-700 bg-gray-700/50">
                                <SortableHeader label="Auteur" columnKey="author" />
                                <th className="text-left p-3 text-sm font-semibold uppercase">Commentaire</th>
                                <SortableHeader label="Article" columnKey="blog_title" />
                                <SortableHeader label="Status" columnKey="status" />
                                <th className="text-right p-3 text-sm font-semibold uppercase">Actions</th>
                            </tr></thead>
                            <tbody>
                              {(items as Comment[]).map((comment) => (
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
                            </>
                          ) : (
                            <>
                            <thead><tr className="border-b border-gray-700 bg-gray-700/50">
                                <SortableHeader label="ID" columnKey="id" />
                                <SortableHeader label="Titre/Nom" columnKey={['products', 'social-links'].includes(activeTab) ? 'name' : 'title'} />
                                <SortableHeader label="Catégorie/URL" columnKey={activeTab === 'social-links' ? 'url' : 'category'} />
                                <th className="text-left p-3 text-sm font-semibold uppercase">Image/Icône</th>
                                <th className="text-right p-3 text-sm font-semibold uppercase">Actions</th>
                            </tr></thead>
                            <tbody>
                            {items.map((item: any) => (
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
                            </>
                          )}
                        </table>
                      </div>
                      {pagination.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 p-4 border-t border-gray-700">
                          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="px-4 py-2 bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Précédent</button>
                          <span className="text-sm font-medium text-gray-400">Page {currentPage} sur {pagination.totalPages}</span>
                          <button onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))} disabled={currentPage >= pagination.totalPages} className="px-4 py-2 bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Suivant</button>
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