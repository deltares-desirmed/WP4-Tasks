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



//Export the images to your Google Drive
Export.image.toDrive({
  image: srtm,
  description: 'SRTM_Elevation_Cantabria',
  folder: 'desirmed',
  scale: 30,
  region: cantabria,
  maxPixels: 1e9
});