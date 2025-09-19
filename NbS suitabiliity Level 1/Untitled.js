// =========================================
// This work contains multiple pieces of NBRACER AND DESIRMED
// In NBRACER, this is part of the operationalisation of level 1 of D5.1 framework
// It extends it implementation at the Biophysical Level for D5.3
// In DesirMED, this extends objective 3 of Task 4.1 (DOA); characterise ecosystem services of the 
// different Mediterranean regions to a more place-based NbS hotspots. Note that there are different scenarios, 
// (A) NbS hotspots with risk considerations and (B) NbS hotspots without risk.
// =========================================

// =========================================
// 1. Load all boundary levels
// =========================================
var adm0 = ee.FeatureCollection("projects/sat-io/open-datasets/geoboundaries/CGAZ_ADM0");
var adm1 = ee.FeatureCollection("projects/sat-io/open-datasets/geoboundaries/CGAZ_ADM1");
var adm2 = ee.FeatureCollection("projects/sat-io/open-datasets/geoboundaries/CGAZ_ADM2");

var cantabria = ee.FeatureCollection ('projects/ee-desmond/assets/France')


// =========================================
// Elevation, Slope, and Aspect
// =========================================

// Load SRTM elevation (30m)
var srtm = ee.Image('USGS/SRTMGL1_003')
  .clip(cantabria);

// Derive slope (degrees)
var slope = ee.Terrain.slope(srtm);

// Derive aspect (degrees from north)
var aspect = ee.Terrain.aspect(srtm);

// =========================================
// 5. Add layers to map
// =========================================
Map.addLayer(srtm, 
             {min: 0, max: 3000, palette: ["#004f37", "#1a7431", "#5aa469", "#b5c58f", "#f1e189", "#e8cda5", "#dfefff"]}, 
             'Elevation (m)');

Map.addLayer(slope, 
             {min: 0, max: 60, palette: ['white', 'yellow', 'red']}, 
             'Slope (degrees)');

Map.addLayer(aspect, 
             {min: 0, max: 360, palette: ['blue', 'green', 'yellow', 'red', 'blue']}, 
             'Aspect (degrees)');




// Load CORINE Land Cover 2018
var corine = ee.Image('COPERNICUS/CORINE/V20/100m/2018').select('landcover').clip(cantabria.geometry());
Map.addLayer(corine, {}, 'corine')

// FLOOD mitigation scores
var floodMitigationScore = {
  411: 0.95, // Inland marshes
  412: 0.95, // Peatbogs
  421: 0.75, // Salt marshes
  311: 0.75, // Broad-leaved forest
  312: 0.6,  // Coniferous forest
  213: 0.4,  // Rice fields
  244: 0.6,  // Agroforestry
  321: 0.6,  // Natural grasslands
  323: 0.75, // Sclerophyllous vegetation
  324: 0.4,  // Transitional woodland/shrub
  523: 0.9,  // Estuaries
  521: 0.75, // Coastal lagoons
  511: 0.4,  // Water courses
  141: 0.2,  // Green urban areas
  112: 0.1   // Discontinuous urban fabric
};

// FIRE mitigation scores
var fireMitigationScore = {
  231: 0.4,  // Pastures
  241: 0.3,  // Annual crops
  243: 0.4,  // Mosaic vegetation
  311: 0.2,  // Broad-leaved forest
  322: 0.5,  // Heathland
  324: 0.3,  // Transitional woodland/shrub
  411: 0.8,  // Inland marshes
  512: 0.9,  // Lakes
  141: 0.3,  // Green urban areas
  112: 0.2   // Discontinuous urban fabric
};

// DROUGHT mitigation scores
var droughtMitigationScore = {
  411: 0.95, // Inland marshes
  412: 0.95, // Peat bogs
  311: 0.8,  // Broad-leaved forest
  312: 0.7,  // Coniferous forest
  321: 0.6,  // Natural grasslands
  241: 0.75, // Agroforestry
  211: 0.2,  // Arable land
  142: 0.05, // Sports/leisure
  521: 0.7   // Coastal lagoons
};

// HEAT WAVE mitigation scores
var heatWaveMitigationScore = {
  311: 0.9,   // Broad-leaved forest – strong cooling
  312: 0.8,   // Coniferous forest
  313: 0.85,  // Mixed forest
  141: 0.6,   // Green urban areas – partial buffering
  142: 0.5,   // Sports/leisure
  112: 0.3,   // Discontinuous urban fabric
  243: 0.4,   // Mosaic vegetation
  321: 0.65,  // Natural grasslands
  324: 0.5,   // Transitional woodland/shrub
  322: 0.4,   // Heathland
  512: 0.8,   // Lakes – strong evap cooling
  411: 0.7    // Inland marshes – evapotranspiration
};


