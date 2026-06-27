// Geographical hierarchy validation and consistency utilities

export interface GeoLocationDetails {
  country: string;
  state: string;
  district: string;
  city: string;
}

export const KNOWN_HIERARCHIES = [
  {
    keys: ['kanpur', 'sarvodaya nagar', 'kakadeo', 'swaroop nagar'],
    country: 'India',
    state: 'Uttar Pradesh',
    district: 'Kanpur Nagar',
    city: 'Kanpur'
  },
  {
    keys: ['prayagraj', 'allahabad', 'civil lines'],
    country: 'India',
    state: 'Uttar Pradesh',
    district: 'Prayagraj',
    city: 'Prayagraj'
  },
  {
    keys: ['noida', 'sector 62'],
    country: 'India',
    state: 'Uttar Pradesh',
    district: 'Gautam Buddha Nagar',
    city: 'Noida'
  },
  {
    keys: ['new delhi', 'delhi', 'ncr', 'connaught place'],
    country: 'India',
    state: 'Delhi',
    district: 'New Delhi',
    city: 'New Delhi'
  },
  {
    keys: ['mumbai', 'bombay', 'thane', 'navi mumbai'],
    country: 'India',
    state: 'Maharashtra',
    district: 'Mumbai City',
    city: 'Mumbai'
  },
  {
    keys: ['bengaluru', 'bangalore'],
    country: 'India',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    city: 'Bengaluru'
  },
  {
    keys: ['lucknow'],
    country: 'India',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    city: 'Lucknow'
  },
  {
    keys: ['malda', 'english bazar', 'englishbazar'],
    country: 'India',
    state: 'West Bengal',
    district: 'Malda',
    city: 'Malda'
  },
  {
    keys: ['jaipur'],
    country: 'India',
    state: 'Rajasthan',
    district: 'Jaipur',
    city: 'Jaipur'
  },
  {
    keys: ['chennai', 'madras'],
    country: 'India',
    state: 'Tamil Nadu',
    district: 'Chennai',
    city: 'Chennai'
  },
  {
    keys: ['san francisco', 'soma', 'nob hill', 'oakwood', 'market st', 'california'],
    country: 'United States',
    state: 'California',
    district: 'San Francisco County',
    city: 'San Francisco'
  }
];

/**
 * Validates and corrects the geographical hierarchy to ensure that state, district, and city 
 * belong to the same country/region and do not form impossible combinations (e.g., New Delhi in California).
 */
export function validateAndCorrectHierarchy(
  state: string,
  city: string,
  district: string,
  country: string,
  displayName: string = ''
): GeoLocationDetails {
  const normState = (state || '').trim();
  const normCity = (city || '').trim();
  const normDistrict = (district || '').trim();
  const normCountry = (country || '').trim();
  const normDisplayName = (displayName || '').trim();

  const combinedText = [
    normDisplayName,
    normCity,
    normDistrict,
    normState,
    normCountry
  ].join(' ').toLowerCase();

  // 1. Try to find a match in the known hierarchies by keyword
  for (const h of KNOWN_HIERARCHIES) {
    if (h.keys.some(key => combinedText.includes(key))) {
      return {
        country: h.country,
        state: h.state,
        district: h.district,
        city: h.city
      };
    }
  }

  // 2. Fallback check for Country
  let detectedCountry = normCountry;
  if (
    combinedText.includes('india') ||
    combinedText.includes('delhi') ||
    combinedText.includes('mumbai') ||
    combinedText.includes('bengaluru') ||
    combinedText.includes('lucknow') ||
    combinedText.includes('malda') ||
    combinedText.includes('jaipur') ||
    combinedText.includes('chennai') ||
    combinedText.includes('kanpur') ||
    combinedText.includes('prayagraj') ||
    combinedText.includes('noida') ||
    combinedText.includes('uttar pradesh')
  ) {
    detectedCountry = 'India';
  } else if (
    combinedText.includes('united states') ||
    combinedText.includes('usa') ||
    combinedText.includes('california') ||
    combinedText.includes('san francisco')
  ) {
    detectedCountry = 'United States';
  }

  // 3. Country-specific sanitizations to prevent cross-contamination
  if (detectedCountry === 'India') {
    // If we've determined the country is India but state/city is missing or wrong (e.g. leaked from California)
    const finalState = (!normState || normState.toLowerCase().includes('california') || normState.toLowerCase().includes('francisco'))
      ? 'Delhi'
      : normState;
    const finalCity = (!normCity || normCity.toLowerCase().includes('francisco'))
      ? 'New Delhi'
      : normCity;
    const finalDistrict = (!normDistrict || normDistrict.toLowerCase().includes('francisco') || normDistrict.toLowerCase().includes('county'))
      ? 'New Delhi'
      : normDistrict;

    return {
      country: 'India',
      state: finalState,
      district: finalDistrict,
      city: finalCity
    };
  }

  // 4. Default fallback to US/California/San Francisco
  return {
    country: detectedCountry || 'United States',
    state: normState || 'California',
    district: normDistrict || 'San Francisco County',
    city: normCity || 'San Francisco'
  };
}
