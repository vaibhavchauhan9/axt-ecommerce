import logo from '../assets/axt.png';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ForgotPasswordModal from '../components/auth/ForgotPasswordModal';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const { loginUser, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await loginUser(email, password);
    
    if (result.success) {
      const origin = location.state?.from?.pathname || '/';
      navigate(origin);
    } else {
      setError(result.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#404040] flex flex-col items-center justify-start pt-12 pb-20 px-4 select-none">
      {/* Big Custom Brand Header Layer matching 1000000466.jpg */}
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
          Login
        </h1>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
          {error && (
            <div className="bg-red-600/20 border border-red-500 text-red-400 p-2 text-xs font-bold text-center flex items-center justify-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* Username/Email Input Container */}
          <div className="w-full bg-[#333333] h-12 rounded-full px-4 flex items-center gap-3 border border-transparent focus-within:border-[#008BE5] transition-all">
            <User className="text-white shrink-0" size={22} fill="white" />
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent text-white text-sm font-sans placeholder-neutral-500 focus:outline-none"
              placeholder="Username/Gmail"
            />
          </div>

          {/* Password Input Container with Visibility Toggle */}
          <div className="w-full bg-[#333333] h-12 rounded-full px-4 flex items-center gap-3 border border-transparent focus-within:border-[#008BE5] transition-all relative">
            <Lock className="text-white shrink-0" size={22} />
            <input 
              type={showPassword ? "text" : "password"} 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent text-white text-sm font-sans placeholder-neutral-500 pr-10 focus:outline-none"
              placeholder="Password"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 text-white hover:text-neutral-400 transition-colors"
            >
              {showPassword ? <EyeOff size={22} /> : <Eye size={22} strokeWidth={2.5} />}
            </button>
          </div>

          {/* Remember Me Option */}
          <div className="flex items-center justify-between gap-2 pl-2 pr-1">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="rememberMe" 
                className="w-4 h-4 bg-transparent border-2 border-white checked:bg-[#008BE5] focus:ring-0 cursor-pointer accent-[#008BE5]"
              />
              <label htmlFor="rememberMe" className="text-xs text-white font-sans cursor-pointer font-medium">
                Remember me
              </label>
            </div>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-xs text-[#008BE5] font-bold hover:underline transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Electric Blue Action Accent Button */}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-[#008BE5] text-white font-display font-black text-2xl h-11 rounded-xl uppercase tracking-wider border-2 border-black drop-shadow-[2px_2px_0px_rgba(250,250,250,1)] hover:bg-[#007acc] transition-all transform active:translate-y-0.5 mt-2 flex items-center justify-center"
          >
            {isSubmitting ? '...' : 'LOGIN'}
          </button>
        </form>

        <p className="mt-8 text-xs text-white font-sans tracking-wide">
          Don't have an account? <Link to="/register" className="font-bold underline hover:text-[#008BE5] transition-colors ml-1">Register</Link>
        </p>
      </div>

      {showForgotPassword && (
        <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
      )}
    </div>
  );
}      setError(result.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#404040] flex flex-col items-center justify-start pt-12 pb-20 px-4 select-none">
      {/* Big Custom Brand Header Layer matching 1000000466.jpg */}
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
          Login
        </h1>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
          {error && (
            <div className="bg-red-600/20 border border-red-500 text-red-400 p-2 text-xs font-bold text-center flex items-center justify-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* Username/Email Input Container */}
          <div className="w-full bg-[#333333] h-12 rounded-full px-4 flex items-center gap-3 border border-transparent focus-within:border-[#008BE5] transition-all">
            <User className="text-white shrink-0" size={22} fill="white" />
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent text-white text-sm font-sans placeholder-neutral-500 focus:outline-none"
              placeholder="Username/Gmail"
            />
          </div>

          {/* Password Input Container with Visibility Toggle */}
          <div className="w-full bg-[#333333] h-12 rounded-full px-4 flex items-center gap-3 border border-transparent focus-within:border-[#008BE5] transition-all relative">
            <Lock className="text-white shrink-0" size={22} />
            <input 
              type={showPassword ? "text" : "password"} 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent text-white text-sm font-sans placeholder-neutral-500 pr-10 focus:outline-none"
              placeholder="Password"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 text-white hover:text-neutral-400 transition-colors"
            >
              {showPassword ? <EyeOff size={22} /> : <Eye size={22} strokeWidth={2.5} />}
            </button>
          </div>

          {/* Remember Me Option */}
          <div className="flex items-center justify-between gap-2 pl-2 pr-1">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="rememberMe" 
                className="w-4 h-4 bg-transparent border-2 border-white checked:bg-[#008BE5] focus:ring-0 cursor-pointer accent-[#008BE5]"
              />
              <label htmlFor="rememberMe" className="text-xs text-white font-sans cursor-pointer font-medium">
                Remember me
              </label>
            </div>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-xs text-[#008BE5] font-bold hover:underline transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Electric Blue Action Accent Button */}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-[#008BE5] text-white font-display font-black text-2xl h-11 rounded-xl uppercase tracking-wider border-2 border-black drop-shadow-[2px_2px_0px_rgba(250,250,250,1)] hover:bg-[#007acc] transition-all transform active:translate-y-0.5 mt-2 flex items-center justify-center"
          >
            {isSubmitting ? '...' : 'LOGIN'}
          </button>
        </form>

        <p className="mt-8 text-xs text-white font-sans tracking-wide">
          Don't have an account? <Link to="/register" className="font-bold underline hover:text-[#008BE5] transition-colors ml-1">Register</Link>
        </p>
      </div>

      {showForgotPassword && (
        <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
      )}
    </div>
  );
}
