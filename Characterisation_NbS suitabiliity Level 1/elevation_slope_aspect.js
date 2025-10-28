// Load all boundary levels
var adm0 = ee.FeatureCollection("projects/sat-io/open-datasets/geoboundaries/CGAZ_ADM0");
var adm1 = ee.FeatureCollection("projects/sat-io/open-datasets/geoboundaries/CGAZ_ADM1");
var adm2 = ee.FeatureCollection("projects/sat-io/open-datasets/geoboundaries/CGAZ_ADM2");

// =========================================
// 1. Italy – Potenza (ADM2 via ADM0 → ADM1)
var italy = adm0.filter(ee.Filter.eq('shapeName', 'Italy'));
var adm1_italy = adm1.filterBounds(italy);
var basilicata = adm1_italy.filter(ee.Filter.eq('shapeName', 'Basilicata'));
var adm2_basilicata = adm2.filterBounds(basilicata);
var potenza = adm2_basilicata.filter(ee.Filter.eq('shapeName', 'Potenza'));
Map.addLayer(potenza, {color: 'green'}, 'Italy – Potenza');

// =========================================
// 2. Greece – Macedonia-Thrace (ADM1 via ADM0)
var greece = adm0.filter(ee.Filter.eq('shapeName', 'Greece'));
var adm1_greece = adm1.filterBounds(greece);
var macedoniaThrace = adm1_greece.filter(ee.Filter.eq('shapeName', 'Macedonia-Thrace'));
Map.addLayer(macedoniaThrace, {color: 'blue'}, 'Greece – Macedonia-Thrace');

// =========================================
// 3. Croatia – Split-Dalmatia (ADM1 via ADM0)
var croatia = adm0.filter(ee.Filter.eq('shapeName', 'Croatia'));
var adm1_croatia = adm1.filterBounds(croatia);
var splitDalmatia = adm1_croatia.filter(ee.Filter.eq('shapeName', 'Split-Dalmatia'));
Map.addLayer(splitDalmatia, {color: 'orange'}, 'Croatia – Split-Dalmatia');

// =========================================
// 4. Italy – Sardina (ADM1 via ADM0)
var italy = adm0.filter(ee.Filter.eq('shapeName', 'Italy'));
var adm1_italy = adm1.filterBounds(italy);
var alentejo = adm1_italy.filter(ee.Filter.eq('shapeName', 'Sardegna'));
Map.addLayer(alentejo, {color: 'purple'}, 'Italy – Sardina');

// =========================================
// 5. France – Corse-du-Sud (ADM2 via ADM0 → ADM1)
var france = adm0.filter(ee.Filter.eq('shapeName', 'France'));
var adm1_france = adm1.filterBounds(france);
var corseDuSud = adm1_france.filter(ee.Filter.eq('shapeName', "Provence-Alpes-Côte d'Azur"));
Map.addLayer(corseDuSud, {color: 'pink'}, 'France – Corse-du-Sud');

// =========================================
// 6. Spain – Valencia (ADM1 via ADM0)
var spain = adm0.filter(ee.Filter.eq('shapeName', 'Spain'));
var adm1_spain = adm1.filterBounds(spain);
var valencia = adm1_spain.filter(ee.Filter.eq('shapeName', 'Comunitat Valenciana'));
Map.addLayer(valencia, {color: 'yellow'}, 'Spain – Valenciana');

// =========================================
// 7. Portugal – Beiras e Serra da Estrela (ADM2 via ADM0 → ADM1)
var portugal = adm0.filter(ee.Filter.eq('shapeName', 'Portugal'));
var adm1_portugal = adm1.filterBounds(portugal);

// Use multiple ADM1 regions that represent the Centro/Beiras area
var centroRegions = adm1_portugal.filter(ee.Filter.inList('shapeName', [
  'CASTELO BRANCO', 'GUARDA', 'COIMBRA', 'VISEU'
]));