// EROSION mitigation scores
var erosionMitigationScore = {
  244: 0.6,   // Agroforestry – soil holding
  321: 0.6,   // Natural grasslands – cover vegetation
  323: 0.75,  // Sclerophyllous – deep root systems
  324: 0.4,   // Transitional woodland/shrub
  211: 0.2,   // Arable land – exposed soils
  243: 0.5,   // Mosaic crops/natural
  222: 0.25,  // Permanently irrigated – can prevent erosion if managed
  231: 0.3,   // Pastures
  312: 0.5,   // Coniferous forest
  311: 0.6,   // Broad-leaved forest
  313: 0.55   // Mixed forest
};



// Helper to remap CORINE codes to scores
function remapMitigation(image, scoreDict, newName) {
  var fromCodes = Object.keys(scoreDict).map(function(k) { return parseInt(k); });
  var toScores = fromCodes.map(function(k) { return scoreDict[k]; });
  return image.remap(fromCodes, toScores).rename(newName);
}

// Base score layers
var floodBase   = remapMitigation(corine, floodMitigationScore, 'Flood_Mitigation');
var fireBase    = remapMitigation(corine, fireMitigationScore, 'Fire_Mitigation');
var droughtBase = remapMitigation(corine, droughtMitigationScore, 'Drought_Mitigation');
var heatBase    = remapMitigation(corine, heatWaveMitigationScore, 'HeatWave_Mitigation');
var erosionBase = remapMitigation(corine, erosionMitigationScore, 'Erosion_Mitigation');

// =============================
// 4. Topographic data
// =============================
var srtm = ee.Image('USGS/SRTMGL1_003').clip(cantabria);
var slope = ee.Terrain.slope(srtm);
var aspect = ee.Terrain.aspect(srtm);

// Slope normalization (0–1)
var slopeNorm = slope.divide(60).clamp(0, 1);

// Aspect: northness and eastness (scale -1 to 1)
var aspectRad = aspect.multiply(Math.PI/180);
var northness = aspectRad.cos().unitScale(-1, 1); // 1=north, -1=south
var eastness  = aspectRad.sin().unitScale(-1, 1); // 1=east, -1=west

// Elevation zones: low (<300m), mid (300–800m), upland (>800m)
var elev = srtm;
var lowland = elev.lt(300);
var midland = elev.gte(300).and(elev.lte(800));
var upland  = elev.gt(800);

// Convert elevation zones to weights for each hazard
function elevWeight(hazard) {
  if (hazard === 'Flood') {
    // Flood mitigation is higher in lowlands, lower in uplands
    return lowland.multiply(1.1).add(midland.multiply(1.0)).add(upland.multiply(0.8));
  }
  if (hazard === 'Erosion') {
    // Erosion control is more valuable in uplands
    return lowland.multiply(0.9).add(midland.multiply(1.0)).add(upland.multiply(1.2));
  }
  if (hazard === 'Fire') {
    // Fire mitigation might be slightly higher in midlands/uplands
    return lowland.multiply(0.95).add(midland.multiply(1.05)).add(upland.multiply(1.1));
  }
  if (hazard === 'Drought') {
    // Higher in midlands (more vegetation, cooler) and uplands
    return lowland.multiply(0.9).add(midland.multiply(1.05)).add(upland.multiply(1.1));
  }
  if (hazard === 'Heat') {
    // Slight boost in low/mid due to population centers, neutral in uplands
    return lowland.multiply(1.05).add(midland.multiply(1.05)).add(upland.multiply(1.0));
  }
}

// =============================
// 5. Apply combined adjustments
// =============================

// Flood: flat better, lowland better
var floodAdj = floodBase
  .multiply(ee.Image(1).subtract(slopeNorm.multiply(0.5)))
  .multiply(elevWeight('Flood'));

// Erosion: steeper slopes better, upland better
var erosionAdj = erosionBase
  .multiply(ee.Image(1).add(slopeNorm.multiply(0.5)))
  .multiply(elevWeight('Erosion'));

// Fire: reduced on steep south slopes, slight elev boost
var fireAdj = fireBase
  .multiply(ee.Image(1).subtract(slopeNorm.multiply(0.2)))
  .multiply(ee.Image(1).subtract(northness.multiply(-0.1)))
  .multiply(elevWeight('Fire'));

// Drought: better on north-facing slopes, upland/midland boost
var droughtAdj = droughtBase
  .multiply(ee.Image(1).add(northness.multiply(0.1)))
  .multiply(elevWeight('Drought'));

// Heatwave: better on north/east aspects, low/mid slight boost
var heatAdj = heatBase
  .multiply(ee.Image(1).add(northness.multiply(0.05)))
  .multiply(ee.Image(1).add(eastness.multiply(0.05)))
  .multiply(elevWeight('Heat'));

// =============================
// 6. Stack adjusted mitigation layers
// =============================
var allMitigation = floodAdj
  .addBands(fireAdj)
  .addBands(droughtAdj)
  .addBands(heatAdj)
  .addBands(erosionAdj)
  .rename([
    'Flood_Mitigation',
    'Fire_Mitigation',
    'Drought_Mitigation',
    'HeatWave_Mitigation',
    'Erosion_Mitigation'
  ]);

