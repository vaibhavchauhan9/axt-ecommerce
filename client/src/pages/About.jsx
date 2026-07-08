import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, ShieldCheck, Truck, Sparkles } from 'lucide-react';

export default function About() {
  return (
    <div className="w-full min-h-screen bg-brand-black pt-28 pb-24 px-4 md:px-8 text-white">
      <div className="max-w-4xl mx-auto">

        <p className="text-[10px] text-brand-accentNeon font-bold uppercase tracking-[0.3em] mb-4 text-center">
          Our Story
        </p>
        <h1 className="font-display font-black text-4xl md:text-6xl uppercase tracking-wider text-center mb-8">
          AXT — Attitude X T-Shirts
        </h1>

        <p className="text-neutral-400 text-sm md:text-base leading-relaxed text-center max-w-2xl mx-auto mb-16">
          AXT was built on one simple belief — a t-shirt should say something before you do.
          We design bold, unapologetic streetwear for people who wear their attitude, not just their clothes.
          Every piece is made to move with you, hold up to daily wear, and stand out in a room full of basics.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="glass-card p-6 border border-white/5 text-center">
            <Flame className="text-brand-accentNeon mx-auto mb-4" size={28} />
            <h3 className="font-bold text-sm uppercase tracking-widest mb-2">Bold by Design</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Every graphic and cut is chosen to make a statement — not blend into the crowd.
            </p>
          </div>
          <div className="glass-card p-6 border border-white/5 text-center">
            <ShieldCheck className="text-brand-accentNeon mx-auto mb-4" size={28} />
            <h3 className="font-bold text-sm uppercase tracking-widest mb-2">Built to Last</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Heavyweight cotton, reinforced stitching, and prints that don't crack or fade after a few washes.
            </p>
          </div>
          <div className="glass-card p-6 border border-white/5 text-center">
            <Truck className="text-brand-accentNeon mx-auto mb-4" size={28} />
            <h3 className="font-bold text-sm uppercase tracking-widest mb-2">Delivered Fast</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              From our warehouse to your doorstep — quick dispatch, real tracking, no guessing games.
            </p>
          </div>
        </div>

        <div className="glass-card border border-white/5 p-8 md:p-12 text-center mb-16">
          <Sparkles className="text-brand-accentNeon mx-auto mb-4" size={24} />
          <h2 className="font-display font-black text-2xl uppercase tracking-wider mb-4">Our Mission</h2>
          <p className="text-neutral-400 text-sm leading-relaxed max-w-xl mx-auto">
            To give every customer a piece of clothing that feels like an extension of who they are —
            unfiltered, confident, and impossible to ignore. No filler, no fast-fashion compromises,
            just clothes worth wearing.
          </p>
        </div>

        <div className="text-center">
          <p className="text-xs text-neutral-500 mb-4 uppercase tracking-widest font-bold">Got questions?</p>
          <Link
            to="/support"
            className="inline-block bg-white text-black px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-brand-accentNeon transition-colors"
          >
            Visit Support
          </Link>
        </div>

      </div>
    </div>
  );
}

