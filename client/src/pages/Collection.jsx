import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProductGrid from '../components/product/ProductGrid';
import apiClient from '../services/apiClient';

export default function Collection() {
  // Grabs the collection name from the URL (e.g., 'anime', 'wrestling')
  const { id } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Converts "axt-originals" into "Axt Originals" for the header
  const formatTitle = (str) => {
    return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  useEffect(() => {
    const fetchCollection = async () => {
      setLoading(true);
      try {
        // We use the search endpoint so any product with "Anime" or "Wrestling" 
        // in its name, description, or tags will automatically show up here.
        const { data } = await apiClient.get(`/products?search=${id}`);
        setProducts(data.data.products);
      } catch (error) {
        console.error('Failed to fetch collection:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [id]);

  return (
    <div className="w-full bg-[#F5F5F0] min-h-screen text-black pb-20 pt-12 md:pt-20 px-4 md:px-6 select-none">
      <div className="max-w-7xl mx-auto">
        
        {/* Massive High-Contrast Header */}
        <div className="border-b-4 border-black pb-6 mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <h1 className="font-display font-black text-5xl md:text-6xl lg:text-7xl uppercase tracking-tighter text-black">
            {formatTitle(id)}
          </h1>
          <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mb-2">
            {products.length} Artifacts Discovered
          </p>
        </div>

        {/* Reusing our high-contrast ProductGrid */}
        <ProductGrid products={products} loading={loading} />
      </div>
    </div>
  );
}