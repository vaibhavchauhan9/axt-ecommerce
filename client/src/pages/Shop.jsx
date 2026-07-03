import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { SlidersHorizontal, RefreshCw, Search, X } from 'lucide-react';
import ProductGrid from '../components/product/ProductGrid';
import apiClient from '../services/apiClient';

export default function Shop() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialSearch = queryParams.get('search') || '';

  // Filter & Catalog State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  
  // Active Filter Parameters
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [sortOption, setSortOption] = useState('-createdAt');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [priceMax, setPriceMax] = useState(200);
  
  // Mobile UI State
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Debounce search input to prevent API spam
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch Category List for Sidebar
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await apiClient.get('/categories');
        setCategories(data.data.categories);
      } catch (error) {
        console.error('Failed to load category matrix:', error);
      }
    };
    fetchCategories();
  }, []);

  // Main Product Fetch Pipeline
  const fetchFilteredProducts = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = `/products?sort=${sortOption}&price[lte]=${priceMax}`;
      
      if (debouncedSearch) endpoint += `&search=${encodeURIComponent(debouncedSearch)}`;
      if (selectedCategory) endpoint += `&category=${selectedCategory}`;
      if (selectedSize) endpoint += `&sizes=${selectedSize}`;

      const { data } = await apiClient.get(endpoint);
      setProducts(data.data.products);
    } catch (error) {
      console.error('Failed to fetch filtered catalog:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, sortOption, selectedCategory, selectedSize, priceMax]);

  useEffect(() => {
    fetchFilteredProducts();
  }, [fetchFilteredProducts]);

  const resetFilters = () => {
    setSearchQuery('');
    setSortOption('-createdAt');
    setSelectedCategory('');
    setSelectedSize('');
    setPriceMax(200);
  };

  return (
    <div className="w-full min-h-screen bg-brand-black pt-28 pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden flex justify-between items-center bg-neutral-900/50 p-4 rounded-xl border border-white/5">
          <span className="font-display font-bold uppercase tracking-widest text-xs text-white">
            {products.length} Results
          </span>
          <button 
            onClick={() => setShowMobileFilters(true)}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black bg-white px-4 py-2 rounded-lg"
          >
            <SlidersHorizontal size={14} /> Filters
          </button>
        </div>

        {/* Sidebar Filtering Engine */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-3/4 max-w-sm bg-brand-black border-r border-white/10 p-6 transform transition-transform duration-300 overflow-y-auto
          lg:relative lg:translate-x-0 lg:w-64 lg:p-0 lg:border-none lg:bg-transparent lg:z-0 lg:block
          ${showMobileFilters ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex justify-between items-center mb-8 lg:hidden">
            <h3 className="font-display font-black text-xl tracking-wider text-white uppercase">Filters</h3>
            <button onClick={() => setShowMobileFilters(false)} className="text-neutral-400">
              <X size={24} />
            </button>
          </div>

          <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10 hidden lg:flex">
            <span className="font-display font-bold text-xs tracking-widest text-white uppercase flex items-center gap-2">
              <SlidersHorizontal size={14} /> Refine
            </span>
            <button onClick={resetFilters} className="text-[10px] text-brand-accentNeon uppercase tracking-widest flex items-center gap-1 hover:text-white transition-colors">
              <RefreshCw size={10} /> Reset
            </button>
          </div>

          {/* Search Filter */}
          <div className="mb-8">
            <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-3">Live Search</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Keyword..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-900/50 border border-white/10 text-xs text-white rounded-lg py-3 pl-4 pr-10 focus:outline-none focus:border-brand-accentNeon transition-colors"
              />
              <Search size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500" />
            </div>
          </div>

          {/* Category Filter */}
          <div className="mb-8">
            <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-3">Collections</label>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setSelectedCategory('')}
                className={`text-left text-xs uppercase tracking-wider py-1 transition-colors ${selectedCategory === '' ? 'text-brand-accentNeon font-bold' : 'text-neutral-400 hover:text-white'}`}
              >
                All Collections
              </button>
              {categories.map(c => (
                <button 
                  key={c._id}
                  onClick={() => setSelectedCategory(c._id)}
                  className={`text-left text-xs uppercase tracking-wider py-1 transition-colors ${selectedCategory === c._id ? 'text-brand-accentNeon font-bold' : 'text-neutral-400 hover:text-white'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Size Filter */}
          <div className="mb-8">
            <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-3">Size Matrix</label>
            <div className="grid grid-cols-3 gap-2">
              {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(selectedSize === size ? '' : size)}
                  className={`border text-[10px] font-sans font-bold py-2 rounded-lg transition-all ${selectedSize === size ? 'bg-brand-accentNeon text-black border-brand-accentNeon' : 'bg-neutral-900/30 text-neutral-400 border-white/10 hover:border-white/30 hover:text-white'}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Price Slider */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Max Price</label>
              <span className="text-xs font-bold text-white">${priceMax}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="200" 
              value={priceMax}
              onChange={(e) => setPriceMax(parseInt(e.target.value))}
              className="w-full accent-brand-accentNeon bg-neutral-800 h-1 rounded-lg cursor-pointer"
            />
          </div>
          
          {/* Mobile Reset Button */}
          <button onClick={resetFilters} className="w-full lg:hidden bg-neutral-900 border border-white/10 text-white text-xs font-bold uppercase tracking-widest py-3 rounded-lg mt-4">
            Reset Filters
          </button>
        </aside>

        {/* Mobile Filter Overlay Backdrop */}
        {showMobileFilters && (
          <div 
            className="fixed inset-0 bg-black/80 z-40 lg:hidden"
            onClick={() => setShowMobileFilters(false)}
          />
        )}

        {/* Main Catalog Feed */}
        <main className="flex-grow w-full">
          {/* Top Control Bar */}
          <div className="hidden lg:flex justify-between items-center mb-8 pb-4 border-b border-white/5">
            <span className="text-xs text-neutral-400 font-sans">
              Showing <span className="text-white font-bold">{products.length}</span> artifacts
            </span>

            <div className="flex items-center gap-3">
              <label className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Sort By</label>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="bg-neutral-900/80 border border-white/10 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-brand-accentNeon cursor-pointer"
              >
                <option value="-createdAt">Newest Drops</option>
                <option value="price">Price: Low to High</option>
                <option value="-price">Price: High to Low</option>
                <option value="-ratingsAverage">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Reusable Grid Component */}
          <ProductGrid products={products} loading={loading} />
        </main>

      </div>
    </div>
  );
}