
import { useState, useEffect, Fragment } from 'react';
import type { Game, BlogPost, Product } from '../types';

type Item = Game | BlogPost | Product;

interface AdminFormProps {
  item: Item | null;
  type: 'games' | 'blogs' | 'products';
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export default function AdminForm({ item, type, onClose, onSubmit }: AdminFormProps) {
  const [formData, setFormData] = useState<any>({});
  const [isFeatured, setIsFeatured] = useState(false);
  
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');

  useEffect(() => {
    if (type === 'games') {
      fetch('/api/meta/categories').then(res => res.json()).then(setCategories);
      fetch('/api/meta/tags').then(res => res.json()).then(setTags);
    }
  }, [type]);

  useEffect(() => {
    if (item) {
      setFormData(item);
      if ('tags' in item && Array.isArray(item.tags)) {
        setIsFeatured(item.tags.includes('Featured'));
      }
    } else {
      // Default values for new items
      const defaults = {
        games: { title: '', imageUrl: '', category: '', tags: [], description: '', downloadUrl: '#', gallery: [] },
        blogs: { title: '', summary: '', imageUrl: '', author: '', rating: 4.5, content: '', category: '' },
        products: { name: '', imageUrl: '', price: '', url: '#', description: '', category: '', gallery: [] }
      };
      setFormData(defaults[type]);
      setIsFeatured(false);
    }
  }, [item, type]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
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
  
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    let finalData = { ...formData };
    if (type === 'games') {
        let finalTags = finalData.tags || [];
        // Ensure we don't duplicate the Featured tag if it was manually added
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
  
  const renderGameFields = () => (
    <>
      {renderField('title', 'Titre')}
      {renderField('imageUrl', 'URL de l\'image')}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">Catégorie</label>
        <input
          id="category"
          name="category"
          list="category-list"
          value={formData.category || ''}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <datalist id="category-list">
          {categories.map(cat => <option key={cat} value={cat} />)}
        </datalist>
      </div>
      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-1">Tags</label>
        <div className="flex flex-wrap gap-2 p-2 bg-gray-700 rounded-md border border-gray-600">
            {formData.tags?.filter((t:string) => t !== 'Featured').map((tag: string) => (
                <span key={tag} className="flex items-center bg-purple-600 text-white text-sm font-medium px-2 py-1 rounded-full">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="ml-2 text-purple-200 hover:text-white">&times;</button>
                </span>
            ))}
            <input
              id="tags"
              name="tags"
              type="text"
              list="tag-list"
              value={currentTag}
              onChange={handleTagChange}
              onKeyDown={handleTagKeyDown}
              onBlur={() => addTag()}
              className="flex-grow bg-transparent focus:outline-none"
              placeholder="Ajouter un tag..."
            />
            <datalist id="tag-list">
                {tags.filter(t => !formData.tags?.includes(t)).map(tag => <option key={tag} value={tag} />)}
            </datalist>
        </div>
      </div>
      <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 cursor-pointer">
            <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 bg-gray-700 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
            />
            Featured
          </label>
      </div>
      {renderField('description', 'Description', 'textarea')}
      {renderField('downloadUrl', 'URL de Téléchargement', 'url')}
      {renderField('videoUrl', 'URL Vidéo (Optionnel)', 'url', false)}
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
        <input
            id="rating"
            name="rating"
            type="number"
            value={formData.rating || ''}
            onChange={handleChange}
            step="0.1"
            min="0"
            max="5"
            required
            className="w-full px-3 py-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
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
      {renderField('imageUrl', 'URL de l\'image')}
      {renderField('url', 'URL du produit')}
      {renderField('category', 'Catégorie')}
      {renderField('description', 'Description', 'textarea')}
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
            
            <div className="p-6 border-t border-gray-700 mt-auto flex justify-end gap-4 -mx-6 -mb-6">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md">Sauvegarder</button>
            </div>
        </form>
      </div>
    </div>
  );
}
