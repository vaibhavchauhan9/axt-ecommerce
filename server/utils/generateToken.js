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
  const cookieOptions = {
    httpOnly: true, // Safeguards cookie content against Client-Side XSS execution paths
    secure: process.env.NODE_ENV === 'production', // Transmit exclusively over HTTPS when live
    sameSite: 'strict', // Mitigates Cross-Site Request Forgery (CSRF) attack vectors
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7-day lifespan matching token configuration
  };

  res.cookie('refreshToken', refreshToken, cookieOptions);

  return accessToken;
};