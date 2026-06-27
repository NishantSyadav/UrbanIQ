import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, AlertCircle, Compass, Check, X } from 'lucide-react';
import { validateAndCorrectHierarchy } from '../utils/location';

interface LocationAutocompleteProps {
  formAddress: string;
  setFormAddress: (address: string) => void;
  formLat: number | null;
  setFormLat: (lat: number | null) => void;
  formLng: number | null;
  setFormLng: (lng: number | null) => void;
  formNeighborhood: string;
  setFormNeighborhood: (neighborhood: string) => void;
  formState: string;
  setFormState: (state: string) => void;
  formCity: string;
  setFormCity: (city: string) => void;
  formDistrict: string;
  setFormDistrict: (district: string) => void;
  formExactLocation: string;
  setFormExactLocation: (exactLocation: string) => void;
}

interface OSMSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    neighbourhood?: string;
    suburb?: string;
    city_district?: string;
    city?: string;
    state?: string;
    country?: string;
    county?: string;
    town?: string;
    village?: string;
    municipality?: string;
    region?: string;
  };
}

const PRESET_SUGGESTIONS: OSMSuggestion[] = [
  {
    place_id: 10001,
    display_name: "Sarvodaya Nagar, Kanpur, Kanpur Nagar, Uttar Pradesh, 208005, India",
    lat: "26.4719",
    lon: "80.3082",
    address: {
      neighbourhood: "Sarvodaya Nagar",
      suburb: "Sarvodaya Nagar",
      city: "Kanpur",
      state: "Uttar Pradesh",
      country: "India",
      county: "Kanpur Nagar"
    }
  },
  {
    place_id: 10002,
    display_name: "Kakadeo, Kanpur, Kanpur Nagar, Uttar Pradesh, 208025, India",
    lat: "26.4795",
    lon: "80.3015",
    address: {
      neighbourhood: "Kakadeo",
      suburb: "Kakadeo",
      city: "Kanpur",
      state: "Uttar Pradesh",
      country: "India",
      county: "Kanpur Nagar"
    }
  },
  {
    place_id: 10003,
    display_name: "Swaroop Nagar, Kanpur, Kanpur Nagar, Uttar Pradesh, 208002, India",
    lat: "26.4789",
    lon: "80.3235",
    address: {
      neighbourhood: "Swaroop Nagar",
      suburb: "Swaroop Nagar",
      city: "Kanpur",
      state: "Uttar Pradesh",
      country: "India",
      county: "Kanpur Nagar"
    }
  },
  {
    place_id: 10004,
    display_name: "Civil Lines, Prayagraj, Prayagraj District, Uttar Pradesh, 211001, India",
    lat: "25.4529",
    lon: "81.8349",
    address: {
      neighbourhood: "Civil Lines",
      suburb: "Civil Lines",
      city: "Prayagraj",
      state: "Uttar Pradesh",
      country: "India",
      county: "Prayagraj District"
    }
  },
  {
    place_id: 10005,
    display_name: "Sector 62, Noida, Gautam Buddha Nagar, Uttar Pradesh, 201301, India",
    lat: "28.6219",
    lon: "77.3639",
    address: {
      neighbourhood: "Sector 62",
      suburb: "Sector 62",
      city: "Noida",
      state: "Uttar Pradesh",
      country: "India",
      county: "Gautam Buddha Nagar"
    }
  },
  {
    place_id: 10006,
    display_name: "MG Road, Bengaluru, Bengaluru Urban, Karnataka, 560001, India",
    lat: "12.9756",
    lon: "77.6068",
    address: {
      neighbourhood: "MG Road",
      suburb: "MG Road",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      county: "Bengaluru Urban"
    }
  },
  {
    place_id: 10007,
    display_name: "Connaught Place, New Delhi, Delhi, 110001, India",
    lat: "28.6304",
    lon: "77.2177",
    address: {
      neighbourhood: "Connaught Place",
      suburb: "Connaught Place",
      city: "New Delhi",
      state: "Delhi",
      country: "India",
      county: "New Delhi"
    }
  }
];

