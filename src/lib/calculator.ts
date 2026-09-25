/**
 * Indicative solar sizing model — V1.
 * Every number here is an ASSUMPTION, surfaced and editable in the UI.
 * Nothing produced by this module is a guaranteed output or a firm price.
 */

export type PropertyType = "residential" | "commercial" | "industrial";

export interface CalculatorAssumptions {
  /** Units (kWh) generated per kW of installed capacity per day. */
  unitsPerKwPerDay: number;
  /** Indicative turnkey system cost per kW, before subsidy, incl. taxes. */
  costPerKw: number;
  /** Effective electricity tariff paid per unit today. */
  tariffPerUnit: number;
  /** Wattage of a single module used for the panel-count estimate. */
  panelWattage: number;
  /** Shade-free roof area required per kW of capacity (sq ft). */
  areaPerKw: number;
}

export const DEFAULT_ASSUMPTIONS: Record<PropertyType, CalculatorAssumptions> = {
  residential: {
    unitsPerKwPerDay: 4,
    costPerKw: 60000,
    tariffPerUnit: 8,
    panelWattage: 550,
    areaPerKw: 80,
  },
  commercial: {
    unitsPerKwPerDay: 4,
    costPerKw: 48000,
    tariffPerUnit: 9,
    panelWattage: 550,
    areaPerKw: 75,
  },
  industrial: {
    unitsPerKwPerDay: 4,
    costPerKw: 42000,
    tariffPerUnit: 9,
    panelWattage: 585,
    areaPerKw: 70,
  },
};

export interface CalculatorInput {
  propertyType: PropertyType;
  /** Average monthly consumption in units (kWh). */
  monthlyUnits?: number | null;
  /** Average monthly electricity bill in rupees. */
  monthlyBill?: number | null;
  /** Available shade-free roof area in sq ft. */
  roofAreaSqft?: number | null;
  assumptions: CalculatorAssumptions;
}

export interface CalculatorResult {
  /** Units used for sizing, either entered or derived from the bill. */
  targetMonthlyUnits: number;
  unitsDerivedFromBill: boolean;
  /** Capacity required to cover the target consumption. */
  requiredKw: number;
  /** Capacity that actually fits the stated roof area, when provided. */
  recommendedKw: number;
  areaLimited: boolean;
  monthlyGenerationUnits: number;
  annualGenerationUnits: number;
  panelCount: number;
  areaNeededSqft: number;
  indicativeSystemCost: number;
  indicativeMonthlySaving: number;
  indicativeAnnualSaving: number;
  simplePaybackYears: number | null;
  offsetPercent: number | null;
}


/** PM Surya Ghar CFA estimate for eligible residential rooftop systems. */
export function calculatePmSuryaGharCfa(systemKw: number): number {
  if (!Number.isFinite(systemKw) || systemKw <= 0) return 0;
  return Math.round(Math.min(systemKw, 2) * 30_000 + Math.min(Math.max(systemKw - 2, 0), 1) * 18_000);
}

/** Standard reducing-balance monthly EMI; returns 0 for invalid loan inputs. */
export function calculateLoanEmi(principal: number, annualRatePercent: number, termYears: number): number {
  if (!Number.isFinite(principal) || principal <= 0 || !Number.isFinite(annualRatePercent) || annualRatePercent < 0 || !Number.isFinite(termYears) || termYears <= 0) return 0;
  const months = termYears * 12;
  const monthlyRate = annualRatePercent / 1200;
  return monthlyRate === 0 ? principal / months : (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
}

/** CEA Version 22.0 weighted-average Indian grid factor, FY 2025–26. */
export const INDIA_GRID_TCO2_PER_MWH = 0.675;

function roundKw(kw: number) {
  if (kw <= 0) return 0;
  if (kw < 10) return Math.ceil(kw * 2) / 2; // round up to 0.5 kW
  return Math.ceil(kw);
}

export function calculateSystem(input: CalculatorInput): CalculatorResult | null {
  const a = input.assumptions;
  if (Object.values(a).some((v) => !Number.isFinite(v) || v <= 0)) return null;
  if (
    [input.monthlyBill, input.monthlyUnits, input.roofAreaSqft].some(
      (v) => v != null && (!Number.isFinite(v) || v < 0),
    )
  )
    return null;
  const bill = input.monthlyBill && input.monthlyBill > 0 ? input.monthlyBill : null;
  const entered = input.monthlyUnits && input.monthlyUnits > 0 ? input.monthlyUnits : null;

  const unitsDerivedFromBill = entered === null && bill !== null;
  const targetMonthlyUnits = entered ?? (bill !== null ? bill / a.tariffPerUnit : 0);
  if (!targetMonthlyUnits || targetMonthlyUnits <= 0) return null;

  const monthlyUnitsPerKw = a.unitsPerKwPerDay * 30;
  const requiredKw = roundKw(targetMonthlyUnits / monthlyUnitsPerKw);

  const areaKwCap =
    input.roofAreaSqft != null ? Math.floor((input.roofAreaSqft / a.areaPerKw) * 2) / 2 : null;
  const areaLimited = areaKwCap !== null && areaKwCap < requiredKw;
  const recommendedKw = Math.max(areaLimited ? (areaKwCap as number) : requiredKw, 0);

  const monthlyGenerationUnits = recommendedKw * monthlyUnitsPerKw;
  const annualGenerationUnits = monthlyGenerationUnits * 12;
  const panelCount = recommendedKw > 0 ? Math.ceil((recommendedKw * 1000) / a.panelWattage) : 0;
  const areaNeededSqft = Math.round(recommendedKw * a.areaPerKw);
  const indicativeSystemCost = Math.round(recommendedKw * a.costPerKw);
  const offsetUnits = Math.min(monthlyGenerationUnits, targetMonthlyUnits);
  const indicativeMonthlySaving = Math.round(offsetUnits * a.tariffPerUnit);
  const indicativeAnnualSaving = indicativeMonthlySaving * 12;
  const simplePaybackYears =
    indicativeAnnualSaving > 0 ? indicativeSystemCost / indicativeAnnualSaving : null;

  return {
    targetMonthlyUnits: Math.round(targetMonthlyUnits),
    unitsDerivedFromBill,
    requiredKw,
    recommendedKw,
    areaLimited,
    monthlyGenerationUnits: Math.round(monthlyGenerationUnits),
    annualGenerationUnits: Math.round(annualGenerationUnits),
    panelCount,
    areaNeededSqft,
    indicativeSystemCost,
    indicativeMonthlySaving,
    indicativeAnnualSaving,
    simplePaybackYears: simplePaybackYears ? Math.round(simplePaybackYears * 10) / 10 : null,
    offsetPercent:
      targetMonthlyUnits > 0
        ? Math.min(100, Math.round((monthlyGenerationUnits / targetMonthlyUnits) * 100))
        : null,
  };
}
