import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/product/ProductCard';
import apiClient from '../services/apiClient';

export default function Home() {
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch exactly 5 trending/latest products
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const { data } = await apiClient.get('/products?limit=5&sort=-createdAt');
        setTrendingProducts(data.data.products);
      } catch (error) {
        console.error('Failed to fetch trending products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  return (
    <div className="w-full bg-[#F5F5F0] min-h-screen text-black pb-20">
      
      {/* Clean minimal spacer beneath the scrolling banner */}
      <div className="w-full h-8 md:h-12"></div>

      {/* --- TRENDING PRODUCTS SLIDER (NO ARROWS) --- */}
      <section className="w-full max-w-7xl mx-auto pl-4 md:pl-6 mb-16 overflow-hidden">
        <div className="pr-4 md:pr-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2 mb-6 border-b-4 border-black pb-4">
            <h2 className="font-display font-black text-3xl md:text-4xl uppercase tracking-tighter text-black flex items-center gap-3">
              Trending Now
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-black"></span>
              </span>
            </h2>
          </div>
        </div>

        {/* The Native Horizontal Scrolling Container */}
        <div className="relative w-full">
          {loading ? (
            <div className="flex gap-4 overflow-hidden pr-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="shrink-0 w-[75vw] sm:w-[280px] md:w-[320px] aspect-[3/4] bg-neutral-200 animate-pulse border-4 border-black"></div>
              ))}
            </div>
          ) : (
            <div className="flex overflow-x-auto gap-4 md:gap-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] pb-6 pr-4 md:pr-6">
              {trendingProducts.map((product) => (
                <div key={product._id} className="snap-start shrink-0 w-[75vw] sm:w-[280px] md:w-[320px]">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* --- EXPLORE COLLECTIONS SECTION --- */}
      <section className="w-full max-w-7xl mx-auto px-4 md:px-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8 border-b-4 border-black pb-6">
          <div>
            <h2 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tighter text-black">
              Explore Collections
            </h2>
          </div>
          <p className="text-xs text-neutral-600 font-bold uppercase tracking-widest md:text-right max-w-xs">
            Premium blank garments. Engineered for modern expression.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Box 1: AXT Originals */}
          <Link 
            to="/collection/axt-originals" 
            className="group relative flex items-center justify-center h-32 md:h-48 bg-white border-4 border-black hover:bg-[#FAB116] transition-colors duration-200 overflow-hidden shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:-translate-y-1 active:translate-y-0 active:shadow-[2px_2px_0px_rgba(0,0,0,1)]"
          >
            <span className="font-display font-black text-3xl lg:text-4xl uppercase tracking-tighter text-black group-hover:scale-110 transition-transform duration-300">
              AXT Originals
            </span>
          </Link>

          {/* Box 2: Anime */}
          <Link 
            to="/collection/anime" 
            className="group relative flex items-center justify-center h-32 md:h-48 bg-white border-4 border-black hover:bg-[#FAB116] transition-colors duration-200 overflow-hidden shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:-translate-y-1 active:translate-y-0 active:shadow-[2px_2px_0px_rgba(0,0,0,1)]"
          >
            <span className="font-display font-black text-3xl lg:text-4xl uppercase tracking-tighter text-black group-hover:scale-110 transition-transform duration-300">
              Anime
            </span>
          </Link>

          {/* Box 3: Wrestling */}
          <Link 
            to="/collection/wrestling" 
            className="group relative flex items-center justify-center h-32 md:h-48 bg-white border-4 border-black hover:bg-[#FAB116] transition-colors duration-200 overflow-hidden shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:-translate-y-1 active:translate-y-0 active:shadow-[2px_2px_0px_rgba(0,0,0,1)]"
          >
            <span className="font-display font-black text-3xl lg:text-4xl uppercase tracking-tighter text-black group-hover:scale-110 transition-transform duration-300">
              Wrestling
            </span>
          </Link>
        </div>
        
      </section>
    </div>
  );
}