// =============================
// 7. Display
// =============================
var palette = ['white', 'red'];
Map.addLayer(floodAdj,   {min: 0, max: 1.5, palette: palette}, 'Flood Mitigation (Adj)');
Map.addLayer(fireAdj,    {min: 0, max: 1.5, palette: palette}, 'Fire Mitigation (Adj)');
Map.addLayer(droughtAdj, {min: 0, max: 1.5, palette: palette}, 'Drought Mitigation (Adj)');
Map.addLayer(heatAdj,    {min: 0, max: 1.5, palette: palette}, 'HeatWave Mitigation (Adj)');
Map.addLayer(erosionAdj, {min: 0, max: 1.5, palette: palette}, 'Erosion Mitigation (Adj)');


// ======================================================
// NBS HOTSPOT PRIORITIZATION — DISTINCT BY HAZARD
// Hazards: Flood (GFD) and Fire (MODIS MCD64A1)
// Capacity: floodAdj & fireAdj mitigation layers (0..~1.5)
// Logic per hazard: Priority = Hazard_Intensity × (1 − Mitigation_Capacity)
// ======================================================


// Base map + boundary
var hill = ee.Terrain.hillshade(srtm)
  .visualize({min:150, max:255, forceRgbOutput:true})
  .multiply(0.9);
//var outline = cantabria.style({color:'000000', width:2, fillColor:'00000000'});

// ---------------- STEP 1. Build HAZARD intensity layers ----------------
var gfd = ee.ImageCollection('GLOBAL_FLOOD_DB/MODIS_EVENTS/V1');

// Flood hazard = count of satellite-observed floods (exclude permanent water)
//.select('flooded').sum() → adds up all the times a pixel was seen flooded. The result is how often each pixel got flooded (Flood Hazard Index, FHI).

var FHI_raw = gfd.select('flooded').sum().rename('FHI').clip(cantabria);
var JRC_perm = gfd.select('jrc_perm_water').sum().gte(1);
var FHI = FHI_raw.updateMask(JRC_perm.not()); // mask-out permanent water

// Fire hazard = months burned at least once (2000–2019)
//Look at every month from 2000–2019. Mark if a pixel burned that month (yes is 1/no is 0).
//Count how many months it burned in total. That number is fire hazard for that location. Later on we will use those values to nromalise 
//our fire hazard layer from 0 to 1 or from less pixel burn to high

var burnedMonthly = ee.ImageCollection('MODIS/061/MCD64A1')
  .select('BurnDate')
  .filterDate('2000-01-01','2019-01-01')
  .map(function(img){ return img.gt(0); });
var FIRE = burnedMonthly.sum().rename('FIRE').clip(cantabria);


// Optional viz of raw counts
// Map.addLayer(hill.blend(FHI.visualize({min:0, max:10, palette:['c3effe','1341e8','051cb0','001133'], opacity:0.9})),
//             {}, 'STEP 1a · Flood Hazard (count)');
Map.addLayer(FHI.visualize({min:1, max:4, palette:['c3effe','1341e8','051cb0','001133']}),
             {}, 'STEP 1a · Flood Hazard (count)');             
Map.addLayer(FIRE.visualize({min:0, max:24, palette:['fff5eb','fd8d3c','e6550d','a63603']}),
             {}, 'STEP 1b · Fire Hazard (count)');

// ---------------- Helpers for adaptive percentiles (robust keys) ----------------
//Sometimes, some of the pixels don't burn or get flooded at all. These helpers are making sure you can safely compute percentiles of positive pixel values 
//from an image in a region without your script crashing. Also helps you if the dictionary keys are named differently (p95 vs Band_p95), or
//The dictionary is empty (e.g., no positive pixels).
//So basically: “Get me the 95th percentile (or any percentile) of positive pixels in this image, and don’t break if the data is missing or weirdly named.”
function dictFirstNumber_(dict, fallback) {
  dict = ee.Dictionary(dict);
  var keys = dict.keys();
  var hasAny = keys.size().gt(0);
  var firstKey = ee.String(ee.Algorithms.If(hasAny, keys.get(0), ''));
  return ee.Number(ee.Algorithms.If(hasAny, dict.get(firstKey), fallback));
}
function getP_(dict, band, pct, fallback) {
  dict = ee.Dictionary(dict);
  var key1 = ee.String('p').cat(ee.Number(pct).format());               // 'p95'
  var key2 = ee.String(band).cat('_p').cat(ee.Number(pct).format());    // 'FHI_p95'
  var has1 = dict.contains(key1);
  var has2 = dict.contains(key2);
  return ee.Number(ee.Algorithms.If(
    has1, dict.get(key1),
    ee.Algorithms.If(
      has2, dict.get(key2),
      dictFirstNumber_(dict, fallback)
    )
  ));
}
function posPercentile(img, pct, geom, scale, fallback) {
  img = ee.Image(img);
  var band = ee.String(img.bandNames().get(0));
  var d = img.updateMask(img.gt(0)).reduceRegion({
    reducer: ee.Reducer.percentile([pct]),
    geometry: geom, scale: scale, maxPixels: 1e13, bestEffort: true, tileScale: 2
  });
  return getP_(d, band, pct, fallback);
}
function posPctlThreshold(img01, pct, geom, scale, fallback) {
  img01 = ee.Image(img01);
  var band = ee.String(img01.bandNames().get(0));
  var d = img01.updateMask(img01.gt(0)).reduceRegion({
    reducer: ee.Reducer.percentile([pct]),
    geometry: geom, scale: scale, maxPixels: 1e13, bestEffort: true, tileScale: 2
  });
  return getP_(d, band, pct, fallback);
}

