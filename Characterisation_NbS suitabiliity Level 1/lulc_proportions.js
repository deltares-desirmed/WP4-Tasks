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


// Load CORINE 2018 dataset (use 2012)
var corine = ee.Image('COPERNICUS/CORINE/V20/100m/2018');

// Remap CORINE classes to 5 major Level 1 groups
var remapped = corine.select('landcover').remap(
  [
    111,112,121,122,123,124,131,132,133,141,142, // Artificial
    211,212,213,221,222,223,231,241,242,243,244, // Agricultural
    311,312,313,321,322,323,324,331,332,333,334,335, // Forest/Semi-Natural
    411,412,421,422,423, // Wetlands
    511,512,521,522,523 // Water bodies
  ],
  [
    1,1,1,1,1,1,1,1,1,1,1,
    2,2,2,2,2,2,2,2,2,2,2,
    3,3,3,3,3,3,3,3,3,3,3,3,
    4,4,4,4,4,
    5,5,5,5,5
  ]
).rename('level1');

// Rebuild your regions into a proper list
var regions = ee.FeatureCollection([
  potenza.first().set('Region', 'Italy – Potenza'),
  macedoniaThrace.first().set('Region', 'Greece – Macedonia-Thrace'),
  splitDalmatia.first().set('Region', 'Croatia – Split-Dalmatia'),
  alentejo.first().set('Region', 'Italy – Sardinia'),
  corseDuSud.first().set('Region', 'France – Provence-Alpes-Côte d\'Azur'),
  valencia.first().set('Region', 'Spain – Valenciana'),
  beirasCentro.first().set('Region', 'Portugal – Beiras/Centro'),
  nicosia.first().set('Region', 'Cyprus – Nicosia')
]);

// Zonal stats per region
var calculateArea = function(feature) {
  var region = feature.geometry();
  var stats = remapped.reduceRegion({
    reducer: ee.Reducer.frequencyHistogram(),
    geometry: region,
    scale: 100,
    maxPixels: 1e9
  });
  var hist = ee.Dictionary(stats.get('level1'));
  var totalPixels = hist.values().reduce(ee.Reducer.sum());
  
  // Add % area per class
  var proportions = hist.map(function(key, val) {
    return ee.Number(val).divide(totalPixels).multiply(100);
  });

  return feature.set(proportions).set('TotalPixels', totalPixels);
};

// Apply the function
var results = regions.map(calculateArea);

// Print to console
print('Proportional area by CORINE Level 1:', results);

// Export to CSV
Export.table.toDrive({
  collection: results,
  description: 'CORINE_Level1_ZonalStats',
  folder: 'desirmed',
  fileFormat: 'CSV'
});
