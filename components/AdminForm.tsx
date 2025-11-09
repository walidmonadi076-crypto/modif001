
import React, { useState, useEffect, Fragment } from 'react';
import type { Game, BlogPost, Product, SocialLink } from '../types';

type Item = Game | BlogPost | Product | SocialLink;
type ItemType = 'games' | 'blogs' | 'products' | 'social-links';


interface AdminFormProps {
  item: Item | null;
  type: ItemType;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export default function AdminForm({ item, type, onClose, onSubmit }: AdminFormProps) {
  const [formData, setFormData] = useState<any>({});
  const [isFeatured, setIsFeatured] = useState(false);
  
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [galleryInput, setGalleryInput] = useState('');

  useEffect(() => {
    if (type === 'games') {
      fetch('/api/meta/categories').then(res => res.json()).then(setCategories);
      fetch('/api/meta/tags').then(res => res.json()).then(setTags);
    }
  }, [type]);

  useEffect(() => {
    if (item) {
      setFormData({ gallery: [], tags: [], ...item });
      if ('tags' in item && Array.isArray(item.tags)) {
        setIsFeatured(item.tags.includes('Featured'));
      }
    } else {
      const defaults = {
        games: { title: '', imageUrl: '', category: '', tags: [], description: '', downloadUrl: '#', gallery: [] },
        blogs: { title: '', summary: '', imageUrl: '', author: '', rating: 4.5, content: '', category: '' },
        products: { name: '', imageUrl: '', price: '', url: '#', description: '', category: '', gallery: [] },
        'social-links': { name: '', url: '', icon_svg: '' },
      };
      setFormData(defaults[type]);
      setIsFeatured(false);
    }
  }, [item, type]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // @ts-ignore
    const isNumber = e.target.type === 'number';
    setFormData((prev: any) => ({ 
      ...prev, 
      [name]: isNumber ? parseFloat(value) : value 
    }));
  };
  
  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCurrentTag(e.target.value);
  }

