/**
 * Formats a raw Nominatim `display_name` into a short, human-readable label.
 *
 * Nominatim returns variable-length, comma-separated addresses, e.g.
 *   "646;648, Bush Street, Chinatown, San Francisco, CA, 94108, United States"
 *   "Golden Gate Park, Richmond District, San Francisco, California, United States"
 *
 * We anchor on the state (the one reliably identifiable component) and render
 * "<place-or-street>, <city>, <ST>", falling back progressively when parts are
 * missing.
 */

// A Map is used rather than an object literal so that address components which
// collide with Object.prototype members ("constructor", "toString", …) cannot
// produce a false-positive state match.
const STATE_ABBREVIATIONS = new Map<string, string>([
  ['Alabama', 'AL'], ['Alaska', 'AK'], ['Arizona', 'AZ'], ['Arkansas', 'AR'],
  ['California', 'CA'], ['Colorado', 'CO'], ['Connecticut', 'CT'], ['Delaware', 'DE'],
  ['Florida', 'FL'], ['Georgia', 'GA'], ['Hawaii', 'HI'], ['Idaho', 'ID'],
  ['Illinois', 'IL'], ['Indiana', 'IN'], ['Iowa', 'IA'], ['Kansas', 'KS'],
  ['Kentucky', 'KY'], ['Louisiana', 'LA'], ['Maine', 'ME'], ['Maryland', 'MD'],
  ['Massachusetts', 'MA'], ['Michigan', 'MI'], ['Minnesota', 'MN'], ['Mississippi', 'MS'],
  ['Missouri', 'MO'], ['Montana', 'MT'], ['Nebraska', 'NE'], ['Nevada', 'NV'],
  ['New Hampshire', 'NH'], ['New Jersey', 'NJ'], ['New Mexico', 'NM'], ['New York', 'NY'],
  ['North Carolina', 'NC'], ['North Dakota', 'ND'], ['Ohio', 'OH'], ['Oklahoma', 'OK'],
  ['Oregon', 'OR'], ['Pennsylvania', 'PA'], ['Rhode Island', 'RI'], ['South Carolina', 'SC'],
  ['South Dakota', 'SD'], ['Tennessee', 'TN'], ['Texas', 'TX'], ['Utah', 'UT'],
  ['Vermont', 'VT'], ['Virginia', 'VA'], ['Washington', 'WA'], ['West Virginia', 'WV'],
  ['Wisconsin', 'WI'], ['Wyoming', 'WY'],
  // Weather.gov also covers the federal district and these territories.
  ['District of Columbia', 'DC'], ['Puerto Rico', 'PR'], ['Guam', 'GU'],
  ['United States Virgin Islands', 'VI'], ['American Samoa', 'AS'],
  ['Northern Mariana Islands', 'MP'],
]);

/** Components that are never useful as the displayed city. */
const isNoiseComponent = (part: string): boolean =>
  part.includes('County') || /^\d+$/.test(part);

/**
 * Returns the city from the components between `start` and `stateIndex`.
 *
 * Nominatim orders components most-specific-first, so the *last* usable
 * component before the state is the city; earlier ones are neighborhoods or
 * districts. Scanning forward instead would surface "Chinatown" where the user
 * expects "San Francisco".
 */
const findCity = (parts: string[], start: number, stateIndex: number): string => {
  for (let i = stateIndex - 1; i >= start; i--) {
    if (!isNoiseComponent(parts[i])) {
      return parts[i];
    }
  }
  return '';
};

/**
 * Returns the index of the state component, searching from the end.
 *
 * The state sits near the end of a Nominatim address, so scanning backward
 * avoids matching a city that shares a state's name — otherwise "Washington,
 * District of Columbia" resolves to WA rather than DC.
 */
const findStateIndex = (parts: string[]): number => {
  for (let i = parts.length - 1; i >= 0; i--) {
    if (STATE_ABBREVIATIONS.has(parts[i])) {
      return i;
    }
  }
  return -1;
};

export function formatLocation(displayName: string): string {
  const parts = displayName.split(', ');

  if (parts.length < 2) {
    return displayName;
  }

  const stateIndex = findStateIndex(parts);
  if (stateIndex === -1) {
    // No recognized state — show the two most specific components.
    return parts.slice(0, 2).join(', ');
  }

  const stateCode = STATE_ABBREVIATIONS.get(parts[stateIndex])!;

  let addressPart: string;
  let city: string;

  const firstPart = parts[0];
  const startsWithNumber = /^\d/.test(firstPart);

  if (startsWithNumber) {
    // Nominatim returns house-number ranges as "646;648" — render them "646-648".
    const houseNumber = firstPart.replace(/;/g, '-');
    const second = parts[1];
    const secondIsBareNumber = /^\d+$/.test(second);

    if (secondIsBareNumber) {
      // Second component is not a street name, so the number stands alone.
      addressPart = houseNumber;
      city = findCity(parts, 1, stateIndex);
    } else {
      addressPart = `${houseNumber} ${second}`;
      city = findCity(parts, 2, stateIndex);
    }
  } else {
    addressPart = firstPart;
    city = findCity(parts, 1, stateIndex);
  }

  if (city && city !== addressPart) {
    return `${addressPart}, ${city}, ${stateCode}`;
  }

  return `${addressPart}, ${stateCode}`;
}
