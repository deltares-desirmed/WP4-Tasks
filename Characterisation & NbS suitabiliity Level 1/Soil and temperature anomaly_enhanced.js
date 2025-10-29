var world = ee.FeatureCollection('projects/sat-io/open-datasets/FAO/GAUL/GAUL_2024_L2');

/*
title: anomalies time series analysis of soil moisture and precipitation over a river basin
description: this script uses NASA-USDA Enhanced SMAP soil moisture and ERA5 precipitation to extract soil moisture and precipitation information for identifying prolonged drought in a river basin.

Original Author: nasa-gsfc-soilmoisture
Modified by: Desmond Lartey for the meditaranean region with ERA 5 precipitation data
Note: The coldness/wettest of both indices decreses with ERA5 data upon checks

We demonstrates the value of NASA's Earth observation in detecting prolonged droughts for areas
where in-situ measurements are not available or are inaccessible. We simply used anomalies of soil moisture (surface and sursurface)
as well as temperature to highlight drought periods during 2020-2021 where negative anomalies were observed persistently for months.
*/

// 1. Importing boundary
/*

*/
var basin_boundary = ee.FeatureCollection(
    'projects/ee-desmond/assets/desirmed/split_dalmatia_county_border');

// Add basin boundary in the map.
Map.addLayer(basin_boundary, {}, 'Area of interest');
Map.centerObject(basin_boundary, 7);

// 2. Importing soil moisture and temperature datasets
/*
The NASA-USDA Enhanced SMAP dataset integrates SMAP Level 2 soil moisture observations into 
a modified Palmer model using a 1-D Ensemble Kalman Filter, improving model-based soil moisture 
estimation, especially in areas with limited precipitation instruments.

ERA5-Land monthly averaged data from ECMWF provides high-resolution (0.1°) reanalysis variables, 
including air temperature at 2 meters above ground level, suitable for analyzing temperature 
variability and heat anomalies that can intensify drought conditions.
*/

// Enhanced soil moisture datasets
var nasa_usda_smap = ee.ImageCollection('NASA_USDA/HSL/SMAP10KM_soil_moisture');

// ERA5-Land monthly averaged 2m air temperature (Kelvin)
var era5_temp = ee.ImageCollection('ECMWF/ERA5_LAND/MONTHLY')
  .select('temperature_2m');

// 3. Define study period and functions
var startYear = 2001;
var endYear = 2022;
var startMonth = 1;
var endMonth = 12;

var startDate = ee.Date.fromYMD(startYear, startMonth, 1);
var endDate = ee.Date.fromYMD(endYear, endMonth, 31);
var years = ee.List.sequence(startYear, endYear);
var months = ee.List.sequence(1, 12);

// Convert Kelvin to Celsius
var kelvinToCelsius = function(image) {
  return image.subtract(273.15)
              .copyProperties(image, ['system:time_start']);
};

// Define a function to compute the anomaly for a given month
var computeAnomalyTemperature = function(image) {
  var year = image.date().get('year');
  var month = image.date().get('month');
  var referenceImage = meanMonthlyTemperature.filter(ee.Filter.eq('month', month)).first();
  var hasBands = image.bandNames().size().gt(0);
  var anomalyImage = ee.Algorithms.If(
    hasBands,
    image.subtract(referenceImage),
    image);
  return ee.Image(anomalyImage).set('system:time_start', ee.Date.fromYMD(year, month, 1).millis());
};

// 4. Processing soil moisture datasets (same as before)
var ssSusMa = nasa_usda_smap
  .filterDate(startDate, endDate)
  .sort('system:time_start', true)
  .select(['ssma', 'susma']);

var monthlySsSusMa = ee.ImageCollection.fromImages(
  years.map(function(y) {
    return months.map(function(m) {
      var filtered = ssSusMa.filter(ee.Filter.calendarRange(y, y, 'year'))
                         .filter(ee.Filter.calendarRange(m, m, 'month'))
                         .mean();
      return filtered.set('system:time_start', ee.Date.fromYMD(y, m, 1).millis());
    });
  }).flatten()
);

// 5. Processing ERA5 temperature datasets
var rawMonthlyTemperature = era5_temp
  .filterDate(startDate, endDate)
  .sort('system:time_start', true)
  .map(kelvinToCelsius); // Convert Kelvin to °C

var monthlyTemperature = ee.ImageCollection.fromImages(
  years.map(function(y) {
    return months.map(function(m) {
      var filtered = rawMonthlyTemperature
                          .filter(ee.Filter.calendarRange(y, y, 'year'))
                          .filter(ee.Filter.calendarRange(m, m, 'month'))
                          .mean();
      return filtered.set({
        'month': m,
        'system:time_start': ee.Date.fromYMD(y, m, 1).millis()
      });
    });
  }).flatten()
);

// Compute climatological monthly temperature
var meanMonthlyTemperature = ee.ImageCollection.fromImages(
  ee.List.sequence(1, 12).map(function(m) {
    var filtered = monthlyTemperature.filter(ee.Filter.eq('month', m)).mean();
    return filtered.set('month', m);
  })
);