  const addTag = (tagToAdd?: string) => {
    const tag = (tagToAdd || currentTag).trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev: any) => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setCurrentTag('');
  };
  
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData((prev: any) => ({
      ...prev,
      tags: prev.tags.filter((tag: string) => tag !== tagToRemove),
    }));
  };
  
  const addGalleryImage = () => {
    const url = galleryInput.trim();
    if (url && !formData.gallery?.includes(url)) {
      try {
        new URL(url); // Validate URL format
        setFormData((prev: any) => ({ ...prev, gallery: [...(prev.gallery || []), url] }));
        setGalleryInput('');
      } catch (e) {
        alert("Veuillez entrer une URL valide.");
      }
    }
  };

  const handleGalleryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addGalleryImage();
    }
  };

  const removeGalleryImage = (urlToRemove: string) => {
    setFormData((prev: any) => ({
      ...prev,
      gallery: prev.gallery.filter((url: string) => url !== urlToRemove),
    }));
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    let finalData = { ...formData };
    if (type === 'games') {
        let finalTags = finalData.tags || [];
        finalTags = finalTags.filter((t: string) => t !== 'Featured');
        if (isFeatured) {
            finalTags.push('Featured');
        }
        finalData.tags = finalTags;
    }
    onSubmit(finalData);
  };
  
  const renderField = (name: string, label: string, type: string = 'text', required: boolean = true) => {
      const isTextArea = type === 'textarea';
      const Component = isTextArea ? 'textarea' : 'input';

      return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
            <Component
                id={name}
                name={name}
                type={type}
                value={formData[name] || ''}
                onChange={handleChange}
                required={required}
                rows={isTextArea ? 5 : undefined}
                className="w-full px-3 py-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
        </div>
      );
  }

  const renderGalleryManager = () => (
    <div>
        <label htmlFor="gallery" className="block text-sm font-medium text-gray-300 mb-1">Galerie d'images (URLs)</label>
        <div className="flex gap-2">
            <input id="gallery" name="gallery" type="url" value={galleryInput} onChange={(e) => setGalleryInput(e.target.value)} onKeyDown={handleGalleryKeyDown} className="flex-grow px-3 py-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Coller une URL d'image et appuyez sur Entrée..."/>
            <button type="button" onClick={addGalleryImage} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold">Ajouter</button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 p-2 bg-gray-900 rounded-md min-h-[6.5rem]">
            {formData.gallery?.map((url: string, index: number) => (
                <div key={index} className="relative group">
                    <img src={url} alt={`Galerie ${index + 1}`} className="w-24 h-24 object-cover rounded-md" />
                    <button type="button" onClick={() => removeGalleryImage(url)} className="absolute top-0 right-0 m-1 w-6 h-6 bg-red-600/80 text-white rounded-full flex items-center justify-center text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Supprimer l'image">&times;</button>
                </div>
            ))}
        </div>
    </div>
  );
  
  const renderGameFields = () => (
    <>
      {renderField('title', 'Titre')}
      {renderField('imageUrl', 'URL de l\'image principale (Vignette)')}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">Catégorie</label>
        <input id="category" name="category" list="category-list" value={formData.category || ''} onChange={handleChange} required className="w-full px-3 py-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"/>
        <datalist id="category-list">{categories.map(cat => <option key={cat} value={cat} />)}</datalist>
      </div>
      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-1">Tags</label>
        <div className="flex flex-wrap gap-2 p-2 bg-gray-700 rounded-md border border-gray-600">
            {formData.tags?.filter((t:string) => t !== 'Featured').map((tag: string) => (<span key={tag} className="flex items-center bg-purple-600 text-white text-sm font-medium px-2 py-1 rounded-full">{tag}<button type="button" onClick={() => removeTag(tag)} className="ml-2 text-purple-200 hover:text-white">&times;</button></span>))}
            <input id="tags" name="tags" type="text" list="tag-list" value={currentTag} onChange={handleTagChange} onKeyDown={handleTagKeyDown} onBlur={() => addTag()} className="flex-grow bg-transparent focus:outline-none" placeholder="Ajouter un tag..."/>
            <datalist id="tag-list">{tags.filter(t => !formData.tags?.includes(t)).map(tag => <option key={tag} value={tag} />)}</datalist>
        </div>
      </div>
      <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 cursor-pointer"><input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="w-4 h-4 bg-gray-700 rounded border-gray-600 text-purple-600 focus:ring-purple-500"/>Featured</label>
      </div>
      {renderField('description', 'Description', 'textarea')}
      {renderField('downloadUrl', 'URL de Téléchargement', 'url')}
      {renderField('videoUrl', 'URL Vidéo (Optionnel)', 'url', false)}
      {renderGalleryManager()}
    </>
  );

  const renderBlogFields = () => (
    <>
      {renderField('title', 'Titre')}
      {renderField('summary', 'Résumé', 'textarea')}
      {renderField('imageUrl', 'URL de l\'image')}
      {renderField('author', 'Auteur')}
      {renderField('category', 'Catégorie')}
       <div>
        <label htmlFor="rating" className="block text-sm font-medium text-gray-300 mb-1">Note (sur 5)</label>
        <input id="rating" name="rating" type="number" value={formData.rating || ''} onChange={handleChange} step="0.1" min="0" max="5" required className="w-full px-3 py-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"/>
      </div>
      {renderField('content', 'Contenu', 'textarea')}
      {renderField('affiliateUrl', 'URL d\'affiliation', 'url', false)}
      {renderField('publishDate', 'Date de publication', 'date', false)}
    </>
  );

  const renderProductFields = () => (
    <>
      {renderField('name', 'Nom')}
      {renderField('price', 'Prix')}
      {renderField('imageUrl', 'URL de l\'image principale')}
      {renderField('url', 'URL du produit')}
      {renderField('category', 'Catégorie')}
      {renderField('description', 'Description', 'textarea')}
      {renderGalleryManager()}
    </>
  );

  const renderSocialLinkFields = () => (
    <>
      {renderField('name', 'Nom du réseau')}
      {renderField('url', 'URL (lien complet)')}
      <div>
        <label htmlFor="icon_svg" className="block text-sm font-medium text-gray-300 mb-1">Icône (code SVG)</label>
        <textarea id="icon_svg" name="icon_svg" value={formData.icon_svg || ''} onChange={handleChange} required rows={5} className="w-full px-3 py-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm" placeholder='<svg width="24" height="24" ...>...</svg>'/>
        <p className="text-xs text-gray-400 mt-1">Collez le code SVG complet de l'icône ici. Pour un affichage optimal, utilisez une icône de 24x24 pixels.</p>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold">{item ? 'Modifier' : 'Ajouter'} {type.slice(0, -1)}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
        </div>
        <form onSubmit={handleSubmitForm} className="p-6 space-y-4 overflow-y-auto">
            {type === 'games' && renderGameFields()}
            {type === 'blogs' && renderBlogFields()}
            {type === 'products' && renderProductFields()}
            {type === 'social-links' && renderSocialLinkFields()}
            
            <div className="pt-6 border-t border-gray-700 flex justify-end gap-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md">Sauvegarder</button>
            </div>
        </form>
      </div>
    </div>
  );
}
