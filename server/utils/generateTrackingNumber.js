// Generates a courier-style tracking number, e.g. "AXT7K9P2Q4M1R".
// Not cryptographically sensitive — just needs to be short, unique-enough,
// and readable over a phone call ("A-X-T-7-K-9...").
const generateTrackingNumber = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I ambiguity
  let suffix = '';
  for (let i = 0; i < 10; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `AXT${suffix}`;
};

export default generateTrackingNumber;
