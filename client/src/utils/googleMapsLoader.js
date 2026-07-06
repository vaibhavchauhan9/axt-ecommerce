// Loads the Google Maps JavaScript API (with the Places library) exactly once,
// no matter how many components ask for it, and caches the resulting promise.
//
// Requires VITE_GOOGLE_MAPS_API_KEY to be set in your client .env file:
//   VITE_GOOGLE_MAPS_API_KEY=your_key_here
// Get a key at https://console.cloud.google.com/google/maps-apis — enable
// "Maps JavaScript API", "Places API", and "Geocoding API" on it, and restrict
// it to your domain(s) in production.

let loadPromise = null;

export function loadGoogleMaps() {
  if (typeof window !== 'undefined' && window.google?.maps?.places) {
    return Promise.resolve(window.google.maps);
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      loadPromise = null;
      reject(new Error('Missing VITE_GOOGLE_MAPS_API_KEY in your client .env file.'));
      return;
    }

    const existingScript = document.querySelector('script[data-google-maps-loader]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google.maps));
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps script.')));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMapsLoader = 'true';
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Failed to load Google Maps script.'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

// Parses a Google Places / Geocoder `address_components` array into the flat
// shape our forms use. Always returns country/state as the raw detected values
// so the caller can decide whether to accept or reject them.
export function parseAddressComponents(components = []) {
  const get = (type) => components.find((c) => c.types.includes(type))?.long_name || '';

  const streetNumber = get('street_number');
  const route = get('route');
  const locality = get('locality') || get('sublocality') || get('administrative_area_level_2');
  const state = get('administrative_area_level_1');
  const postalCode = get('postal_code');
  const country = get('country');

  return {
    street: [streetNumber, route].filter(Boolean).join(' '),
    city: locality,
    state,
    postalCode,
    country,
  };
