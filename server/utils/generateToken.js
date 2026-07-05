import jwt from 'jsonwebtoken';

export const generateTokens = (res, userId) => {
  // 1. Generate Ephemeral Access Token for UI API execution paths
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
  });

  // 2. Generate Persistent Refresh Token for automatic session extension loops
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
  });

  // 3. Bake the Refresh Token securely into an immutable HTTP-Only Cookie structure
  //
  // Frontend (Vercel) and backend (Render) live on different domains, making this
  // a cross-site request in the browser's eyes. `sameSite: 'strict'` (and even
  // 'lax' for some request types) blocks the browser from ever attaching this
  // cookie on cross-site calls, so the refresh cookie silently never arrives at
  // the backend — causing "Missing valid refresh cookie credentials" once the
  // short-lived access token expires. Cross-site cookies require
  // `sameSite: 'none'` paired with `secure: true` (mandatory pairing enforced by
  // browsers). In local dev over plain http, 'none' 	+ secure won't work, so we
  // fall back to 'lax' there instead.
  const cookieOptions = {
    httpOnly: true, // Safeguards cookie content against Client-Side XSS execution paths
    secure: process.env.NODE_ENV === 'production', // Transmit exclusively over HTTPS when live
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7-day lifespan matching token configuration
  };

  res.cookie('refreshToken', refreshToken, cookieOptions);

  return accessToken;
};
