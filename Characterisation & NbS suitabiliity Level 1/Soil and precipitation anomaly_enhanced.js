var world = ee.FeatureCollection('projects/sat-io/open-datasets/FAO/GAUL/GAUL_2024_L2');

/*
title: anomalies time series analysis of soil moisture and precipitation over a river basin
description: this script uses NASA-USDA Enhanced SMAP soil moisture and ERA5 precipitation to extract soil moisture and precipitation information for identifying prolonged drought in a river basin.

Original Author: nasa-gsfc-soilmoisture
Modified by: Desmond Lartey for the meditaranean region with ERA 5 precipitation data
Note: The drieness of both indices decreses with ERA5 data

We demonstrates the value of NASA's Earth observation in detecting prolonged droughts
where in-situ measurements are not available or are inaccessible. We simply used anomalies of soil moisture (surface and sursurface)
as well as precipitation to highlight drought periods during 2020-2021 where negative anomalies were observed persistently for months.
*/

// 1. Importing boundary
/*

*/
var basin_boundary = ee.FeatureCollection(
    'projects/ee-desmond/assets/desirmed/split_dalmatia_county_border');

// Add basin boundary in the map.
Map.addLayer(basin_boundary, {}, 'Area of interest');
Map.centerObject(basin_boundary, 7);

// 2. Importing soil moisture and precipitation datasets
/*
The NASA-USDA Enhanced SMAP dataset integrates SMAP Level 2 soil moisture observations into
a modified Palmer model using a 1-D Ensemble Kalman Filter, improving model-based soil moisture
estimation, especially in areas  with a lack of quality precipitation instruments. In this demonstration,
we used surface and subsurface soil moisture, which are available from April 2015 to August 2022.

The ERA5 dataset provides global reanalysis data from the European Centre for Medium-Range Weather Forecasts (ECMWF).
In this demonstration, we used monthly total precipitation from the ERA5-Land monthly averaged data,
which is available from 1979 to near real-time.
*/

// Enhanced soil moisture datasets.
var nasa_usda_smap = ee.ImageCollection('NASA_USDA/HSL/SMAP10KM_soil_moisture');

// Precipitation datasets (ERA5 Monthly Total Precipitation).
var era5_precipitation = ee.ImageCollection('ECMWF/ERA5/MONTHLY');

// 3. Define study period and functions
// Define study period.
var startYear = 2001;
var endYear = 2022;
var startMonth = 1;
var endMonth = 12;

var startDate = ee.Date.fromYMD(startYear, startMonth, 1);
var endDate = ee.Date.fromYMD(endYear, endMonth, 31);
var years = ee.List.sequence(startYear, endYear);
var months = ee.List.sequence(1, 12);

// Define a function to convert ERA5 total precipitation from meters/month to mm/day.
var era5Scale = function(image) {
  // Select the total_precipitation band.
  var precip_meters = image.select('total_precipitation');

  // Calculate the number of days in the month for accurate scaling.
  // Get the first day of the current month.
  var startOfMonth = image.date().update(null, null, 1);
  // Get the first day of the next month.
  var endOfMonth = startOfMonth.advance(1, 'month');
  // Calculate the difference in days.
  var daysInMonth = endOfMonth.difference(startOfMonth, 'day');

  // Convert meters to mm and then divide by days in month to get mm/day.
  var precip_mm_per_day = precip_meters.multiply(1000).divide(daysInMonth);
  return precip_mm_per_day.rename('precipitation') // Rename band to 'precipitation' for consistency with original script logic.
                          .copyProperties(image, ['system:time_start']);
};

// Define a function to compute the anomaly for a given month.
var computeAnomalyPrecipitation = function(image) {
  // Get the month of the image.
  var year = image.date().get('year');
  var month = image.date().get('month');
  // Get the corresponding reference image for the month.
  var referenceImage = meanMonthlyPrecipitation.filter(
      ee.Filter.eq('month', month)).first();
  // Check if the images have bands
  var hasBands = image.bandNames().size().gt(0);
  // Compute the anomaly by subtracting reference image from input image.
  var anomalyImage = ee.Algorithms.If(
    hasBands,
    image.subtract(referenceImage),
    image);

  return ee.Image(anomalyImage).set(
    'system:time_start', ee.Date.fromYMD(year, month, 1).millis());
};

// 4. Processing soil moisture datasets
/*
we directly use  anomalies products from NASA-USDA Enhanced SMAP soil moisture
*/

// Anomalies surface and subsurface soil moisture (mm).
var ssSusMa =  nasa_usda_smap
  .filterDate(startDate, endDate)
  .sort('system:time_start', true)  // sort a collection in ascending order
  .select(['ssma', 'susma']);  // surface and subsurface soil moisture bands