// --------------- STEP 2. Normalize hazards (0..1) with positive-only p95 ---------------
//We are taking raw hazard data (flood and fire), finding a “reasonable high” cutoff (95th percentile of positive pixels),
//and then scaling everything between 0 and 1 so that hazards (and later mitigation) can be fairly compared
var FHI_max = ee.Number(
  FHI.reduceRegion({reducer: ee.Reducer.max(), geometry: cantabria.geometry(),
                    scale: 250, maxPixels: 1e13, bestEffort: true, tileScale: 2}).get('FHI')
).max(1);
var FIRE_max = ee.Number(
  FIRE.reduceRegion({reducer: ee.Reducer.max(), geometry: cantabria.geometry(),
                     scale: 500, maxPixels: 1e13, bestEffort: true, tileScale: 2}).get('FIRE')
).max(1);

// p95 among positive pixels; fall back to max if empty
var FHI_p95 = posPercentile(FHI, 90, cantabria.geometry(), 250, FHI_max);
var FIRE_p95 = posPercentile(FIRE, 95, cantabria.geometry(), 500, FIRE_max);
//print('STEP 2 (fixed) · p95 (positive-only) → Flood:', FHI_p95, 'Fire:', FIRE_p95);

// Normalize to 0..1
var floodHaz = FHI.divide(FHI_p95).clamp(0, 1).rename('flood_haz');
var fireHaz  = FIRE.divide(FIRE_p95).clamp(0, 1).rename('fire_haz');

// Map.addLayer(hill.blend(floodHaz.visualize({min:0, max:1, palette:['e0f3ff','74a9cf','0570b0'], opacity:0.9})),
//             {}, 'STEP 2a · Flood Hazard (0–1)');
Map.addLayer(floodHaz.visualize({min:0, max:1, palette:['blue', 'cyan', 'yellow', 'orange', 'red' ], opacity:0.6}),
             {}, 'STEP 2a · Flood Hazard (0–1)');
// Map.addLayer(hill.blend(fireHaz.visualize({min:0, max:1, palette:['fee8c8','fdbb84','e34a33'], opacity:0.9})),
//             {}, 'STEP 2b · Fire Hazard (0–1)');
Map.addLayer(fireHaz.visualize({min:0, max:1, palette:['fee8c8','fdbb84','e34a33'], opacity:0.9}),
             {}, 'STEP 2b · Fire Hazard (0–1)');
// --------------- STEP 3. Normalize MITIGATION capacity (0..1) ---------------
var floodMit = floodAdj.divide(1.5).clamp(0, 1).rename('flood_mit');
var fireMit  = fireAdj.divide(1.5).clamp(0, 1).rename('fire_mit');


Map.addLayer(floodMit.visualize({min:0, max:1, palette:['f7fcf5','a6dba0','1b7837']}),
             {}, 'STEP 3a · Flood Mitigation (0–1)');
Map.addLayer(fireMit.visualize({min:0, max:1, palette:['f7fcf5','a6dba0','1b7837']}),
             {}, 'STEP 3b · Fire Mitigation (0–1)');

// --------------- STEP 4. Mitigation GAP (1 − mitigation) ---------------
//By doing 1 – mitigation, you flip it: If mitigation = 1 (strong protection), the gap = 0 → no gap.
//If mitigation = 0 (no protection), the gap = 1 → big gap.
//So you’re calculating how much protection is missing. mitigation tells you how strong the protection is.
//1 – mitigation tells you the leftover vulnerability (the gap). If mitigation = 0.5 (medium protection), the gap = 0.5

var floodGap = ee.Image(1).subtract(floodMit).rename('flood_gap');
var fireGap  = ee.Image(1).subtract(fireMit).rename('fire_gap');

Map.addLayer(floodGap.visualize({min:0, max:1, palette:['ffffff','fde0ef','d6604d','b2182b']}),
             {}, 'STEP 4a · Flood Gap (low capacity)');
Map.addLayer(fireGap.visualize({min:0, max:1, palette:['ffffff','fde0ef','d6604d','b2182b']}),
             {}, 'STEP 4b · Fire Gap (low capacity)');

