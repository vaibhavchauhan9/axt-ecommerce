import React from 'react';
import ProductCard from './ProductCard';

export default function ProductGrid({ products, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 w-full">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="w-full flex flex-col gap-4 animate-pulse">
            <div className="w-full aspect-[3/4] bg-neutral-900 rounded-xl" />
            <div className="h-4 bg-neutral-900 rounded w-3/4" />
            <div className="h-3 bg-neutral-900 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="w-full py-20 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl">
        <p className="font-display font-bold text-neutral-500 uppercase tracking-widest">No Drops Found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-x-6 md:gap-y-10 w-full">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}