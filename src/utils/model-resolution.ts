/**
 * Model Resolution — shared utility for mapping vehicle make/model to local GLB files.
 * Used by VehicleShowroom3D and FleetGalleryGrid.
 */

export interface ModelResolution {
  url: string;
  isExactMatch: boolean;
  matchedModelName: string | null; // e.g., "Ram 1500" when approximating RAM 2500
}

/** Extract a display name from a GLB path, e.g. "/models/vehicles/trucks/ram_1500.glb" → "Ram 1500" */
export function glbToDisplayName(url: string): string {
  const filename = url.split('/').pop()?.replace('.glb', '') || '';
  return filename
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function resolveLocalModelUrl(make: string, model: string, vehicleType?: string): ModelResolution {
  const normalizedMake = make.toLowerCase().replace(/[-\s]/g, '_');
  const normalizedModel = model.toLowerCase().replace(/[-\s]/g, '_');

  const modelMappings: Record<string, string> = {
    // ── Trucks (exact + closest-match fallbacks) ──
    'ford_f_150': '/models/vehicles/trucks/ford_f_150.glb',
    'ford_f_250': '/models/vehicles/trucks/ford_f_250.glb',
    'ford_f_350': '/models/vehicles/trucks/ford_f_250.glb',
    'ford_f150': '/models/vehicles/trucks/ford_f_150.glb',
    'ford_f_150_lightning': '/models/vehicles/trucks/ford_f_150.glb',
    'ford_ranger': '/models/vehicles/trucks/ford_f_150.glb',
    'chevrolet_silverado': '/models/vehicles/trucks/chevrolet_silverado.glb',
    'chevrolet_silverado_1500': '/models/vehicles/trucks/chevrolet_silverado.glb',
    'chevrolet_silverado_2500': '/models/vehicles/trucks/chevrolet_silverado.glb',
    'chevrolet_colorado': '/models/vehicles/trucks/chevrolet_colorado.glb',
    'ram_1500': '/models/vehicles/trucks/ram_1500.glb',
    'ram_2500': '/models/vehicles/trucks/ram_1500.glb',
    'ram_3500': '/models/vehicles/trucks/ram_1500.glb',
    'ram_pickup_1500': '/models/vehicles/trucks/ram_1500.glb',
    'ram_pickup_2500': '/models/vehicles/trucks/ram_1500.glb',
    'toyota_tacoma': '/models/vehicles/trucks/toyota_tacoma.glb',
    'toyota_tundra': '/models/vehicles/trucks/toyota_tacoma.glb',
    'nissan_titan': '/models/vehicles/trucks/toyota_tacoma.glb',
    'gmc_sierra': '/models/vehicles/trucks/gmc_sierra.glb',
    'gmc_sierra_1500': '/models/vehicles/trucks/gmc_sierra.glb',
    'gmc_sierra_2500': '/models/vehicles/trucks/gmc_sierra.glb',
    'gmc_sierra_2500hd': '/models/vehicles/trucks/gmc_sierra.glb',
    'freightliner_cascadia': '/models/vehicles/trucks/freightliner_cascadia.glb',
    'kenworth_t680': '/models/vehicles/trucks/kenworth_t680.glb',
    'kenworth_w990': '/models/vehicles/trucks/kenworth_t680.glb',
    'mack_anthem': '/models/vehicles/trucks/mack_anthem.glb',
    'peterbilt_579': '/models/vehicles/construction/peterbilt_567.glb',
    // ── Vans ──
    'ford_transit': '/models/vehicles/vans/ford_transit.glb',
    'ford_transit_250': '/models/vehicles/vans/ford_transit.glb',
    'ford_transit_350': '/models/vehicles/vans/ford_transit.glb',
    'ford_transit_connect': '/models/vehicles/vans/ford_transit.glb',
    'ford_e_transit': '/models/vehicles/vans/ford_transit.glb',
    'mercedes_benz_sprinter': '/models/vehicles/vans/mercedes_benz_sprinter.glb',
    'mercedes_sprinter_2500': '/models/vehicles/vans/mercedes_benz_sprinter.glb',
    'mercedes_sprinter_3500': '/models/vehicles/vans/mercedes_benz_sprinter.glb',
    'ram_promaster': '/models/vehicles/vans/ram_promaster.glb',
    'ram_promaster_1500': '/models/vehicles/vans/ram_promaster.glb',
    'ram_promaster_2500': '/models/vehicles/vans/ram_promaster.glb',
    'nissan_nv3500': '/models/vehicles/vans/nissan_nv3500.glb',
    'chevrolet_express': '/models/vehicles/vans/nissan_nv3500.glb',
    'chevrolet_express_2500': '/models/vehicles/vans/nissan_nv3500.glb',
    'chevrolet_express_3500': '/models/vehicles/vans/nissan_nv3500.glb',
    // ── Sedans ──
    'toyota_camry': '/models/vehicles/sedans/toyota_camry.glb',
    'toyota_corolla': '/models/vehicles/sedans/toyota_corolla.glb',
    'toyota_prius': '/models/vehicles/sedans/toyota_corolla.glb',
    'honda_accord': '/models/vehicles/sedans/honda_accord.glb',
    'honda_civic': '/models/vehicles/sedans/honda_accord.glb',
    'nissan_altima': '/models/vehicles/sedans/nissan_altima.glb',
    'hyundai_elantra': '/models/vehicles/sedans/toyota_corolla.glb',
    'kia_forte': '/models/vehicles/sedans/toyota_corolla.glb',
    'chevrolet_malibu': '/models/vehicles/sedans/toyota_camry.glb',
    'ford_fusion': '/models/vehicles/sedans/toyota_camry.glb',
    'tesla_model_3': '/models/vehicles/electric_sedans/tesla_model_3.glb',
    'tesla_model_s': '/models/vehicles/sedans/tesla_model_s.glb',
    'chevrolet_bolt_euv': '/models/vehicles/electric_sedans/chevrolet_bolt_ev.glb',
    'chevrolet_bolt_ev': '/models/vehicles/electric_sedans/chevrolet_bolt_ev.glb',
    'nissan_leaf': '/models/vehicles/electric_sedans/chevrolet_bolt_ev.glb',
    // ── SUVs ──
    'chevrolet_tahoe': '/models/vehicles/suvs/chevrolet_tahoe.glb',
    'chevrolet_suburban': '/models/vehicles/suvs/chevrolet_tahoe.glb',
    'ford_explorer': '/models/vehicles/suvs/ford_explorer.glb',
    'ford_expedition': '/models/vehicles/suvs/ford_explorer.glb',
    'honda_cr_v': '/models/vehicles/suvs/honda_cr_v.glb',
    'jeep_wrangler': '/models/vehicles/suvs/jeep_wrangler.glb',
    'tesla_model_y': '/models/vehicles/electric_suvs/tesla_model_y.glb',
    'tesla_model_x': '/models/vehicles/suvs/tesla_model_x.glb',
    'gmc_yukon': '/models/vehicles/suvs/chevrolet_tahoe.glb',
    'toyota_4runner': '/models/vehicles/suvs/jeep_wrangler.glb',
    'toyota_sequoia': '/models/vehicles/suvs/chevrolet_tahoe.glb',
    'nissan_armada': '/models/vehicles/suvs/chevrolet_tahoe.glb',
    'dodge_durango': '/models/vehicles/suvs/ford_explorer.glb',
    // ── Electric ──
    'blue_bird_vision': '/models/vehicles/vans/ford_transit.glb',
    // ── Construction & Heavy Equipment ──
    'caterpillar_320': '/models/vehicles/construction/caterpillar_320.glb',
    'john_deere_200g': '/models/vehicles/construction/john_deere_200g.glb',
    'komatsu_pc210': '/models/vehicles/construction/komatsu_pc210.glb',
    'volvo_ec220': '/models/vehicles/construction/volvo_ec220.glb',
    'volvo_a40f': '/models/vehicles/construction/volvo_ec220.glb',
    'hitachi_zx210': '/models/vehicles/construction/hitachi_zx210.glb',
    'kenworth_t880': '/models/vehicles/construction/kenworth_t880.glb',
    'peterbilt_567': '/models/vehicles/construction/peterbilt_567.glb',
    'mack_granite': '/models/vehicles/construction/mack_granite.glb',
    'jcb_3cx': '/models/vehicles/construction/john_deere_200g.glb',
    'bobcat_s570': '/models/vehicles/construction/caterpillar_320.glb',
    // ── Altech fleet ──
    'altech_st_200_service': '/models/vehicles/trucks/altech_st_200_service.glb',
    'altech_fh_250_flatbed': '/models/vehicles/trucks/altech_fh_250_flatbed.glb',
    'altech_fh_300_flatbed': '/models/vehicles/trucks/altech_fh_300_flatbed.glb',
    'altech_hd_40_dump': '/models/vehicles/construction/altech_hd_40_dump_truck.glb',
    'altech_wt_2000_water': '/models/vehicles/trucks/altech_wt_2000_water.glb',
    'altech_fl_1500_fuel_lube': '/models/vehicles/trucks/altech_fl_1500_fuel_lube.glb',
    'altech_cm_3000_mixer': '/models/vehicles/construction/altech_cm_3000_mixer.glb',
    'altech_ah_350_hauler': '/models/vehicles/construction/altech_ah_350_hauler.glb',
  };

  function classify(url: string, requestedKey: string): ModelResolution {
    const filename = url.split('/').pop()?.replace('.glb', '') || '';
    const isExact = filename === requestedKey || filename === normalizedModel;
    return {
      url,
      isExactMatch: isExact,
      matchedModelName: isExact ? null : glbToDisplayName(url),
    };
  }

  const exactKey = `${normalizedMake}_${normalizedModel}`;
  if (modelMappings[exactKey]) return classify(modelMappings[exactKey], exactKey);
  if (modelMappings[normalizedModel]) return classify(modelMappings[normalizedModel], exactKey);

  for (const [key, url] of Object.entries(modelMappings)) {
    if (key.includes(normalizedMake) && key.includes(normalizedModel.split('_')[0])) {
      return classify(url, exactKey);
    }
  }

  const typeDefaults: Record<string, string> = {
    truck: '/models/vehicles/trucks/ford_f_150.glb',
    pickup: '/models/vehicles/trucks/ford_f_150.glb',
    pickup_truck: '/models/vehicles/trucks/ford_f_150.glb',
    van: '/models/vehicles/vans/ford_transit.glb',
    cargo_van: '/models/vehicles/vans/ford_transit.glb',
    suv: '/models/vehicles/suvs/ford_explorer.glb',
    sedan: '/models/vehicles/sedans/toyota_camry.glb',
    car: '/models/vehicles/sedans/toyota_camry.glb',
    bus: '/models/vehicles/vans/ford_transit.glb',
    electric: '/models/vehicles/electric_sedans/tesla_model_3.glb',
    ev: '/models/vehicles/electric_sedans/tesla_model_3.glb',
    semi: '/models/vehicles/trucks/freightliner_cascadia.glb',
    semi_truck: '/models/vehicles/trucks/freightliner_cascadia.glb',
    heavy_truck: '/models/vehicles/trucks/freightliner_cascadia.glb',
    equipment: '/models/vehicles/construction/caterpillar_320.glb',
    construction: '/models/vehicles/construction/caterpillar_320.glb',
    excavator: '/models/vehicles/construction/caterpillar_320.glb',
    trailer: '/models/vehicles/trailers/utility_3000r.glb',
  };

  if (vehicleType && typeDefaults[vehicleType]) {
    return { url: typeDefaults[vehicleType], isExactMatch: false, matchedModelName: glbToDisplayName(typeDefaults[vehicleType]) };
  }
  return { url: '/models/vehicles/trucks/sample_truck.glb', isExactMatch: false, matchedModelName: 'Sample Truck' };
}