// Merge them into one
var beirasCentro = centroRegions.union();
Map.addLayer(beirasCentro, {color: 'red'}, 'Portugal – Beiras/Centro');


// =========================================
// 8. Cyprus – Nicosia (ADM2 via ADM0 → ADM1)
var cyprus = adm0.filter(ee.Filter.eq('shapeName', 'Cyprus'));
var adm1_cyprus = adm1.filterBounds(cyprus);
var nicosia = adm1_cyprus.filter(ee.Filter.eq('shapeName', 'Nicosia'));
Map.addLayer(nicosia, {color: 'cyan'}, 'Cyprus – Nicosia');

// Center the map on Europe
Map.setCenter(16, 44, 5);

// =========================================
// Elevation, Slope, and Aspect
// =========================================

// Load SRTM elevation (30m)
// var srtm = ee.Image('USGS/SRTMGL1_003')
//   .clip(macedoniaThrace);

// //Export the images to your Google Drive for one site only
// Export.image.toDrive({
//   image: srtm,
//   description: 'SRTM_Elevation_macedonia',
//   folder: 'desirMED',
//   scale: 30,
//   region: macedoniaThrace,
//   maxPixels: 1e9
// });

// // Derive slope (degrees) 
// var slope = ee.Terrain.slope(srtm);
// //Export the images to your Google Drive
// Export.image.toDrive({
//   image: slope,
//   description: 'SRTM_slope_macedonia',
//   folder: 'desirMED',
//   scale: 30,
//   region: macedoniaThrace,
//   maxPixels: 1e9
// });

// // Derive aspect (degrees from north)
// var aspect = ee.Terrain.aspect(srtm);
// //Export the images to your Google Drive
// Export.image.toDrive({
//   image: aspect,
//   description: 'SRTM_aspect_macedonia',
//   folder: 'desirMED',
//   scale: 30,
//   region: macedoniaThrace,
//   maxPixels: 1e9
// });

// =========================================
// Export for all 8 regions
// =========================================
// potenza, macedoniaThrace, splitDalmatia, alentejo, corseDuSud, valencia, beirasCentro, nicosia


// Load SRTM elevation
var srtm = ee.Image('USGS/SRTMGL1_003');

// Derive slope and aspect
var slope = ee.Terrain.slope(srtm);
var aspect = ee.Terrain.aspect(srtm);

// List of your 8 regions (replace with your actual region variables)
var regions = [potenza, macedoniaThrace, splitDalmatia, alentejo, corseDuSud, valencia, beirasCentro, nicosia];

// Corresponding region names for file naming
var regionNames = ['potenza', 'macedoniaThrace', 'splitDalmatia', 'alentejo', 'corseDuSud', 'valencia', 'beirasCentro', 'nicosia'];

// Loop through each region and export elevation, slope, and aspect
regions.forEach(function(region, index) {
  var name = regionNames[index];

  // Clip images to region
  var clippedElevation = srtm.clip(region);
  var clippedSlope = slope.clip(region);
  var clippedAspect = aspect.clip(region);

  // Export elevation
  Export.image.toDrive({
    image: clippedElevation,
    description: 'SRTM_Elevation_' + name,
    folder: 'desirMED',
    scale: 30,
    region: region.geometry(),
    crs: 'EPSG:4326',
    maxPixels: 1e9
  });

  // Export slope
  Export.image.toDrive({
    image: clippedSlope,
    description: 'SRTM_Slope_' + name,
    folder: 'desirMED',
    scale: 30,
    region: region.geometry(),
    crs: 'EPSG:4326',
    maxPixels: 1e9
  });

  // Export aspect
  Export.image.toDrive({
    image: clippedAspect,
    description: 'SRTM_Aspect_' + name,
    folder: 'desirMED',
    scale: 30,
    region: region.geometry(),
    crs: 'EPSG:4326',
    maxPixels: 1e9
  });
});