export default function LocationAutocomplete({
  formAddress,
  setFormAddress,
  formLat,
  setFormLat,
  formLng,
  setFormLng,
  formNeighborhood,
  setFormNeighborhood,
  formState,
  setFormState,
  formCity,
  setFormCity,
  formDistrict,
  setFormDistrict,
  formExactLocation,
  setFormExactLocation,
}: LocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState(formAddress);
  const [suggestions, setSuggestions] = useState<OSMSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep internal input value in sync when parent formAddress is cleared/reset
  useEffect(() => {
    setInputValue(formAddress);
  }, [formAddress]);

  // Handle outside clicks to close autocomplete dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setFormAddress(val); // Update parent state as they type

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!val.trim() || val.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      setIsSearching(false);
      return;
    }

    const matchedPresets = PRESET_SUGGESTIONS.filter(p => 
      p.display_name.toLowerCase().includes(val.toLowerCase())
    );

    // If we have local presets matching, show them immediately to avoid delay
    if (matchedPresets.length > 0) {
      setSuggestions(matchedPresets);
      setShowDropdown(true);
    } else {
      setIsSearching(true);
      setError(null);
      setShowDropdown(true);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            val
          )}&limit=5&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'en',
            },
          }
        );

        let data: OSMSuggestion[] = [];
        if (response.ok) {
          data = await response.json();
        }

        const combined = [...matchedPresets];
        data.forEach(item => {
          if (!combined.some(p => p.display_name.toLowerCase() === item.display_name.toLowerCase() || p.place_id === item.place_id)) {
            combined.push(item);
          }
        });

        setSuggestions(combined);
        if (combined.length === 0) {
          setError('No locations found');
        }
      } catch (err) {
        console.error('OSM Autocomplete Error:', err);
        if (matchedPresets.length > 0) {
          setSuggestions(matchedPresets);
        } else {
          setError('Network error or API limit reached');
        }
      } finally {
        setIsSearching(false);
      }
    }, 400); // 400ms debounce
  };

  // Helper to extract and infer administrative details from Nominatim response
  const extractAdminDetails = (displayName: string, addressObj: any, latNum: number, lngNum: number) => {
    const addr = addressObj || {};
    
    const rawState = addr.state || addr.region || '';
    const rawCity = addr.city || addr.town || addr.village || addr.municipality || addr.city_district || '';
    const rawDistrict = addr.county || addr.suburb || addr.city_district || addr.neighbourhood || '';
    const rawCountry = addr.country || '';

    const validated = validateAndCorrectHierarchy(rawState, rawCity, rawDistrict, rawCountry, displayName);

    return { 
      state: validated.state, 
      city: validated.city, 
      district: validated.district 
    };
  };

  // Select suggestion
  const handleSelectSuggestion = (suggestion: OSMSuggestion) => {
    const latNum = parseFloat(suggestion.lat);
    const lngNum = parseFloat(suggestion.lon);
    
    setFormAddress(suggestion.display_name);
    setInputValue(suggestion.display_name);
    setFormLat(latNum);
    setFormLng(lngNum);

    // Extract administrative details automatically
    const { state, city, district } = extractAdminDetails(
      suggestion.display_name,
      suggestion.address,
      latNum,
      lngNum
    );

    setFormState(state);
    setFormCity(city);
    setFormDistrict(district);
    setFormNeighborhood('');

    setSuggestions([]);
    setShowDropdown(false);
    setError(null);
  };

  // Browser Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    setError(null);
    setShowDropdown(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setFormLat(latitude);
        setFormLng(longitude);

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'en',
              },
            }
          );

          if (!response.ok) {
            throw new Error('Reverse geocoding request failed');
          }

          const data = await response.json();
          if (data && data.display_name) {
            setFormAddress(data.display_name);
            setInputValue(data.display_name);
            
            // Extract administrative details automatically
            const { state, city, district } = extractAdminDetails(
              data.display_name,
              data.address,
              latitude,
              longitude
            );

            setFormState(state);
            setFormCity(city);
            setFormDistrict(district);
            setFormNeighborhood('');
          } else {
            const fallbackAddress = `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`;
            setFormAddress(fallbackAddress);
            setInputValue(fallbackAddress);

            const { state, city, district } = extractAdminDetails(
              fallbackAddress,
              {},
              latitude,
              longitude
            );
            setFormState(state);
            setFormCity(city);
            setFormDistrict(district);
            setFormNeighborhood('');
          }
        } catch (err) {
          console.error('Reverse Geocoding Error:', err);
          const fallbackAddress = `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`;
          setFormAddress(fallbackAddress);
          setInputValue(fallbackAddress);

          const { state, city, district } = extractAdminDetails(
            fallbackAddress,
            {},
            latitude,
            longitude
          );
          setFormState(state);
          setFormCity(city);
          setFormDistrict(district);
          setFormNeighborhood('');
          setError('Failed to fetch readable address, using coordinates.');
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.error('Geolocation Error:', err);
        setIsLocating(false);
        if (err.code === 1) {
          setError('Permission denied. Please allow location access.');
        } else if (err.code === 2) {
          setError('Position unavailable or network error.');
        } else {
          setError('Timeout or unexpected error fetching location.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Clear current selected coordinates/address
  const handleClear = () => {
    setInputValue('');
    setFormAddress('');
    setFormLat(null);
    setFormLng(null);
    setFormState('');
    setFormCity('');
    setFormDistrict('');
    setFormNeighborhood('Downtown Core');
    setSuggestions([]);
    setShowDropdown(false);
    setError(null);
  };

  return (
    <div className="space-y-1.5 relative w-full" ref={dropdownRef} id="location-autocomplete-container">
      <div className="flex justify-between items-center">
        <label className="text-sm font-bold text-brand-navy flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-brand-blue" />
          <span>Location Address / Coordinates <span className="text-red-500">*</span></span>
        </label>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="text-xs font-bold text-brand-blue hover:text-brand-blue-dark flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 transition-colors disabled:opacity-60 cursor-pointer"
        >
          {isLocating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-blue" />
          ) : (
            <Compass className="w-3.5 h-3.5 text-brand-blue" />
          )}
          <span>{isLocating ? 'Locating...' : 'Use My Current Location'}</span>
        </button>
      </div>

      <div className="relative flex items-center">
        <div className="absolute left-3.5 pointer-events-none text-slate-400">
          {isSearching ? (
            <Loader2 className="w-4.5 h-4.5 animate-spin text-brand-blue" />
          ) : (
            <Search className="w-4.5 h-4.5" />
          )}
        </div>

        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (inputValue.trim().length >= 3) {
              setShowDropdown(true);
            }
          }}
          placeholder="Search location (e.g. London, Tokyo, Paris or Block 10)..."
          className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-blue text-sm placeholder:text-slate-400 bg-white"
        />

        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {showDropdown && (suggestions.length > 0 || error || isSearching) && (
        <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-xl mt-1 overflow-hidden max-h-60 overflow-y-auto">
          {isSearching && suggestions.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-500 font-medium flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
              Searching locations...
            </div>
          )}

          {error && (
            <div className="p-3 text-xs text-red-600 bg-red-50/50 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isSearching && suggestions.length > 0 && (
            <ul className="divide-y divide-slate-100 m-0 p-0 list-none text-left">
              {suggestions.map((item) => (
                <li key={item.place_id}>
                  <button
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-start gap-2.5 transition-colors text-slate-700 text-xs border-none bg-transparent cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-extrabold text-slate-900 m-0 line-clamp-1">
                        {item.display_name.split(',')[0]}
                      </p>
                      <p className="text-[10px] text-slate-400 m-0 line-clamp-1 mt-0.5">
                        {item.display_name.split(',').slice(1).join(',').trim()}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Selected Coordinates Display Box & Location Verified Card */}
      {formLat !== null && formLng !== null && (
        <div className="space-y-2 mt-2">
          {/* Geocoded coordinates banner */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-[11px] text-emerald-800 font-bold font-mono">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Coordinates Geocoded: {formLat.toFixed(6)}, {formLng.toFixed(6)}</span>
          </div>

          {/* Read-only Information Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-left">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <span className="text-emerald-500">📍</span>
              <span>Location Verified</span>
            </div>
            <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-[11px]">
              <div>
                <span className="text-slate-400 font-semibold block">State</span>
                <span className="text-slate-700 font-bold">{formState || 'California'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">City</span>
                <span className="text-slate-700 font-bold">{formCity || 'San Francisco'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">District</span>
                <span className="text-slate-700 font-bold">{formDistrict || 'San Francisco County'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exact Location / Landmark Description Field */}
      <div className="space-y-1.5 mt-3 text-left">
        <label className="text-xs font-bold text-brand-navy flex items-center gap-1">
          <span>Exact Location / Landmark <span className="text-slate-400 font-normal">(Optional)</span></span>
        </label>
        <input
          type="text"
          value={formExactLocation}
          onChange={(e) => setFormExactLocation(e.target.value)}
          placeholder="Example: Behind Hanuman Temple, Near Government School, Opposite XYZ Hospital, Lane No. 4"
          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-blue text-sm placeholder:text-slate-400 bg-white"
        />
      </div>
    </div>
  );
}
