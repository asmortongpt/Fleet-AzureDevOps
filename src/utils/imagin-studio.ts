/**
 * IMAGIN.studio CDN URL Builder
 *
 * Constructs URLs for vehicle reference images from IMAGIN.studio's public CDN.
 * No API key needed — uses the `customer=img` public demo tier.
 *
 * Example URL:
 *   https://cdn.imagin.studio/getimage?customer=img&make=Ford&modelFamily=F-150&modelYear=2024&angle=01&width=800
 */

export type ImaginAngleId = '01' | '02' | '03' | '09' | '13' | '29';

export interface ImaginAngle {
  id: ImaginAngleId;
  label: string;
  shortLabel: string;
}

export const IMAGIN_ANGLES: ImaginAngle[] = [
  { id: '01', label: 'Front Quarter', shortLabel: 'FrQ' },
  { id: '02', label: 'Side', shortLabel: 'Side' },
  { id: '03', label: 'Rear Quarter', shortLabel: 'ReQ' },
  { id: '09', label: 'Front', shortLabel: 'Fr' },
  { id: '13', label: 'Rear', shortLabel: 'Re' },
  { id: '29', label: 'Top Down', shortLabel: 'Top' },
];

const MAKE_OVERRIDES: Record<string, string> = {
  'mercedes-benz': 'Mercedes-Benz',
  'mercedes_benz': 'Mercedes-Benz',
  'mercedes': 'Mercedes-Benz',
  'gmc': 'GMC',
  'bmw': 'BMW',
  'ram': 'Ram',
  'jcb': 'JCB',
};

const MODEL_OVERRIDES: Record<string, string> = {
  'f_150': 'F-150',
  'f_250': 'F-250',
  'f_350': 'F-350',
  'f150': 'F-150',
  'f250': 'F-250',
  'f350': 'F-350',
  'f-150': 'F-150',
  'f-250': 'F-250',
  'f-350': 'F-350',
  'cr_v': 'CR-V',
  'cr-v': 'CR-V',
  'crv': 'CR-V',
  'model_3': 'Model 3',
  'model_s': 'Model S',
  'model_y': 'Model Y',
  'model_x': 'Model X',
  'e_transit': 'E-Transit',
  'e-transit': 'E-Transit',
  'bolt_ev': 'Bolt EV',
  'bolt_euv': 'Bolt EUV',
  'silverado_1500': 'Silverado 1500',
  'silverado_2500': 'Silverado 2500',
  'sierra_1500': 'Sierra 1500',
  'sierra_2500': 'Sierra 2500',
  'sierra_2500hd': 'Sierra 2500HD',
  'promaster_1500': 'ProMaster 1500',
  'promaster_2500': 'ProMaster 2500',
  'sprinter_2500': 'Sprinter 2500',
  'sprinter_3500': 'Sprinter 3500',
  'transit_250': 'Transit 250',
  'transit_350': 'Transit 350',
  'transit_connect': 'Transit Connect',
  'pickup_1500': '1500',
  'pickup_2500': '2500',
  'express_2500': 'Express 2500',
  'express_3500': 'Express 3500',
  '4runner': '4Runner',
};

/**
 * Normalize make/model strings for the IMAGIN.studio API.
 * Returns `{ make, model }` with correct casing/formatting.
 */
export function normalizeForImagin(
  rawMake: string,
  rawModel: string
): { make: string; model: string } {
  const makeLower = rawMake.toLowerCase().trim();
  const modelLower = rawModel.toLowerCase().trim().replace(/\s+/g, '_');

  // Make
  const make =
    MAKE_OVERRIDES[makeLower] ||
    rawMake.charAt(0).toUpperCase() + rawMake.slice(1);

  // Model — check overrides first, then title-case
  const model =
    MODEL_OVERRIDES[modelLower] ||
    rawModel
      .split(/[\s_-]+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  return { make, model };
}

/**
 * Build a single IMAGIN.studio CDN URL.
 */
export function buildImaginUrl(
  rawMake: string,
  rawModel: string,
  year: number,
  angle: ImaginAngleId = '01',
  width: number = 800
): string {
  const { make, model } = normalizeForImagin(rawMake, rawModel);

  const params = new URLSearchParams({
    customer: 'img',
    make,
    modelFamily: model,
    modelYear: String(year),
    angle,
    width: String(width),
  });

  return `https://cdn.imagin.studio/getimage?${params.toString()}`;
}

/**
 * Build URLs for all 6 standard angles.
 */
export function buildImaginAngleSet(
  rawMake: string,
  rawModel: string,
  year: number,
  width: number = 800
): Record<ImaginAngleId, string> {
  const result = {} as Record<ImaginAngleId, string>;
  for (const angle of IMAGIN_ANGLES) {
    result[angle.id] = buildImaginUrl(rawMake, rawModel, year, angle.id, width);
  }
  return result;
}