// --------------- STEP 5. PRIORITY per hazard ---------------
//Because you want to prioritise aress needing attention,  you want these areas to be high only when:
/The hazard is strong, and the mitigation gap is large. So that if either is small (low hazard or strong mitigation), the priority will be low.
//prioFlood (and prioFire) tells you where action is most needed. In simple term, we combine danger (hazard) with lack of protection (gap) into one score between 0 and 1.
  
var prioFlood = floodHaz.multiply(floodGap).rename('prio_flood');  // 0..1
var prioFire  = fireHaz.multiply(fireGap).rename('prio_fire');     // 0..1

var prioPal = ['4575b4','91bfdb','e0f3f8','fee090','fc8d59','d73027'];



// Map.addLayer(hill.blend(prioFlood.visualize({min:0, max:1, palette: prioPal, opacity:0.95})),
//             {}, 'STEP 5a · NbS Priority (FLOOD)');
Map.addLayer(prioFlood.visualize({min:0, max:1, palette: prioPal, opacity:0.95}),
             {}, 'STEP 5a · NbS Priority (FLOOD)');
// Map.addLayer(hill.blend(prioFire.visualize({min:0, max:1, palette: prioPal, opacity:0.95})),
//             {}, 'STEP 5b · NbS Priority (FIRE)');
Map.addLayer(prioFire.visualize({min:0, max:1, palette: prioPal, opacity:0.95}),
             {}, 'STEP 5b · NbS Priority (FIRE)');

// --------------- STEP 6. HOTSPOTS per hazard (top 20%) — positive-only percentiles ---------------
//in step 5 we have done prioFlood / prioFire are your priority maps (hazard × gap, scaled 0–1).
//We now will like to mark the worst areas i.e the hotspots. To do this, you use percentile thresholds:
//Flood: 60th percentile, Fire: 80th percentile. That means: For flood, you keep the top 40% of highest-priority pixels.
//For fire, you keep the top 20% of highest-priority pixels. The function posPctlThreshold finds that cutoff value (e.g., 0.6 or 0.75) and makes sure it’s safe

var thFlood = posPctlThreshold(prioFlood, 60, cantabria.geometry(), 100, 0.2);
var thFire  = posPctlThreshold(prioFire,  80, cantabria.geometry(), 100, 0.2);
//print('STEP 6 (fixed) · Hotspot thresholds (p80 on pos-only) → Flood:', thFlood, 'Fire:', thFire);

var hotspotFlood = prioFlood.gte(thFlood).selfMask().rename('hotspot_flood');
var hotspotFire  = prioFire.gte(thFire).selfMask().rename('hotspot_fire');

Map.addLayer(hotspotFlood.visualize({palette:['#ff0000'], opacity:0.65}).clip(cantabria),
             {}, 'STEP 6a · HOTSPOT (FLOOD)');
Map.addLayer(hotspotFire.visualize({palette:['#ff7f00'], opacity:0.65}).clip(cantabria),
             {}, 'STEP 6b · HOTSPOT (FIRE)');

// --------------- STEP 7. PROTECT / ENHANCE zones — adaptive (percentiles) ---------------
//Here we only want to keep places where flood danger is above average and protection is also above average.
//Hazard ≥ 55th percentile = flood danger is in the top half (higher than most places).
//Mitigation ≥ 55th percentile = mitigation is also in the top half (better than most places).
//So together, these are areas where floods matter and nature/mitigation is already working well.
//That makes them valuable zones worth protecting. Note, we apply a self mask jsut to see the visible areas
  
var hzFloodP70  = posPercentile(floodHaz, 55, cantabria.geometry(), 250, 0.6);
var mitFloodP70 = posPercentile(floodMit, 55, cantabria.geometry(), 100, 0.6);
var hzFireP70   = posPercentile(fireHaz,  70, cantabria.geometry(), 500, 0.6);
var mitFireP70  = posPercentile(fireMit,  70, cantabria.geometry(), 100, 0.6);
//print('STEP 7 (adaptive) · thresholds → Flood(hz,mit):', hzFloodP70, mitFloodP70,
      //' Fire(hz,mit):', hzFireP70, mitFireP70);

var protectFlood = floodHaz.gte(hzFloodP70).and(floodMit.gte(mitFloodP70)).selfMask();
var protectFire  = fireHaz.gte(hzFireP70).and(fireMit.gte(mitFireP70)).selfMask();

Map.addLayer(protectFlood.visualize({palette:['#2ca25f'], opacity:0.85}).clip(cantabria),
             {}, 'STEP 7a · Protect/Enhance (FLOOD)');
Map.addLayer(protectFire.visualize({palette:['#238b45'], opacity:0.85}).clip(cantabria),
             {}, 'STEP 7b · Protect/Enhance (FIRE)');

// Boundary on top
//Map.addLayer(outline, {}, 'Boundary');

// ======================================================
// FUNCTIONAL UNITS + ES–DEMAND COUPLING (NbS mitigation logic)
// Uses existing vars: cantabria, slope, corine, floodAdj, floodHaz,
// helpers posPercentile / posPctlThreshold, and Map set up.
// ======================================================

