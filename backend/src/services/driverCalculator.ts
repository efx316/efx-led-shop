import { listCatalogItems, LEDProduct } from './squareCatalogSync.js';

export interface DriverRecommendation {
  catalogObjectId: string;
  name: string;
  wattage: number;
  voltage: string;
  price?: number;
  reason: string;
}

export interface DriverCalculationInput {
  totalWatts: number;
  voltage: string;
  safetyMargin?: number;
}

export async function calculateDriverRecommendation(
  input: DriverCalculationInput
): Promise<DriverRecommendation | null> {
  const safetyMargin = input.safetyMargin || 1.2;
  const requiredWatts = input.totalWatts * safetyMargin;

  const products = await listCatalogItems();
  const drivers = products.filter(product => {
    const name = product.name.toLowerCase();
    return (
      name.includes('driver') ||
      name.includes('power supply') ||
      name.includes('transformer') ||
      name.includes('adapter')
    );
  });

  if (drivers.length === 0) {
    return null;
  }

  const voltageCompatibleDrivers = drivers.filter(driver => {
    const driverVoltage = driver.attributes.voltage?.toLowerCase() || '';
    const requiredVoltage = input.voltage.toLowerCase();
    return driverVoltage.includes(requiredVoltage) || 
           requiredVoltage.includes(driverVoltage) ||
           driverVoltage === 'universal';
  });

  if (voltageCompatibleDrivers.length === 0) {
    return findBestDriver(drivers, requiredWatts, input.voltage);
  }

  const suitableDrivers = voltageCompatibleDrivers
    .filter(driver => {
      const driverWattage = extractWattage(driver);
      return driverWattage >= requiredWatts && driverWattage <= requiredWatts * 2;
    })
    .sort((a, b) => {
      const wattageA = extractWattage(a);
      const wattageB = extractWattage(b);
      return wattageA - wattageB;
    });

  if (suitableDrivers.length > 0) {
    const driver = suitableDrivers[0];
    const driverWattage = extractWattage(driver);
    return {
      catalogObjectId: driver.id,
      name: driver.name,
      wattage: driverWattage,
      voltage: driver.attributes.voltage || input.voltage,
      price: driver.price,
      reason: `Recommended ${driverWattage}W driver for ${input.totalWatts.toFixed(1)}W system (${(safetyMargin * 100).toFixed(0)}% safety margin)`,
    };
  }

  return findBestDriver(voltageCompatibleDrivers, requiredWatts, input.voltage);
}

function extractWattage(product: LEDProduct): number {
  const name = product.name;
  const wattageMatch = name.match(/(\d+)\s*W/i);
  if (wattageMatch) {
    return parseInt(wattageMatch[1], 10);
  }
  if (product.attributes.wattPerMeter) {
    return product.attributes.wattPerMeter * 10;
  }
  return 100;
}

function findBestDriver(
  drivers: LEDProduct[],
  requiredWatts: number,
  voltage: string
): DriverRecommendation | null {
  if (drivers.length === 0) {
    return null;
  }

  const sorted = drivers
    .map(driver => ({
      driver,
      wattage: extractWattage(driver),
    }))
    .filter(d => d.wattage >= requiredWatts)
    .sort((a, b) => a.wattage - b.wattage);

  if (sorted.length === 0) {
    const largest = drivers
      .map(driver => ({
        driver,
        wattage: extractWattage(driver),
      }))
      .sort((a, b) => b.wattage - a.wattage)[0];

    return {
      catalogObjectId: largest.driver.id,
      name: largest.driver.name,
      wattage: largest.wattage,
      voltage: largest.driver.attributes.voltage || voltage,
      price: largest.driver.price,
      reason: `Largest available driver (${largest.wattage}W). System requires ${requiredWatts.toFixed(1)}W - may need multiple drivers.`,
    };
  }

  const best = sorted[0];
  return {
    catalogObjectId: best.driver.id,
    name: best.driver.name,
    wattage: best.wattage,
    voltage: best.driver.attributes.voltage || voltage,
    price: best.driver.price,
    reason: `Recommended ${best.wattage}W driver for ${requiredWatts.toFixed(1)}W system`,
  };
}

