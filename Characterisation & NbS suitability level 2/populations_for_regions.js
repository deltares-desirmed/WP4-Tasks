// ==============================
// 1. Load Administrative Boundaries
// ==============================
var adm0 = ee.FeatureCollection("projects/sat-io/open-datasets/geoboundaries/CGAZ_ADM0");
var adm1 = ee.FeatureCollection("projects/sat-io/open-datasets/geoboundaries/CGAZ_ADM1");
var adm2 = ee.FeatureCollection("projects/sat-io/open-datasets/geoboundaries/CGAZ_ADM2");

// ==============================
// 2. Define Regions
// ==============================
// Italy – Potenza (ADM2)
var potenza = adm2.filter(ee.Filter.eq('shapeName', 'Potenza'))
                  .filterBounds(adm1.filter(ee.Filter.eq('shapeName', 'Basilicata')))
                  .first().set('Region', 'Italy – Potenza');

// Greece – Macedonia-Thrace (ADM1)
var macedoniaThrace = adm1.filter(ee.Filter.eq('shapeName', 'Macedonia-Thrace'))
                           .filterBounds(adm0.filter(ee.Filter.eq('shapeName', 'Greece')))
                           .first().set('Region', 'Greece – Macedonia-Thrace');

// Croatia – Split-Dalmatia (ADM1)
var splitDalmatia = adm1.filter(ee.Filter.eq('shapeName', 'Split-Dalmatia'))
                         .filterBounds(adm0.filter(ee.Filter.eq('shapeName', 'Croatia')))
                         .first().set('Region', 'Croatia – Split-Dalmatia');

// Italy – Sardinia (ADM1)
var sardinia = adm1.filter(ee.Filter.eq('shapeName', 'Sardegna'))
                   .filterBounds(adm0.filter(ee.Filter.eq('shapeName', 'Italy')))
                   .first().set('Region', 'Italy – Sardinia');

// France – Provence-Alpes-Côte d'Azur (ADM1)
var corseDuSud = adm1.filter(ee.Filter.eq('shapeName', "Provence-Alpes-Côte d'Azur"))
                     .filterBounds(adm0.filter(ee.Filter.eq('shapeName', 'France')))
                     .first().set('Region', 'France – Provence-Alpes-Côte d\'Azur');

// Spain – Valenciana (ADM1)
var valencia = adm1.filter(ee.Filter.eq('shapeName', 'Comunitat Valenciana'))
                   .filterBounds(adm0.filter(ee.Filter.eq('shapeName', 'Spain')))
                   .first().set('Region', 'Spain – Valenciana');

// Portugal – Beiras/Centro (union of 4 ADM1s)
var centroRegions = adm1.filterBounds(adm0.filter(ee.Filter.eq('shapeName', 'Portugal')))
                        .filter(ee.Filter.inList('shapeName', [
                          'CASTELO BRANCO', 'GUARDA', 'COIMBRA', 'VISEU'
                        ]));
var beirasCentro = centroRegions.union().geometry();
var beirasFeature = ee.Feature(beirasCentro, {'Region': 'Portugal – Beiras/Centro'});

// Cyprus – Nicosia (ADM1)
var nicosia = adm1.filter(ee.Filter.eq('shapeName', 'Nicosia'))
                  .filterBounds(adm0.filter(ee.Filter.eq('shapeName', 'Cyprus')))
                  .first().set('Region', 'Cyprus – Nicosia');

// Combine all regions into FeatureCollection
var regions = ee.FeatureCollection([
  potenza, macedoniaThrace, splitDalmatia, sardinia,
  corseDuSud, valencia, beirasFeature, nicosia
]);

// ==============================
// 3. Define Time Range (1975 to 2030)
// ==============================
// Define years on the client side
var years = ee.List.sequence(1975, 2030, 5).getInfo(); // client-side list
var allFeatures = [];

years.forEach(function (year) {
  var image = ee.Image("projects/sat-io/open-datasets/GHS/GHS_POP/GHS_POP_E" + year + "_GLOBE_R2023A_54009_100_V1_0")
                .select('b1');

  var stats = image.reduceRegions({
    collection: regions,
    reducer: ee.Reducer.sum().setOutputs(['Population']),
    scale: 100,
  });

  stats = stats.map(function (f) {
    return f.set('Year', year);
  });

  allFeatures.push(stats);
});

var longFormatCollection = ee.FeatureCollection(allFeatures).flatten();
print('Long-format Region-Year Pop Stats:', longFormatCollection);

// Export as long format CSV
Export.table.toDrive({
  collection: longFormatCollection,
  description: 'ZonalPop_LongFormat_1975_2030',
  folder: 'desirmed',
  fileFormat: 'CSV'
});

