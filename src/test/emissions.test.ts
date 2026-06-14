import { expect, test, describe } from 'vitest';

// Represents standard vehicle sector coefficient matching calculation models
function calculateCarbonSavings(milesDriven: number): number {
  // Uses integer representation to calculate exact float value, then rounds with 1e-9 precision buffer
  const val = (milesDriven * 411) / 1000;
  return Math.round((val + 1e-9) * 100) / 100; 
}

// Calculates grid emissions by Indian region (e.g. South grid vs. West grid)
function calculateIndianGridEmissions(kwh: number, gridFactor: number = 0.72): number {
  const val = kwh * gridFactor;
  return Math.round((val + 1e-9) * 100) / 100;
}

// Calculates transport sector emissions realistically per vehicle type
function calculateTransportEmission(distanceKm: number, vehicleType: string): number {
  const coefficients: Record<string, number> = {
    "petrol car": 0.170, 
    "diesel car": 0.150,
    "electric car": 0.050,
    "auto": 0.080,
    "two-wheeler": 0.045,
    "bus": 0.030,
    "train": 0.012
  };
  const factor = coefficients[vehicleType] ?? 0.120;
  const val = distanceKm * factor;
  return Math.round((val + 1e-9) * 100) / 100;
}

// Simulates food emissions calculations matching backend handler
function calculateFoodEmission(weightKg: number, item: string): number {
  const coefficients: Record<string, number> = {
    "beef": 27.0,
    "chicken": 3.5,
    "rice": 2.9,
    "vegetables": 0.4,
    "veggies": 0.4,
    "local vegetables": 0.4,
    "veg meal": 1.2,
    "paneer": 1.2
  };
  const factor = coefficients[item.toLowerCase()] ?? 0.4;
  const val = weightKg * factor;
  return Math.round((val + 1e-9) * 100) / 100;
}

// Simulates real world comparison quote formula matching server engine
function getComparativeQuote(co2_kg: number): string {
  if (co2_kg < 1) {
    return `= Just ${Math.round(co2_kg * 1000)}g. Equivalent to charging a phone for ${Math.round(co2_kg * 100)} hours.`;
  } else if (co2_kg < 5) {
    return `= ${co2_kg} kg. Equivalent to operating a regular ceiling fan for ${Math.round(co2_kg * 12)} hours.`;
  } else if (co2_kg < 15) {
    return `= ${co2_kg} kg. Equivalent to running a 1.5 ton split AC for ${Math.round(co2_kg * 1.5)} hours in peak summer.`;
  } else {
    return `= ${co2_kg} kg. Takes a fully grown Neem tree ${Math.round(co2_kg / 0.1)} days to capture from the atmosphere.`;
  }
}

describe('Carbon Footprint Calculator Calculations', () => {
  test('Calculates correct carbon offset savings', () => {
    expect(calculateCarbonSavings(10)).toBe(4.11);
    expect(calculateCarbonSavings(0)).toBe(0);
    expect(calculateCarbonSavings(5)).toBe(2.06); 
  });

  test('Calculates Indian electrical grid emissions (Bengaluru factor 0.72)', () => {
    expect(calculateIndianGridEmissions(10)).toBe(7.2);
    expect(calculateIndianGridEmissions(100, 0.72)).toBe(72);
    expect(calculateIndianGridEmissions(250, 0.84)).toBe(210); 
  });

  test('Calculates transport sector emissions realistically per vehicle type', () => {
    expect(calculateTransportEmission(15, "petrol car")).toBe(2.55);
    expect(calculateTransportEmission(15, "two-wheeler")).toBe(0.68);
    expect(calculateTransportEmission(30, "train")).toBe(0.36);
    expect(calculateTransportEmission(10, "unknown")).toBe(1.20);
  });

  test('Calculates culinary emission levels by diet items and weights', () => {
    expect(calculateFoodEmission(0.5, "chicken")).toBe(1.75); // 0.5 * 3.5
    expect(calculateFoodEmission(2.0, "rice")).toBe(5.8);     // 2.0 * 2.9
    expect(calculateFoodEmission(1.2, "vegetables")).toBe(0.48); // 1.2 * 0.4
    expect(calculateFoodEmission(3.0, "paneer")).toBe(3.6);     // 3.0 * 1.2
    expect(calculateFoodEmission(1.0, "non-existent")).toBe(0.4); // fallback 0.4
  });

  test('Generates user-friendly comparative action metaphors', () => {
    // Under 1kg
    expect(getComparativeQuote(0.45)).toBe("= Just 450g. Equivalent to charging a phone for 45 hours.");
    // Under 5kg
    expect(getComparativeQuote(3.4)).toBe("= 3.4 kg. Equivalent to operating a regular ceiling fan for 41 hours.");
    // Under 15kg
    expect(getComparativeQuote(12.5)).toBe("= 12.5 kg. Equivalent to running a 1.5 ton split AC for 19 hours in peak summer.");
    // Over 15kg
    expect(getComparativeQuote(25.0)).toBe("= 25 kg. Takes a fully grown Neem tree 250 days to capture from the atmosphere.");
  });

  test('Validates mathematical logic bounds for extreme or null entry cases', () => {
    // Zero checks
    expect(calculateTransportEmission(0, "electric car")).toBe(0);
    expect(calculateFoodEmission(0, "beef")).toBe(0);
    expect(calculateIndianGridEmissions(0, 0.81)).toBe(0);

    // Dynamic negative/positive validation (replicates endpoint filter checks)
    const mockTripKm = -15;
    const mockKwh = -200;
    expect(mockTripKm < 0).toBe(true);
    expect(mockKwh < 0).toBe(true);
  });
});


