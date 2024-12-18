// Load the asset
var lulc2012 = ee.FeatureCollection('projects/ee-desmond/assets/lulc2012_Croatiafinal');
var lulc2018 = ee.FeatureCollection('projects/ee-desmond/assets/lulc2018_Croatiafinal');

// Define Croatia's coastal bounds
var croatiaCoastalBounds = ee.Geometry.Polygon([
  [13.5, 44.0], [18.5, 44.0], [18.5, 42.0], [13.5, 42.0], [13.5, 44.0]
]);

// Filter the datasets to Croatia's coastal region
var coastalLulc2012 = lulc2012.filterBounds(croatiaCoastalBounds);
var coastalLulc2018 = lulc2018.filterBounds(croatiaCoastalBounds);


var landscapeArchetypes = {
  // Urban: Highly urbanized areas including industrial, commercial, and residential zones.
  '1': {
    classes: ['11110', '11120', '11130', '11210', '11220', '12100', '12200'],
    color: '#636363',
    description: 'Urban' // Includes continuous and dense urban fabric, low-density fabric, and industrial zones
  },

  // Coastal Urban: Urbanized areas near coastlines, including ports and airports.
  '2': {
    classes: ['12310', '12320', '12330', '12340', '12350', '12360', '12370', '12400'],
    color: '#969696',
    description: 'Coastal Urban' // Includes cargo ports, passenger ports, fishing ports, naval ports, marinas, multifunctional harbours, shipyards, and airports
  },

  // Industrial: Areas heavily modified by human activity, including industrial sites and urban infrastructure.
  '3': {
    classes: ['13110', '13120', '13130', '13200'],
    color: '#cccccc',
    description: 'Industrial' // Includes mineral extraction sites, dump sites, construction sites, and land without current use
  },

  // Recreational & Leisure Areas: Green urban spaces, parks, and leisure areas.
  '4': {
    classes: ['14000'],
    color: '#91d700',
    description: 'Recreational & Leisure Areas' // Includes green urban areas and sports facilities
  },

  // Rural (Riparian Zone, Floodplain, Interfluvium Flat Areas): Agricultural and flat areas.
  '5': {
    classes: ['21100', '21200', '23300', '23400'],
    color: '#91d700',
    description: 'Rural (Riparian Zone, Floodplain, Interfluvium Flat Areas)' // Includes arable land, greenhouses, agro-forestry, and semi-natural grasslands
  },

  // Rural (Hillside, Interfluvium Hilly Areas): Agricultural areas in hilly terrain.
  '6': {
    classes: ['23100', '23200', '22200', '22100'],
    color: '#df9f00',
    description: 'Rural (Hillside, Interfluvium Hilly Areas)' // Includes annual crops, complex cultivation patterns, olive groves, and vineyards
  },

  // Forested: Predominantly forested areas with various tree species.
  '7': {
    classes: ['31100', '31200', '31300', '32100', '32200', '33100', '33200', '34000'],
    color: '#80ff00',
    description: 'Forested' // Includes broad-leaved, coniferous, and mixed forests
  },

  // Mountainous (Hillside, Hollow/Torrent): Rugged terrains and sparsely vegetated regions.
  '8': {
    classes: ['35000', '36000', '41000', '42100'],
    color: '#a63603',
    description: 'Mountainous (Hillside, Hollow/Torrent)' // Includes lines of trees, damaged forests, and sparsely vegetated areas
  },

  // Rural: Miscellaneous agricultural or low-density natural areas.
  '9': {
    classes: ['42200', '51000', '52000', '53000', '61100'],
    color: '#78c679',
    description: 'Rural' // Includes heathland, scrubland, and sparse vegetation
  },

  // Coastal (Beach-Dune System, Coastal Land-Claim Areas): Sandy and reclaimed areas.
  '10': {
    classes: ['62111', '62112', '62120', '61100'],
    color: '#ffcc99',
    description: 'Coastal (Beach-Dune System, Coastal Land-Claim Areas)' // Includes sandy beaches, shingle beaches, dunes, and bare rocks
  },

  // Coastal Rural (Estuary, Polder): Low-lying coastal and estuarine rural regions.
  '11': {
    classes: ['62200', '63120', '63200'],
    color: '#7fff00',
    description: 'Coastal Rural (Estuary, Polder)' // Includes riverbanks, coastal cliffs, and burnt areas
  },

  // Wetlands & Marshes: Coastal and inland marshy areas.
  '12': {
    classes: ['71100', '71210', '71220', '72100', '72200', '72300', '63300'],
    color: '#a6e6ff',
    description: 'Wetlands & Marshes' // Includes inland marshes, peat bogs, salt marshes, and intertidal flats
  },

  // Inland Water Bodies: Lakes, reservoirs, and water courses inland.
  '13': {
    classes: ['81100', '81200', '81300', '82100', '82200', '82300', '82400'],
    color: '#4da6ff',
    description: 'Inland Water Bodies' // Includes lakes, reservoirs, aquaculture ponds, and water courses
  },

  // Marine (Subtidal Coast): Marine regions and coastal waters.
  '14': {
    classes: ['83100', '83200', '83300', '84100', '84200'],
    color: '#00bfff',
    description: 'Marine (Subtidal Coast)' // Includes lagoons, estuaries, marine inlets, and coastal waters
  }
};


