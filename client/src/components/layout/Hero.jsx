import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="relative w-full min-h-screen bg-brand-black flex flex-col justify-center items-center overflow-hidden pt-20 px-4 md:px-8">
      {/* Ambient Background Gradients */}
      <div className="absolute top-1/4 left-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-brand-accentNeon/10 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-white/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Column: Bold Attitude Typography */}
        <div className="lg:col-span-7 flex flex-col justify-center text-center lg:text-left mt-10 lg:mt-0">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="text-xs md:text-sm font-display font-bold tracking-[0.3em] text-brand-accentNeon bg-brand-accentNeon/10 border border-brand-accentNeon/20 px-4 py-2 rounded-full inline-block mb-6 uppercase">
              Drop 01 // Core Collection
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="font-display font-black text-6xl sm:text-7xl md:text-8xl tracking-tighter leading-[0.85] text-white uppercase mb-6"
          >
            Wear Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-400 to-neutral-700">
              Attitude
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-neutral-400 text-sm md:text-base max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed font-light"
          >
            Premium, hyper-structured luxury blank garments engineered for modern expression. Heavyweight cotton cuts colliding with high-contrast minimal aesthetics.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
          >
            <Link to="/shop" className="btn-primary w-full sm:w-auto flex justify-center items-center gap-2 group">
              Explore Collection
              <ArrowUpRight size={18} className="transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        {/* Right Column: Premium Showcase Floating Card */}
        <div className="lg:col-span-5 relative w-full flex justify-center items-center mt-12 lg:mt-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className="relative w-[280px] sm:w-[340px] aspect-[3/4] glass-card overflow-hidden group"
          >
            {/* Dark Placeholder Graphic */}
            <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-950 flex flex-col items-center justify-center p-8 transition-transform duration-700 group-hover:scale-105">
              <span className="font-display font-black text-8xl text-white/5 absolute pointer-events-none">AXT</span>
              <div className="w-24 h-24 border border-dashed border-white/20 rounded-full flex items-center justify-center animate-[spin_10s_linear_infinite]">
                <div className="w-full h-full border border-brand-accentNeon/30 rounded-full" />
              </div>
            </div>

            {/* Micro Details Floating Tag */}
            <div className="absolute bottom-6 left-6 right-6 z-20 bg-brand-black/80 backdrop-blur-md border border-white/10 p-4 rounded-xl translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
              <p className="text-xs font-bold font-display uppercase tracking-wider text-white">Oversized Heavy Tee</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] text-brand-accentNeon font-sans font-bold">$45.00</span>
                <span className="text-[9px] bg-white text-black font-black px-2 py-0.5 rounded uppercase">280 GSM</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}