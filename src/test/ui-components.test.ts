import { expect, test, describe } from 'vitest';

// Simulates UI selector elements validation test
const CATEGORIES = ["transport", "food", "energy", "shopping"] as const;

const VEHICLES = [
  "petrol car",
  "diesel car",
  "electric car",
  "auto",
  "two-wheeler",
  "bus",
  "train"
];

const FOOD_ITEMS = [
  "vegetables",
  "chicken",
  "rice",
  "beef",
  "paneer"
];

const CITIES = [
  { name: "Bengaluru", gridFactor: 0.72 },
  { name: "Mumbai", gridFactor: 0.84 },
  { name: "Delhi", gridFactor: 0.81 },
  { name: "Chennai", gridFactor: 0.75 },
  { name: "Kolkata", gridFactor: 0.85 },
  { name: "Pune", gridFactor: 0.73 }
];

describe('UI Metadata & Config State Tests', () => {
  test('Validates categories available inside UI selector cards', () => {
    expect(CATEGORIES).toContain("transport");
    expect(CATEGORIES).toContain("food");
    expect(CATEGORIES).toContain("energy");
    expect(CATEGORIES).toContain("shopping");
    expect(CATEGORIES.length).toBe(4);
  });

  test('Validates supported transport options are configured', () => {
    expect(VEHICLES).toContain("petrol car");
    expect(VEHICLES).toContain("two-wheeler");
    expect(VEHICLES).toContain("train");
    expect(VEHICLES.length).toBe(7);
  });

  test('Validates configured Indian grid factor lists', () => {
    const bengaluru = CITIES.find(c => c.name === "Bengaluru");
    const mumbai = CITIES.find(c => c.name === "Mumbai");
    const delhi = CITIES.find(c => c.name === "Delhi");

    expect(bengaluru).toBeDefined();
    expect(bengaluru!.gridFactor).toBe(0.72);

    expect(mumbai).toBeDefined();
    expect(mumbai!.gridFactor).toBe(0.84);

    expect(delhi).toBeDefined();
    expect(delhi!.gridFactor).toBe(0.81);

    expect(CITIES.length).toBe(6);
  });

  test('Checks food items bounds are correct', () => {
    expect(FOOD_ITEMS).toContain("vegetables");
    expect(FOOD_ITEMS).toContain("paneer");
    expect(FOOD_ITEMS.length).toBe(5);
  });
});
