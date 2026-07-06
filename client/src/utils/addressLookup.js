// Free, no-API-key address lookup helpers.
//
// 1. India Post Pincode API (api.postalpincode.in) — government data, completely
//    free, no signup, no rate-limit key. Best source for Indian city/state lookup.
// 2. OpenStreetMap Nominatim (nominatim.openstreetmap.org) — free geocoding for
//    free-text address search and reverse geocoding ("Use My Location").
//    Fair-use policy: max ~1 request/second, no heavy bulk use. Fine for normal
//    site traffic; for high-traffic production, consider self-hosting Nominatim
//    or using a paid tier of a provider later. Attribution "© OpenStreetMap
//    contributors" is required wherever results are shown (already added to
//    the AddressAutocomplete component).

const ALLOWED_STATE = 'Uttar Pradesh';

// Looks up a 6-digit Indian PIN code and returns { city, state, area } or throws.
export async function lookupPincode(pincode) {
  const clean = pincode.trim();
  if (!/^\d{6}$/.test(clean)) {
    throw new Error('Please enter a valid 6-digit PIN code.');
  }

  const res = await fetch(`https://api.postalpincode.in/pincode/${clean}`);
  const data = await res.json();
  const result = data?.[0];

  if (result?.Status !== 'Success' || !result.PostOffice?.length) {
    throw new Error('PIN code not found. Please check and try again.');
  }

  const office = result.PostOffice[0];
  return {
    area: office.Name,
    city: office.District,
    state: office.State,
    postalCode: clean,
  };
}

// Free-text address search via Nominatim. Returns an array of candidate results.
export async function searchAddress(query) {
  if (!query || query.trim().length < 3) return [];

  const params = new URLSearchParams({
    format: 'jsonv2',
    q: query,
    countrycodes: 'in',
    addressdetails: '1',
    limit: '6',
  });

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'Accept-Language': 'en' },
  });
  if (!res.ok) throw new Error('Address search is temporarily unavailable.');

  const results = await res.json();
  return results.map(parseNominatimResult);
}

// Reverse geocodes a lat/lng (from browser Geolocation) into a parsed address.
// Tries a precise (street-level) lookup first, then falls back to a coarser
// zoom level if the exact point has no mapped address — better to get the
// city/area filled in than nothing at all.
export async function reverseGeocode(latitude, longitude) {
  const zoomLevels = [18, 14]; // 18 = building/street level, 14 = city/town level

  let lastResult = null;

  for (const zoom of zoomLevels) {
    const params = new URLSearchParams({
      format: 'jsonv2',
      lat: latitude,
      lon: longitude,
      zoom: String(zoom),
      addressdetails: '1',
    });

    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
      headers: { 'Accept-Language': 'en' },
    });
    if (!res.ok) continue;

    const result = await res.json();
    if (result?.address) {
      lastResult = parseNominatimResult(result);
      // If we got a street back, no need to try the coarser fallback
      if (lastResult.street) return lastResult;
    }
  }

  if (lastResult) return lastResult; // coarser result is still better than an error
  throw new Error('Could not detect your address from your location.');
}

function parseNominatimResult(result) {
  const addr = result.address || {};
  const street = [addr.house_number, addr.road].filter(Boolean).join(' ') || addr.suburb || '';
  const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || '';

  return {
    label: result.display_name,
    street,
    city,
    state: addr.state || '',
    postalCode: addr.postcode || '',
    country: addr.country || '',
  };
}

export function isAllowedState(state) {
  return state?.trim().toLowerCase() === ALLOWED_STATE.toLowerCase();
}

export { ALLOWED_STATE };
