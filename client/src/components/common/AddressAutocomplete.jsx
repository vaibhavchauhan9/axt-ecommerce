import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, Hash } from 'lucide-react';
import { lookupPincode, searchAddress, reverseGeocode, isAllowedState, ALLOWED_STATE } from '../../utils/addressLookup';

/**
 * Free address-fetch widget — no API key, no billing.
 *   1. PIN code quick-fill (India Post — most reliable for Indian addresses)
 *   2. Free-text address search-as-you-type (OpenStreetMap Nominatim)
 *   3. "Use My Location" (browser Geolocation + Nominatim reverse geocode)
 *
 * On a successful pick, calls onResolved({ street, city, postalCode }) — country
 * and state are intentionally NOT passed back, since those two fields are
 * permanently fixed elsewhere in the form. If a result falls outside Uttar
 * Pradesh, it's rejected via onError instead of silently mismatching them.
 */
export default function AddressAutocomplete({ onResolved, onError }) {
  const [pincode, setPincode] = useState('');
  const [pincodeLoading, setPincodeLoading] = useState(false);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);

  const [locating, setLocating] = useState(false);

  // Debounced free-text search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await searchAddress(query);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (err) {
        onError?.(err.message);
      } finally {
        setSearchLoading(false);
      }
    }, 500); // respects Nominatim's fair-use rate limit

    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const acceptResult = (parsed) => {
    if (parsed.state && !isAllowedState(parsed.state)) {
      onError?.(`We currently only deliver within ${ALLOWED_STATE}. That address is in ${parsed.state}.`);
      return;
    }
    onResolved?.({ street: parsed.street, city: parsed.city, postalCode: parsed.postalCode });
  };

  const handlePincodeLookup = async () => {
    setPincodeLoading(true);
    try {
      const result = await lookupPincode(pincode);
      if (!isAllowedState(result.state)) {
        onError?.(`We currently only deliver within ${ALLOWED_STATE}. That PIN code is in ${result.state}.`);
        return;
      }
      onResolved?.({ street: result.area, city: result.city, postalCode: result.postalCode });
      onError?.('');
      setPincode('');
    } catch (err) {
      onError?.(err.message);
    } finally {
      setPincodeLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    acceptResult(suggestion);
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
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
          const result = await reverseGeocode(position.coords.latitude, position.coords.longitude);
          acceptResult(result);
        } catch (err) {
          onError?.(err.message);
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        onError?.('Location permission denied. Please use your PIN code or enter your address manually.');
      }
    );
  };

  return (
    <div className="flex flex-col gap-3 mb-1">
      {/* PIN code quick-fill — fastest & most reliable for Indian addresses */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter 6-digit PIN code"
            className="w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-lg py-3 pl-9 pr-4 focus:outline-none focus:border-brand-accentNeon"
          />
        </div>
        <button
          type="button"
          onClick={handlePincodeLookup}
          disabled={pincode.length !== 6 || pincodeLoading}
          className="flex items-center gap-2 px-4 py-3 text-[11px] font-bold uppercase tracking-widest bg-brand-accentNeon text-black rounded-lg transition-colors disabled:opacity-40 disabled:bg-white/10 disabled:text-neutral-400 shrink-0"
        >
          {pincodeLoading ? <Loader2 size={14} className="animate-spin" /> : 'Fetch'}
        </button>
      </div>

      {/* Free-text search + current location */}
      <div className="flex flex-col sm:flex-row gap-2 relative">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Or search your address"
            className="w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-lg py-3 pl-9 pr-4 focus:outline-none focus:border-brand-accentNeon"
          />
          {searchLoading && (
            <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 animate-spin" />
          )}

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-neutral-900 border border-white/10 rounded-lg overflow-hidden shadow-xl max-h-56 overflow-y-auto">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectSuggestion(s)}
                  className="w-full text-left px-4 py-2.5 text-xs text-neutral-300 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                >
                  {s.label}
                </button>
              ))}
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

      <p className="text-[9px] text-neutral-600">
        Address data © OpenStreetMap contributors · PIN code data via India Post
      </p>
    </div>
  );
}