// Compute monthly temperature anomalies
var monthlyTemperatureAnomalies = monthlyTemperature.map(computeAnomalyTemperature);



// 6. Plot anomalies time series for both soil moisture and precipitation
/*
Use the ui.Chart.image.series() function to extract the time series of
soil moisture or temperature pixel values from the soil moisture or precipitation image
and display the chart.

Create a plot that displays three anomaly time series for surface and subsurface soil moisture
and precipitation, with soil moisture values on the primary y-axis and precipitation values
on the secondary y-axis.

This anomalies timeseries analysis presents the overlap period between these two datasets,
which could span from April 2015 to September 2021 or beyond from your descretion.
*/

// Combine soil moisture and temperature anomaly collections
var smTempDatasets = monthlySsSusMa.combine(monthlyTemperatureAnomalies);


var chart =
  ui.Chart.image.series({
      imageCollection: smTempDatasets,
      region: basin_boundary,
      scale: 10000,
      xProperty: 'system:time_start'
    })
    .setSeriesNames(['surface SM', 'subsurface SM', 'temperature'])
    .setOptions({
      title: 'Anomalies time series: surface soil moisture, sub-surface soil ' +
       'moisture, and temperature',
      series: {
        0: {
            targetAxisIndex: 0, type: 'line', lineWidth: 3,
            pointSize: 1, color: '#ffc61a'
        },
        1: {
            targetAxisIndex: 0, type: 'line', lineWidth: 3, pointSize: 1,
            lineDashStyle: [2, 2], color: '#330000'
        },
        2: {
            targetAxisIndex: 1, type: 'line', lineWidth: 3, pointSize: 1,
            lineDashStyle: [4, 4], color: '#ff0000'  // 
        },
      },
      hAxis: {
        title: 'Date',
        titleTextStyle: {italic: false, bold: true}
      },
      vAxes: {
        0: {
            title: 'soil moisture (mm)',
            baseline: 0, titleTextStyle: {bold: true, color: '#ffc61a'},
            viewWindow: {min: -4, max: 4}
        },
        1: {
            title: 'temperature (°C)',
            baseline: 0, titleTextStyle: {bold: true, color: '#ff0000'},
            viewWindow: {min: -2.5, max: 2.5}
        }
      },
      curveType: 'function'
    });

print(chart);



// 7. Plot spatial distribution of soil moisture and precipitation anomalies
/*
The following scripts investigate spatial variations in these variables across the studied basin during that month.
Pixels with more brown color have more negative values
*/

// Setup colors for soil moisture anomalies.
var palette = ['8c510a', 'bf812d', 'dfc27d', 'f6e8c3', 'ffffff',
               'ffffff', 'c7eae5','80cdc1','35978f','01665e'];
var smVis = {
  min: -4,
  max: 4,
  opacity: 0.9,
  palette: palette,
};
// Setup colors for precipitation anomalies.
var TemVis = {
  min: -3,
  max: 3,
  opacity: 0.9,
  palette: palette,
};
// Filter soil moisture to May 2021, subset first image, and clip to AOI.
var thisSsSusMa = monthlySsSusMa.filterDate(
  '2021-05-01', '2021-05-31').first().clip(basin_boundary);
// Filter precipitation to May 2021, subset first image, and clip to AOI.
var thisTem = monthlyTemperatureAnomalies.filterDate(
  '2021-05-01', '2021-05-31').first().clip(basin_boundary);

// Display the images on the map.
Map.addLayer(thisSsSusMa.select('ssma'), smVis, 'Surface Soil Moisture');
Map.addLayer(thisSsSusMa.select('susma'), smVis, 'Subsurface Soil Moisture');
Map.addLayer(thisTem, TemVis, 'Temperature');

// 8. Remarks
/*


This workflow provides a practical approach for other regions which have similar limited-ground problems
as the Mosul River does. There are, however, limited timeframes for NASA-USDA Enhanced SMAP and ERA5
monthly products. In lieu of real-time products, you can use NASA SMAP L3, SMAP L4,
and GPM IMERG Late products instead.
*/


// 9. References
/*
A 3,400-year-old city in Iraq emerges from underwater after an extreme drought.
https://www.cnn.com/2022/06/20/world/iraq-city-unearthed-drought-scn/index.html.
Accessed Date: Mar 20, 2023

Albarakat, R., Le, M. H., & Lakshmi, V.,2022. Assessment of drought conditions over
Iraqi transboundary rivers using FLDAS and satellite datasets.
Journal of Hydrology: Regional Studies, 41, 101075. doi: 10.1016/j.ejrh.2022.101075

Sazib, N., Mladenova, I. and Bolten, J., 2018. Leveraging the google earth engine
for drought assessment using global soil moisture data. Remote sensing, 10(8):
1265. doi:10.3390/rs10081265

Hersbach, H., Bell, B., Berrisford, P., et al. (2020). The ERA5 global reanalysis.
Quarterly Journal of the Royal Meteorological Society, 146(730), 1999-2049.
*/