// ---------- A) Hydro basins and rivers (open datasets) ----------
var basinsL12 = ee.FeatureCollection('WWF/HydroATLAS/v1/Basins/level12')
  .filterBounds(cantabria);

var riversEU = ee.FeatureCollection('projects/ee-desmond/assets/HydroRIVERS_v10_eu')
  .filterBounds(cantabria);

// Buffer floodplains by stream order (ORD_FLOW). Adjust if you like.
function orderToBuf(o) {
  o = ee.Number(o);
  return ee.Number(ee.Algorithms.If(o.gte(7), 150,
         ee.Algorithms.If(o.gte(6), 120,
         ee.Algorithms.If(o.gte(5),  90,
         ee.Algorithms.If(o.gte(4),  60,
         ee.Algorithms.If(o.gte(3),  40, 25)))))); // meters
}

// Paint buffered rivers to raster (no union to keep it light)
var floodplainMask = ee.Image().byte().paint(
  riversEU.map(function(f){ return f.buffer(orderToBuf(f.get('ORD_FLOW'))); }),
  1
).rename('floodplain').clip(cantabria);

// Hillslopes = steeper ground outside the floodplain buffer
var slopeThr = 8; // degrees (tune)
var hillslopeMask = slope.gte(slopeThr)
  .and(floodplainMask.unmask(0).neq(1))
  .rename('hillslopes');

// ---------- B) ES supply layers: existing forest vs potential (non-forest) ----------
var forestMask = corine.eq(311).or(corine.eq(312)).or(corine.eq(313)); // forests
var nonForestMask = forestMask.not();

// Runoff regulation by forest (existing) and potential where not forest
var runoffReg_bos     = floodAdj.updateMask(forestMask).rename('runoff_bos');        // existing SPA
var runoffReg_no_bos  = floodAdj.updateMask(nonForestMask).rename('runoff_no_bos');  // potential SPA

// Restrict to functional units
var H_runoff_bos    = runoffReg_bos.updateMask(hillslopeMask);         // hillslopes (existing)
var H_runoff_pot    = runoffReg_no_bos.updateMask(hillslopeMask);      // hillslopes (potential)
var FP_storage_cap  = floodAdj.updateMask(floodplainMask);             // floodplain (storage capacity)

// ---------- FIX: safe number coalesce (for reduceRegion nulls) ----------
function nz(x) { return ee.Number(ee.Algorithms.If(ee.Algorithms.IsEqual(x, null), 0, x)); }

// ---------- C) DEMAND & SUPPLY by basin (uses your floodAdj as ES supply) ----------
var scale = 100;

// Floodplain mask from earlier block:
var floodplainMask = floodplainMask; // (already defined above)
var hillslopeMask  = hillslopeMask;  // (already defined above)

// Rename floodplain ES capacity for clarity
var FP_storage_cap = floodAdj.updateMask(floodplainMask).rename('fp_store');

// ES supply split by forest / non-forest on hillslopes — still using floodAdj
var forestMask     = forestMask;      // from your code
var nonForestMask  = forestMask.not();

var runoffReg_bos    = floodAdj.updateMask(forestMask).rename('runoff_bos');
var runoffReg_no_bos = floodAdj.updateMask(nonForestMask).rename('runoff_no_bos');

var H_runoff_bos = runoffReg_bos.updateMask(hillslopeMask);
var H_runoff_pot = runoffReg_no_bos.updateMask(hillslopeMask);

// HydroATLAS L12 basins
var basinsL12 = ee.FeatureCollection('WWF/HydroATLAS/v1/Basins/level12')
  .filterBounds(cantabria);

// Per-basin FU stats (NOTE: use nz() instead of .unmask on numbers)
var basins_scored = basinsL12.map(function(feat){
  var geom = feat.geometry();

  var demandFloodplain = nz(
    floodHaz.updateMask(floodplainMask).reduceRegion({
      reducer: ee.Reducer.mean(), geometry: geom, scale: scale,
      maxPixels: 1e13, bestEffort: true, tileScale: 2
    }).get('flood_haz')
  );

  var supplyHill_BOS = nz(
    H_runoff_bos.reduceRegion({
      reducer: ee.Reducer.mean(), geometry: geom, scale: scale,
      maxPixels: 1e13, bestEffort: true, tileScale: 2
    }).get('runoff_bos')
  );

  var supplyHill_POT = nz(
    H_runoff_pot.reduceRegion({
      reducer: ee.Reducer.mean(), geometry: geom, scale: scale,
      maxPixels: 1e13, bestEffort: true, tileScale: 2
    }).get('runoff_no_bos')
  );

  var fp_store_mean = nz(
    FP_storage_cap.reduceRegion({
      reducer: ee.Reducer.mean(), geometry: geom, scale: scale,
      maxPixels: 1e13, bestEffort: true, tileScale: 2
    }).get('fp_store')
  );

  var area_km2 = ee.Number(geom.area()).divide(1e6);

  // Coupled scores (basin level)
  var prio_reforest = demandFloodplain.multiply(supplyHill_POT);  // add trees/restore
  var prio_protect  = demandFloodplain.multiply(supplyHill_BOS);  // protect/enhance

  return feat.set({
    dem_fp_mean:       demandFloodplain,
    sup_hill_bos_mean: supplyHill_BOS,
    pot_hill_mean:     supplyHill_POT,
    fp_store_mean:     fp_store_mean,
    prio_refor:        prio_reforest,
    prio_protect:      prio_protect,
    area_km2:          area_km2
  });
});

