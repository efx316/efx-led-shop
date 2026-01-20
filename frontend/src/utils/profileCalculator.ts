/**
 * Profile Calculator Utility
 * Handles aluminum profile per-meter sales with cutting fees and offcut calculations
 */

export interface ProfileCalculation {
  baseMeters: number; // How many 1m lengths to purchase
  cuts: Array<{ length: number; quantity: number }>;
  cuttingFee: number; // $5.50 per cut
  offcuts: Array<{ length: number }>;
  totalCost: number;
  totalCuttingFees: number;
}

/**
 * Calculate profile requirements for a given length needed
 * 
 * @param requiredLength - Total length needed in meters (e.g., 2.25m)
 * @param cutLengths - Array of specific cuts needed [{length: 2.25, quantity: 1}]
 * @param pricePerMeter - Price per meter of profile
 * @param cuttingFeePerCut - Cutting fee per cut (default $5.50)
 * @returns ProfileCalculation with all details
 */
export function calculateProfileRequirements(
  requiredLength: number,
  cutLengths: Array<{ length: number; quantity: number }>,
  pricePerMeter: number,
  cuttingFeePerCut: number = 5.50
): ProfileCalculation {
  // Calculate total length needed from cut lengths
  const totalRequiredLength = cutLengths.reduce(
    (sum, cut) => sum + cut.length * cut.quantity,
    0
  );

  // If cutLengths provided, use that; otherwise use requiredLength
  const lengthToUse = cutLengths.length > 0 ? totalRequiredLength : requiredLength;

  // Calculate how many 1m base lengths to buy
  const baseMeters = Math.ceil(lengthToUse);

  // Calculate total number of cuts needed
  // Each cut requires one cut operation (except the first piece from each base meter)
  let totalCuts = 0;
  const offcuts: Array<{ length: number }> = [];
  let remainingBaseLength = baseMeters;

  // Process each cut requirement
  for (const cut of cutLengths) {
    for (let i = 0; i < cut.quantity; i++) {
      if (remainingBaseLength >= cut.length) {
        // We can get this cut from current base length
        remainingBaseLength -= cut.length;
        totalCuts += 1; // One cut to create this piece
        
        // If there's remaining length from this base, it becomes an offcut
        if (remainingBaseLength > 0) {
          offcuts.push({ length: remainingBaseLength });
          remainingBaseLength = 0; // Start fresh with next base meter
        }
      } else {
        // Need to use a new base meter
        if (remainingBaseLength > 0) {
          // Previous base meter had leftover, add as offcut
          offcuts.push({ length: remainingBaseLength });
        }
        // Use new base meter for this cut
        remainingBaseLength = baseMeters - cut.length;
        totalCuts += 1;
        
        // If there's remaining, it becomes an offcut
        if (remainingBaseLength > 0) {
          offcuts.push({ length: remainingBaseLength });
          remainingBaseLength = 0;
        }
      }
    }
  }

  // If no cut lengths specified, treat as one continuous length
  if (cutLengths.length === 0 && requiredLength > 0) {
    totalCuts = 1; // One cut to create the required length
    const offcutLength = baseMeters - requiredLength;
    if (offcutLength > 0) {
      offcuts.push({ length: offcutLength });
    }
  }

  // Calculate costs
  const totalCuttingFees = totalCuts * cuttingFeePerCut;
  const baseCost = baseMeters * pricePerMeter;
  const totalCost = baseCost + totalCuttingFees;

  return {
    baseMeters,
    cuts: cutLengths.length > 0 ? cutLengths : [{ length: requiredLength, quantity: 1 }],
    cuttingFee: cuttingFeePerCut,
    offcuts: offcuts.filter(offcut => offcut.length > 0), // Filter out zero-length offcuts
    totalCost,
    totalCuttingFees,
  };
}

/**
 * Format length for display (meters or millimeters)
 */
export function formatLength(length: number, unit: 'meters' | 'millimeters' = 'meters'): string {
  if (unit === 'millimeters') {
    return `${Math.round(length * 1000)}mm`;
  }
  if (length < 1) {
    return `${Math.round(length * 1000)}mm`;
  }
  return `${length.toFixed(2)}m`;
}
