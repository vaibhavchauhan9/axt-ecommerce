import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Renders Google's own "Sign in with Google" button and wires its result
// straight into our backend's /auth/google endpoint via AuthContext.googleAuth.
export default function GoogleSignInButton() {
  const buttonRef = useRef(null);
  const { googleAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn('[Google Sign-In] VITE_GOOGLE_CLIENT_ID is not set — button will not render.');
      return;
    }

    const renderButton = () => {
      if (!window.google || !buttonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          const result = await googleAuth(response.credential);
          if (result.success) {
            navigate('/', { replace: true });
          }
        },
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'filled_black',
        size: 'large',
        shape: 'pill',
        width: 320,
        text: 'continue_with',
      });
    };

    // The GIS script loads async — poll briefly until it's ready.
    if (window.google?.accounts?.id) {
      renderButton();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          renderButton();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [googleAuth, navigate]);

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) return null;

  return (
    <div className="w-full flex flex-col items-center gap-4 mt-2">
      <div className="w-full flex items-center gap-3">
        <div className="flex-1 h-px bg-white/20" />
        <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-white/20" />
      </div>
      <div ref={buttonRef} className="flex justify-center w-full [&>div]:!w-full" />
    </div>
  );
}