// Broadcast demand back to pixels (unchanged behavior for pixel opportunities)
var demandImg = basins_scored.reduceToImage(['dem_fp_mean'], ee.Reducer.first())
  .rename('demand_fp').clip(cantabria);

// Pixel-level opportunities (kept)
var opp_hillslopes = H_runoff_pot.multiply(demandImg).rename('opp_hillslopes');
var opp_protect    = H_runoff_bos.multiply(demandImg).rename('opp_protect');

// Hotspots (pixel) by percentile
var thOppHill = posPctlThreshold(opp_hillslopes, 80, cantabria.geometry(), scale, 0.2);
var thOppProt = posPctlThreshold(opp_protect,   80, cantabria.geometry(), scale, 0.2);
var HS_hillslopes = opp_hillslopes.gte(thOppHill).selfMask();
var HS_protect    = opp_protect.gte(thOppProt).selfMask();

// ---------- NEW: Basin-level “all functional units high” hotspots ----------
// Percentile thresholds across basins
function pctl(fc, field, p){
  return ee.Number(
    fc.reduceColumns({reducer: ee.Reducer.percentile([p]), selectors:[field]})
      .get('p'+p)
  );
}
var dem_p80  = pctl(basins_scored, 'dem_fp_mean',       80);
var bos_p80  = pctl(basins_scored, 'sup_hill_bos_mean', 80);
var pot_p80  = pctl(basins_scored, 'pot_hill_mean',     80);
var fp_p80   = pctl(basins_scored, 'fp_store_mean',     80);

// Hotspot basins where demand AND supply FUs are jointly high
var basins_HS_protect = basins_scored.filter(
  ee.Filter.and(
    ee.Filter.gte('dem_fp_mean',       dem_p80),
    ee.Filter.gte('sup_hill_bos_mean', bos_p80),
    ee.Filter.gte('fp_store_mean',     fp_p80)
  )
);

var basins_HS_restore = basins_scored.filter(
  ee.Filter.and(
    ee.Filter.gte('dem_fp_mean',   dem_p80),
    ee.Filter.gte('pot_hill_mean', pot_p80),
    ee.Filter.gte('fp_store_mean', fp_p80)
  )
);


// --- Fallback if none found ---
basins_HS_protect = ee.Algorithms.If(
  basins_HS_protect.size().gt(0),
  basins_HS_protect,
  basins_scored.sort('prio_protect', false).limit(5)   //  fallback: top 5 protect basins
);
basins_HS_protect = ee.FeatureCollection(basins_HS_protect);

basins_HS_restore = ee.Algorithms.If(
  basins_HS_restore.size().gt(0),
  basins_HS_restore,
  basins_scored.sort('prio_refor', false).limit(5)     //  fallback: top 5 restore basins
);
basins_HS_restore = ee.FeatureCollection(basins_HS_restore);

// === Add basin hotspot layers to the map ===

// All basins (context, optional)
Map.addLayer(
  basinsL12.style({color: 'gray', width: 1}),
  {},
  'All basins (context)',
  false
);

// Protect hotspot basins (green)
Map.addLayer(
  basins_HS_protect.style({
    color: '006d2c',       // dark green outline
    fillColor: '00FF0050', // semi-transparent green fill
    width: 2
  }),
  {},
  'Basin HS · Protect',
  true
);

// Restore hotspot basins (blue)
Map.addLayer(
  basins_HS_restore.style({
    color: '08519c',       // dark blue outline
    fillColor: '0000FF50', // semi-transparent blue fill
    width: 2
  }),
  {},
  'Basin HS · Restore',
  true
);

// ======================================================
// FUNCTIONAL HOTSPOTS (single categorical layer)
// Uses existing: cantabria, corine, slope, floodAdj, floodHaz,
// and helpers: posPctlThreshold(...)
// ======================================================

// ---------- 1) Functional units ----------
var riversEU = ee.FeatureCollection('projects/ee-desmond/assets/HydroRIVERS_v10_eu')
  .filterBounds(cantabria);

function orderToBuf(o) {
  o = ee.Number(o);
  return ee.Number(ee.Algorithms.If(o.gte(7), 150,
         ee.Algorithms.If(o.gte(6), 120,
         ee.Algorithms.If(o.gte(5),  90,
         ee.Algorithms.If(o.gte(4),  60,
         ee.Algorithms.If(o.gte(3),  40, 25)))))); // meters
}

