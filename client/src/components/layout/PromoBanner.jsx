import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PromoBanner() {
  const slogans = [
    <span>ATTITUDE <span className="font-light text-neutral-900">X</span> T-SHIRT</span>,
    <span>ATTITUDE <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-400 font-black px-1 border border-black bg-black rounded mx-1">IN</span> WEAR</span>
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Automatically swap texts every 3 seconds
    const timer = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % slogans.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full bg-[#FAB116] h-14 md:h-16 flex items-center justify-center overflow-hidden border-b border-black/10 select-none">
      <div className="relative w-full h-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            // Entering from below
            initial={{ y: 30, opacity: 0 }}
            // Settling smoothly in the center
            animate={{ y: 0, opacity: 1 }}
            // Exiting upwards out of view
            exit={{ y: -30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 22 }}
            className="absolute font-display font-black text-2xl sm:text-3xl md:text-4xl tracking-tighter text-black uppercase flex items-center justify-center"
          >
            {slogans[index]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}