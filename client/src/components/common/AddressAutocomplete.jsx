import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { searchAddress, reverseGeocode, isAllowedState, ALLOWED_STATE } from '../../utils/addressLookup';

/**
 * FREE address lookup — no API key, no billing. Uses OpenStreetMap Nominatim for
 * search + "Use my location" (see ../../utils/addressLookup.js).
 *
 * On a successful pick, calls onResolved({ street, city, postalCode }) — country and
 * state are intentionally NOT passed back, since those two fields are permanently
 * fixed elsewhere in the form. Picks outside Uttar Pradesh are rejected via onError.
 */
export default function AddressAutocomplete({ onResolved, onError }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Debounced live search as the user types (Nominatim's fair-use policy asks for
  // ~1 req/sec, so we wait 600ms of silence before firing)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 3) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchAddress(`${query}, Uttar Pradesh, India`);
        setResults(data);
        setShowDropdown(true);
      } catch (err) {
        onError?.(err.message);
      } finally {
        setSearching(false);
      }
    }, 600);

    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Close the dropdown when clicking outside it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const acceptResult = (result) => {
    if (result.country && result.country !== 'India') {
      onError?.('We currently only deliver within India. Please choose an address in India.');
      return;
    }
    if (result.state && !isAllowedState(result.state)) {
      onError?.(`We currently only deliver within ${ALLOWED_STATE}. Please choose an address in ${ALLOWED_STATE}.`);
      return;
    }

    onResolved?.({
      street: result.street,
      city: result.city,
      postalCode: result.postalCode,
    });
  };

  const handleSelectResult = (result) => {
    acceptResult(result);
    setQuery('');
    setResults([]);
    setShowDropdown(false);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      onError?.('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          console.log('[AddressAutocomplete] Got coordinates:', latitude, longitude, 'accuracy(m):', position.coords.accuracy);
          const result = await reverseGeocode(latitude, longitude);
          console.log('[AddressAutocomplete] Reverse geocode result:', result);

          if (!result.city && !result.street && !result.postalCode) {
            onError?.('Your location was detected, but no address details came back for this exact spot. Please search or enter it manually.');
            return;
          }
          if (!result.street) {
            onError?.('Got your area, but not the exact street — please fill in the street address manually.');
          }

          acceptResult(result);
        } catch (err) {
          console.error('[AddressAutocomplete] Reverse geocode failed:', err);
          onError?.(err.message);
        } finally {
          setLocating(false);
        }
      },
      (geoError) => {
        console.error('[AddressAutocomplete] Geolocation failed:', geoError);
        setLocating(false);
        const messages = {
          1: 'Location permission denied. Please allow location access and try again.',
          2: 'Your location could not be determined. Please search or enter your address manually.',
          3: 'Location request timed out. Please try again or enter your address manually.',
        };
        onError?.(messages[geoError.code] || 'Location permission denied. Please search or enter your address manually.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  return (
    <div ref={wrapperRef} className="relative flex flex-col sm:flex-row gap-2 mb-1">
      <div className="relative flex-1">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder="Search your address (Uttar Pradesh only)"
          className="w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-lg py-3 pl-9 pr-9 focus:outline-none focus:border-brand-accentNeon"
        />
        {searching && (
          <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 animate-spin" />
        )}

        {showDropdown && results.length > 0 && (
          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-neutral-900 border border-white/10 rounded-lg overflow-hidden shadow-xl max-h-56 overflow-y-auto">
            {results.map((result, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectResult(result)}
                className="w-full text-left px-4 py-3 text-xs text-neutral-300 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
              >
                {result.label}
              </button>
            ))}
            <p className="px-4 py-1.5 text-[9px] text-neutral-600 bg-black/30">© OpenStreetMap contributors</p>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={handleUseCurrentLocation}
        disabled={locating}
        className="flex items-center justify-center gap-2 px-4 py-3 text-[11px] font-bold uppercase tracking-widest bg-white/10 hover:bg-brand-accentNeon hover:text-black rounded-lg transition-colors disabled:opacity-50 shrink-0"
      >
        {locating ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
        {locating ? 'Locating...' : 'Use My Location'}
      </button>
    </div>
  );
}
