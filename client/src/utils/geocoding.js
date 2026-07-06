// FREE geocoding via OpenStreetMap's Nominatim service — no API key, no billing,
// no signup required. This replaces the paid Google Maps API.
//
// Usage policy (https://operations.osmfoundation.org/policies/nominatim/) for the
// free public endpoint: max ~1 request/second, and it's meant for light/moderate
// traffic — fine for a small-to-mid shop's live address search. If you outgrow it,
// the same functions here can point at a self-hosted Nominatim instance, or a
// free-tier key-based service like LocationIQ (5,000 free requests/day) or
// OpenCage (2,500 free requests/day) by swapping BASE_URL and adding a `key` param.

const BASE_URL = 'https://nominatim.openstreetmap.org';

// Debounced text search — call this as the user types (see AddressAutocomplete.jsx).
// Restricted to India (countrycodes=in) and biased toward Uttar Pradesh in the query itself.
export async function searchAddress(query) {
  if (!query || query.trim().length < 3) return [];

  const params = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    countrycodes: 'in',
    limit: '5',
    q: query,
  });

  const response = await fetch(`${BASE_URL}/search?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) throw new Error('Address search failed. Please try again.');
  return response.json();
}

// Reverse geocode a lat/lng pair (used by the "Use My Location" button).
export async function reverseGeocode(lat, lon) {
  const params = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    lat: String(lat),
    lon: String(lon),
  });

  const response = await fetch(`${BASE_URL}/reverse?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) throw new Error('Could not resolve your location to an address.');
  return response.json();
}

// Parses a Nominatim `address` object into the flat shape our forms use.
export function parseNominatimAddress(address = {}) {
  const street = [address.house_number, address.road].filter(Boolean).join(' ') || address.neighbourhood || '';
  const city = address.city || address.town || address.village || address.suburb || address.county || '';

  return {
    street,
    city,
    state: address.state || '',
    postalCode: address.postcode || '',
    country: address.country || '',
  };
}

// FREE bonus: India Post's official Pincode API — given a 6-digit PIN code, returns
// the exact Post Office, city/district, and state. No key needed. Great as a second,
// authoritative check alongside Nominatim since it's government postal data.
export async function lookupPincode(pincode) {
  if (!/^\d{6}$/.test(pincode)) return null;

  const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
  if (!response.ok) return null;

  const data = await response.json();
  const record = data?.[0];
  if (record?.Status !== 'Success' || !record.PostOffice?.length) return null;

  const office = record.PostOffice[0];
  return {
    city: office.District,
    state: office.State,
    postalCode: pincode,
  };
}