// Create fromList and toList for remapping
var fromList = [];
var toList = [];
var palette = [];
var descriptions = [];

Object.keys(landscapeArchetypes).forEach(function(archetypeId) {
  var archetype = landscapeArchetypes[archetypeId];
  var archetypeIdInt = parseInt(archetypeId);
  var classes = archetype.classes;
  classes.forEach(function(classCode) {
    fromList.push(parseInt(classCode));
    toList.push(archetypeIdInt);
  });
  palette.push(archetype.color);
  descriptions.push(archetype.description);
});

// Reduce the 2012 FeatureCollection to an image of 'CODE_5_12'
var codeImage2012 = coastalLulc2012.reduceToImage({
  properties: ['CODE_5_12'],
  reducer: ee.Reducer.first()
}).rename('code2012');

// Reduce the 2018 FeatureCollection to an image of 'CODE_5_18'
var codeImage2018 = coastalLulc2018.reduceToImage({
  properties: ['CODE_5_18'],
  reducer: ee.Reducer.first()
}).rename('code2018');

// Remap the 'CODE_5_12' and 'CODE_5_18' values to 'archetypeId'
var archetypeImage2012 = codeImage2012.remap(fromList, toList).rename('archetype2012');
var archetypeImage2018 = codeImage2018.remap(fromList, toList).rename('archetype2018');

// Mask out any pixels not in the 'toList' (i.e., archetypes)
archetypeImage2012 = archetypeImage2012.updateMask(archetypeImage2012.neq(0));
archetypeImage2018 = archetypeImage2018.updateMask(archetypeImage2018.neq(0));

// Add the reclassified raster layers to the map
Map.addLayer(archetypeImage2012.clip(croatiaCoastalBounds), {min: 1, max: 14, palette: palette}, 'Reclassified Landscape Archetypes 2012');
Map.addLayer(archetypeImage2018.clip(croatiaCoastalBounds), {min: 1, max: 14, palette: palette}, 'Reclassified Landscape Archetypes 2018');

// Center the map on Croatia's coastal region
Map.centerObject(croatiaCoastalBounds, 12);

// Create the legend container
var legend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px',
    backgroundColor: '#f0f0f0'
  }
});

legend.add(ui.Label({
  value: 'Landscape Archetypes',
  style: {fontWeight: 'bold', fontSize: '14px', margin: '0 0 8px 0'}
}));

for (var i = 0; i < descriptions.length; i++) {
  var colorBox = ui.Label({
    style: {
      backgroundColor: palette[i],
      padding: '8px',
      margin: '0 8px 8px 0'
    }
  });
  var label = ui.Label({
    value: descriptions[i],
    style: {margin: '0 0 8px 0'}
  });
  legend.add(ui.Panel({
    widgets: [colorBox, label],
    layout: ui.Panel.Layout.Flow('horizontal')
  }));
}

// Add the legend to the map
Map.add(legend);