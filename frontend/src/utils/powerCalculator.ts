/**
 * Power Calculator Utility
 * Determines watts per meter based on LED type and recommends appropriate driver models
 */

export interface DriverSpecification {
  model: string;
  voltage: string;
  current: string;
  maxWatts: number;
  specification: string;
}

export interface PowerCalculation {
  totalWatts: number;
  totalLength: number;
  wattsPerMeter: number;
  recommendedDriver: DriverSpecification | null;
}

// Driver specifications based on power ranges
export const DRIVER_SPECS: DriverSpecification[] = [
  {
    model: 'BNV-15-24',
    voltage: '24VDC',
    current: '0.625A',
    maxWatts: 15,
    specification: 'BNV-15-24 24VDC 0.625A',
  },
  {
    model: 'BNV-40-24',
    voltage: '24VDC',
    current: '1.67A',
    maxWatts: 40,
    specification: 'BNV-40-24 24VDC 1.67A',
  },
  {
    model: 'BNV-75-24',
    voltage: '24VDC',
    current: '3.125A',
    maxWatts: 75,
    specification: 'BNV-75-24 24VDC 3.125A',
  },
  {
    model: 'BNV-100-24',
    voltage: '24VDC',
    current: '4.17A',
    maxWatts: 100,
    specification: 'BNV-100-24 24VDC 4.17A',
  },
  {
    model: 'BNV-150-24',
    voltage: '24VDC',
    current: '6.25A',
    maxWatts: 150,
    specification: 'BNV-150-24 24VDC 6.25A',
  },
  {
    model: 'BNV-200-24',
    voltage: '24VDC',
    current: '8.33A',
    maxWatts: 200,
    specification: 'BNV-200-24 24VDC 8.33A',
  },
  {
    model: 'BNV-300-24',
    voltage: '24VDC',
    current: '12.5A',
    maxWatts: 300,
    specification: 'BNV-300-24 24VDC 12.5A',
  },
];

/**
 * Extract watts per meter from LED type string
 * Examples:
 * - "SPOT FREE WHITE 3000K 8W/mtr IP20 24VDC" → 8
 * - "LED NEON SIDEVIEW 4mmW x 8mmH WHITE 2700K 6W" → 6
 * - "LONG LENGTH SINGLE FEED 20m CC SPOT FREE WHITE 3000K 8W/m IP2" → 8
 */
export function extractWattsPerMeter(ledType: string | null): number {
  if (!ledType) return 0;

  // Common patterns:
  // "8W/mtr", "8W/m", "11W/mtr", "6W" (if no per meter, assume per meter)
  const patterns = [
    /(\d+(?:\.\d+)?)\s*W\/m/i, // Matches "8W/m" or "8W/mtr"
    /(\d+(?:\.\d+)?)\s*W\s*\/\s*m/i, // Matches "8 W / m"
    /(\d+(?:\.\d+)?)\s*W(?!\/)/i, // Matches standalone "8W" (if not followed by /)
  ];

  for (const pattern of patterns) {
    const match = ledType.match(pattern);
    if (match) {
      return parseFloat(match[1]);
    }
  }

  // Default fallback based on common LED types
  const ledTypeLower = ledType.toLowerCase();
  if (ledTypeLower.includes('6w') || ledTypeLower.includes('neon')) {
    return 6;
  }
  if (ledTypeLower.includes('8w') || ledTypeLower.includes('spot free')) {
    return 8;
  }
  if (ledTypeLower.includes('11w')) {
    return 11;
  }
  if (ledTypeLower.includes('14.4w')) {
    return 14.4;
  }

  // Default fallback
  return 8;
}

/**
 * Calculate total power for an array of LED strip lengths
 */
export function calculateTotalPower(
  strips: Array<{ length: number; quantity: number }>,
  ledType: string | null
): PowerCalculation {
  const wattsPerMeter = extractWattsPerMeter(ledType);
  let totalLength = 0;
  let totalWatts = 0;

  for (const strip of strips) {
    const stripLength = strip.length * strip.quantity;
    totalLength += stripLength;
    totalWatts += stripLength * wattsPerMeter;
  }

  // Recommend driver with 20% safety margin
  const requiredWatts = totalWatts * 1.2;
  const recommendedDriver = DRIVER_SPECS.find(
    (driver) => driver.maxWatts >= requiredWatts
  ) || DRIVER_SPECS[DRIVER_SPECS.length - 1]; // Use largest if none found

  return {
    totalWatts,
    totalLength,
    wattsPerMeter,
    recommendedDriver: totalWatts > 0 ? recommendedDriver : null,
  };
}

/**
 * Calculate power for a single strip
 */
export function calculateStripPower(length: number, ledType: string | null): number {
  const wattsPerMeter = extractWattsPerMeter(ledType);
  return length * wattsPerMeter;
}

/**
 * Get driver specification by model name
 */
export function getDriverByModel(model: string): DriverSpecification | null {
  return DRIVER_SPECS.find((driver) => driver.model === model) || null;
}