// Compute monthly anomalies surface and subsurface soil moisture.
var monthlySsSusMa =  ee.ImageCollection.fromImages(
  years.map(function(y) {
    return months.map(function(m) {
      var filtered = ssSusMa.filter(ee.Filter.calendarRange(y, y, 'year'))
                         .filter(ee.Filter.calendarRange(m, m, 'month'))
                         .mean();
      return filtered.set(
        'system:time_start', ee.Date.fromYMD(y, m, 1).millis());
    });
  }).flatten()
);

// 5. Processing precipitation datasets
/*
ERA5 does not have an anomalies product. To calculate anomalies monthly precipitation timeseries
from a monthly precipitation timeseries, subtract the mean value of each month across all years from the original
value of that month in each year.
*/

// Precipitation from monthly ERA5 total precipitation (mm/day).
var rawMonthlyPrecipitation =
  era5_precipitation
  .select('total_precipitation') // Select the total_precipitation band from ERA5
  .filterDate(startDate, endDate)
  .sort('system:time_start', true)
  .map(era5Scale); // convert rainfall unit from meters/month to mm/d

// Make sure monthly precipitation has same duration as soil moisture.
var monthlyPrecipitation =  ee.ImageCollection.fromImages(
  years.map(function(y) {
    return months.map(function(m) {
      var filtered = rawMonthlyPrecipitation
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

// Compute climatological monthly precipitation.
var meanMonthlyPrecipitation = ee.ImageCollection.fromImages(
  ee.List.sequence(1, 12).map(function(m) {
    var filtered = monthlyPrecipitation.filter(ee.Filter.eq('month', m)).mean();
    return filtered.set('month', m);
  })
);

// Map the function over the monthly precipitation collection to compute
// the anomaly precipitation for each month.
var monthlyPrecipitationAnomalies = monthlyPrecipitation.map(
    computeAnomalyPrecipitation);


// 6. Plot anomalies time series for both soil moisture and precipitation
/*
Use the ui.Chart.image.series() function to extract the time series of
soil moisture or precipitaton pixel values from the soil moisture or precipitation image
and display the chart.

Create a plot that displays three anomaly time series for surface and subsurface soil moisture
and precipitation, with soil moisture values on the primary y-axis and precipitation values
on the secondary y-axis.

This anomalies timeseries analysis presents the overlap period between these two datasets,
which could span from April 2015 to September 2021 or beyond from your descretion.
*/

// Combine two image collections into one collection.
var smpreDatasets  = monthlySsSusMa.combine(monthlyPrecipitationAnomalies);
print('soil moisture and precipitation', smpreDatasets);

var chart =
  ui.Chart.image.series({
      imageCollection: smpreDatasets,
      region: basin_boundary,
      scale: 10000,
      xProperty: 'system:time_start'
    })
    .setSeriesNames(['surface SM', 'subsurface SM', 'precipitation'])
    .setOptions({
      title: 'Anomalies time series: surface soil moisture, sub-surface soil ' +
       'moisture, and precipitation',
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
            lineDashStyle: [4, 4], color: '#1a1aff'
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
            title: 'precipitation (mm)',
            baseline: 0, titleTextStyle: {bold: true, color: '#1a1aff'},
            viewWindow: {min: -2.5, max: 2.5}
        }
      },
      curveType: 'function'
    });

print(chart);

// 7. Plot spatial distribution of soil moisture and precipitation anomalies
/*
Based on the timeseries anomalies chart, we detected the most negative anomalies
in soil moisture and precipitation in May 2021. The following scripts investigate
spatial variations in these variables across the studied basin during that month.
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
var preVis = {
  min: -3,
  max: 3,
  opacity: 0.9,
  palette: palette,
};
// Filter soil moisture to May 2021, subset first image, and clip to AOI.
var thisSsSusMa = monthlySsSusMa.filterDate(
  '2021-05-01', '2021-05-31').first().clip(basin_boundary);
// Filter precipitation to May 2021, subset first image, and clip to AOI.
var thisPre = monthlyPrecipitationAnomalies.filterDate(
  '2021-05-01', '2021-05-31').first().clip(basin_boundary);

// Display the images on the map.
Map.addLayer(thisSsSusMa.select('ssma'), smVis, 'Surface Soil Moisture');
Map.addLayer(thisSsSusMa.select('susma'), smVis, 'Subsurface Soil Moisture');
Map.addLayer(thisPre, preVis, 'Precipitation');

// 8. Remarks
/*


This workflow provides a practical approach for other regions which have similar limited-ground problems. There are, however, limited timeframes for NASA-USDA Enhanced SMAP and ERA5
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