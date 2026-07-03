import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useUI } from '../../context/UIContext';

export default function SearchOverlay() {
  const { searchBarActive, toggleSearchBar } = useUI();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  if (!searchBarActive) return null;

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      toggleSearchBar();
      navigate(`/shop?search=${encodeURIComponent(query)}`);
      setQuery('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-brand-black/95 backdrop-blur-lg flex flex-col pt-32 px-4 md:px-8 animate-[fadeIn_0.2s_ease-out]">
      <button 
        onClick={toggleSearchBar} 
        className="absolute top-8 right-8 text-neutral-400 hover:text-white transition-colors"
      >
        <X size={32} />
      </button>

      <div className="w-full max-w-4xl mx-auto">
        <span className="text-brand-accentNeon text-xs font-bold uppercase tracking-widest mb-4 block">
          // Search Catalog
        </span>
        <form onSubmit={handleSearch} className="relative flex items-center border-b-2 border-white/20 pb-4 focus-within:border-white transition-colors">
          <Search size={32} className="text-neutral-500 mr-4" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="TYPE TO SEARCH..."
            className="w-full bg-transparent text-3xl md:text-5xl font-display font-black text-white uppercase placeholder-neutral-700 focus:outline-none"
          />
        </form>

        <div className="mt-8 flex gap-4 text-xs font-sans text-neutral-500 uppercase tracking-widest">
          <span>Trending:</span>
          <button onClick={() => setQuery('Oversized')} className="hover:text-white transition-colors">Oversized</button>
          <button onClick={() => setQuery('Heavyweight')} className="hover:text-white transition-colors">Heavyweight</button>
          <button onClick={() => setQuery('Cyber')} className="hover:text-white transition-colors">Cyber</button>
        </div>
      </div>
    </div>
  );
}