//Map.addLayer(riversEU, {}, 'river')
var floodplainMask = ee.Image().byte().paint(
  riversEU.map(function(f){ return f.buffer(orderToBuf(f.get('ORD_FLOW'))); }),
  1
).rename('floodplain').clip(cantabria);

var slopeThr = 8; // deg (tune)
var hillslopeMask = slope.gte(slopeThr)
  .and(floodplainMask.unmask(0).neq(1))
  .rename('hillslopes');

// Forest/non-forest masks (CORINE)
var forestMask = corine.eq(311).or(corine.eq(312)).or(corine.eq(313));
var nonForestMask = forestMask.not();

// ---------- 2) ES supply surfaces per FU (all derived from your floodAdj) ----------
var SPA_forest_hills = floodAdj.updateMask(forestMask).updateMask(hillslopeMask)
  .rename('spa_forest_hills');            // existing regulation on hillslopes

var POT_hills       = floodAdj.updateMask(nonForestMask).updateMask(hillslopeMask)
  .rename('pot_hills');                   // potential regulation on hillslopes

var FP_storage      = floodAdj.updateMask(floodplainMask)
  .rename('fp_storage');                  // floodplain attenuation capacity

// ---------- 3) Demand (where regulation matters most) ----------
var demand_fp = floodHaz.updateMask(floodplainMask).rename('demand_fp'); // flood hazard in floodplains

// >>> FIX: spread floodplain demand to hillslopes (so products aren’t empty)
var demand_hills = demand_fp.unmask(0)
  .focal_max({radius: 1500, units: 'meters'}) // 1.5 km buffer, tune if needed
  .rename('demand_hills');

// ---------- 4) Coupled priority scores (supply × demand) ----------
var score_protect = SPA_forest_hills.multiply(demand_hills).rename('score_protect'); // keep/protect/enhance
var score_restore = POT_hills.multiply(demand_hills).rename('score_restore');        // restore/reforest
var score_retain  = FP_storage.multiply(demand_fp.unmask(0)).rename('score_retain'); // floodplain retention

// ---------- 5) Hotspot thresholds (positive-only percentiles) ----------
var scaleFU = 100;
var thProtect = posPctlThreshold(score_protect, 80, cantabria.geometry(), scaleFU, 0);
var thRestore = posPctlThreshold(score_restore, 80, cantabria.geometry(), scaleFU, 0);
var thRetain  = posPctlThreshold(score_retain,  80, cantabria.geometry(), scaleFU, 0);

var HS_protect = score_protect.gte(thProtect).selfMask();
var HS_restore = score_restore.gte(thRestore).selfMask();
var HS_retain  = score_retain.gte(thRetain ).selfMask();


// Simplify hillslope mask for display
var hillslopeDisplay = hillslopeMask.selfMask().byte();

Map.addLayer(hillslopeDisplay,
             {palette:['#8da0cb'], opacity:0.35}, 'Hillslopes', false);


// Optional: keep the continuous opportunity layers for expert tuning
// Map.addLayer(score_protect, {min:0, max:1.2, palette:['#f7fcf5','#a1d99b','#238b45']},
//             'Score · Protect forest (supply×demand)', false);

Map.addLayer(score_protect, {
  min: 0,
  max: 1,
  palette: [
    '#ffffb2', // pale yellow
    '#78c679', // light green
    '#238443', // green
    '#004529'  // very dark green
  ]
}, 'ProFor', false);

Map.addLayer(score_restore, {min:0, max:1.2, palette:['#eff3ff','#6baed6','#08519c']},
             'Resthill', false);
Map.addLayer(score_retain,  {min:0, max:1.2, palette:['#fff7fb','#cab2d6','#6a3d9a']},
             'Restflopl', false);

// ---------- 8) Basin summaries ----------
var basinsL12 = ee.FeatureCollection('WWF/HydroATLAS/v1/Basins/level12').filterBounds(cantabria);
var hs_area_img = ee.Image.pixelArea().divide(1e6); // km²

//print('Thresholds → Protect:', thProtect, ' Restore:', thRestore, ' Retain:', thRetain);

// Per-class km² (whole region)
var A_restore = ee.Number(hs_area_img.updateMask(HS_restore).reduceRegion({
  reducer: ee.Reducer.sum(), geometry: cantabria.geometry(), scale: scaleFU,
  maxPixels: 1e13, bestEffort: true, tileScale: 2
}).get('area'));
var A_protect = ee.Number(hs_area_img.updateMask(HS_protect).reduceRegion({
  reducer: ee.Reducer.sum(), geometry: cantabria.geometry(), scale: scaleFU,
  maxPixels: 1e13, bestEffort: true, tileScale: 2
}).get('area'));
var A_retain = ee.Number(hs_area_img.updateMask(HS_retain).reduceRegion({
  reducer: ee.Reducer.sum(), geometry: cantabria.geometry(), scale: scaleFU,
  maxPixels: 1e13, bestEffort: true, tileScale: 2
}).get('area'));
// print('HOTSPOT areas (km²) → Restore:', A_restore,
//       ' Protect:', A_protect, ' Retain:', A_retain);
