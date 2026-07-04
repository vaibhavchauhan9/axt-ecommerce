import logo from '../assets/axt.png';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { registerUser, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsSubmitting(true);
    const result = await registerUser(name, email, password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#404040] flex flex-col items-center justify-start pt-12 pb-20 px-4 select-none">
      {/* Big Custom Brand Header Layer matching 1000000467.jpg */}
      <div className="mb-10 flex items-center justify-center">
  {/* Replace the img tag in BOTH Login.jsx and Register.jsx with this: */}
<img 
  src={logo} 
  alt="AXT Logo" 
  className="w-20 h-20 rounded-full object-contain shrink-0 drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]"
/>
</div>

      {/* Solid Black Card Container with Sharp White Border Framing */}
      <div className="w-full max-w-sm bg-black border-[3px] border-white p-6 md:p-8 flex flex-col items-center">
        <h1 className="font-serif font-bold text-3xl md:text-4xl text-white mb-8 text-center tracking-wide">
          Signup
        </h1>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          {error && (
            <div className="bg-red-600/20 border border-red-500 text-red-400 p-2 text-xs font-bold text-center flex items-center justify-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* Full Name Input Container */}
          <div className="w-full bg-[#333333] h-12 rounded-full px-6 flex items-center border border-transparent focus-within:border-[#008BE5] transition-all">
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent text-white text-sm font-sans placeholder-neutral-500 focus:outline-none"
              placeholder="Enter your Full name"
            />
          </div>

          {/* Email Input Container */}
          <div className="w-full bg-[#333333] h-12 rounded-full px-4 flex items-center gap-3 border border-transparent focus-within:border-[#008BE5] transition-all">
            <User className="text-white shrink-0" size={22} fill="white" />
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent text-white text-sm font-sans placeholder-neutral-500 focus:outline-none"
              placeholder="Enter Your Gmail"
            />
          </div>

          {/* Create Password Input Container */}
          <div className="w-full bg-[#333333] h-12 rounded-full px-4 flex items-center gap-3 border border-transparent focus-within:border-[#008BE5] transition-all relative">
            <Lock className="text-white shrink-0" size={22} />
            <input 
              type={showPassword ? "text" : "password"} 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent text-white text-sm font-sans placeholder-neutral-500 pr-10 focus:outline-none"
              placeholder="Create Your Password"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 text-white hover:text-neutral-400 transition-colors"
            >
              {showPassword ? <EyeOff size={22} /> : <Eye size={22} strokeWidth={2.5} />}
            </button>
          </div>

          {/* Confirm Password Input Container */}
          <div className="w-full bg-[#333333] h-12 rounded-full px-6 flex items-center border border-transparent focus-within:border-[#008BE5] transition-all">
            <input 
              type="password" 
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-transparent text-white text-sm font-sans placeholder-neutral-500 focus:outline-none"
              placeholder="Confirm Password"
            />
          </div>

          {/* Electric Blue Action Accent Button */}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-[#008BE5] text-white font-display font-black text-2xl h-11 rounded-xl uppercase tracking-wider border-2 border-black drop-shadow-[2px_2px_0px_rgba(250,250,250,1)] hover:bg-[#007acc] transition-all transform active:translate-y-0.5 mt-4 flex items-center justify-center"
          >
            {isSubmitting ? '...' : 'SIGNUP'}
          </button>
        </form>

        <p className="mt-8 text-xs text-white font-sans tracking-wide">
          Already have an account? <Link to="/login" className="font-bold underline hover:text-[#008BE5] transition-colors ml-1">Login</Link>
        </p>
      </div>
    </div>
  );
}
    setIsSubmitting(true);
    const result = await registerUser(name, email, password);
    
    if (result.success) {
      navigate('/shop');
    } else {
      setError(result.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#404040] flex flex-col items-center justify-start pt-12 pb-20 px-4 select-none">
      {/* Big Custom Brand Header Layer matching 1000000467.jpg */}
      <div className="mb-10 flex items-center justify-center">
  {/* Replace the img tag in BOTH Login.jsx and Register.jsx with this: */}
<img 
  src={logo} 
  alt="AXT Logo" 
  className="w-20 h-20 rounded-full object-contain shrink-0 drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]"
/>
</div>

      {/* Solid Black Card Container with Sharp White Border Framing */}
      <div className="w-full max-w-sm bg-black border-[3px] border-white p-6 md:p-8 flex flex-col items-center">
        <h1 className="font-serif font-bold text-3xl md:text-4xl text-white mb-8 text-center tracking-wide">
          Signup
        </h1>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          {error && (
            <div className="bg-red-600/20 border border-red-500 text-red-400 p-2 text-xs font-bold text-center flex items-center justify-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* Full Name Input Container */}
          <div className="w-full bg-[#333333] h-12 rounded-full px-6 flex items-center border border-transparent focus-within:border-[#008BE5] transition-all">
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent text-white text-sm font-sans placeholder-neutral-500 focus:outline-none"
              placeholder="Enter your Full name"
            />
          </div>

          {/* Email Input Container */}
          <div className="w-full bg-[#333333] h-12 rounded-full px-4 flex items-center gap-3 border border-transparent focus-within:border-[#008BE5] transition-all">
            <User className="text-white shrink-0" size={22} fill="white" />
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent text-white text-sm font-sans placeholder-neutral-500 focus:outline-none"
              placeholder="Enter Your Gmail"
            />
          </div>

          {/* Create Password Input Container */}
          <div className="w-full bg-[#333333] h-12 rounded-full px-4 flex items-center gap-3 border border-transparent focus-within:border-[#008BE5] transition-all relative">
            <Lock className="text-white shrink-0" size={22} />
            <input 
              type={showPassword ? "text" : "password"} 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent text-white text-sm font-sans placeholder-neutral-500 pr-10 focus:outline-none"
              placeholder="Create Your Password"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 text-white hover:text-neutral-400 transition-colors"
            >
              {showPassword ? <EyeOff size={22} /> : <Eye size={22} strokeWidth={2.5} />}
            </button>
          </div>

          {/* Confirm Password Input Container */}
          <div className="w-full bg-[#333333] h-12 rounded-full px-6 flex items-center border border-transparent focus-within:border-[#008BE5] transition-all">
            <input 
              type="password" 
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-transparent text-white text-sm font-sans placeholder-neutral-500 focus:outline-none"
              placeholder="Confirm Password"
            />
          </div>

          {/* Electric Blue Action Accent Button */}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-[#008BE5] text-white font-display font-black text-2xl h-11 rounded-xl uppercase tracking-wider border-2 border-black drop-shadow-[2px_2px_0px_rgba(250,250,250,1)] hover:bg-[#007acc] transition-all transform active:translate-y-0.5 mt-4 flex items-center justify-center"
          >
            {isSubmitting ? '...' : 'SIGNUP'}
          </button>
        </form>

        <p className="mt-8 text-xs text-white font-sans tracking-wide">
          Already have an account? <Link to="/login" className="font-bold underline hover:text-[#008BE5] transition-colors ml-1">Login</Link>
        </p>
      </div>
    </div>
  );
}
