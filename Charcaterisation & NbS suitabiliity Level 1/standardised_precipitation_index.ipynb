import os
import re
import time
import ee
import xarray as xr
import rioxarray as rxr
import climate_indices
from climate_indices import indices
import matplotlib.pyplot as plt
import geopandas as gpd
import numpy as np

# Set connection pool size for Earth Engine to avoid warnings
os.environ['PYTHON_EE_CONNECTION_POOL_SIZE'] = '50'

# Define input and output directories
data_folder = 'data'
output_folder = 'output'

os.makedirs(data_folder, exist_ok=True)
os.makedirs(output_folder, exist_ok=True)

# Function to download a file from a URL if not already present
def download(url):
    filename = os.path.join(data_folder, os.path.basename(url))
    if not os.path.exists(filename):
        from urllib.request import urlretrieve
        local, _ = urlretrieve(url, filename)
        print('Downloaded:', local)

# Download a shapefile from Natural Earth
data_url = 'https://naciscdn.org/naturalearth/10m/cultural/'
shapefile = 'ne_10m_admin_0_countries_ind.zip'
download(data_url + shapefile)

# Initialize Earth Engine
cloud_project = 'ee-desmond'

try:
    ee.Initialize(project=cloud_project, opt_url='https://earthengine-highvolume.googleapis.com')
except Exception:
    ee.Authenticate()
    ee.Initialize(project=cloud_project, opt_url='https://earthengine-highvolume.googleapis.com')

# Load shapefile and extract India
shapefile_path = os.path.join(data_folder, shapefile)
gdf = gpd.read_file(shapefile_path, encoding='utf-8')

# Select one country by ISO code — uncomment only the one you want to use

# country = gdf[gdf['SOV_A3'] == 'PRT']   # Portugal
country = gdf[gdf['SOV_A3'] == 'ITA']   # Italy
# country = gdf[gdf['SOV_A3'] == 'FRA']   # France
# country = gdf[gdf['SOV_A3'] == 'HRV']   # Croatia
# country = gdf[gdf['SOV_A3'] == 'CYP']   # Cyprus
# country = gdf[gdf['SOV_A3'] == 'ESP']     # Spain


# Define Earth Engine ERA5 dataset and filter by date
era5 = ee.ImageCollection('ECMWF/ERA5_LAND/MONTHLY_AGGR') \
    .filter(ee.Filter.date('2000-01-01', '2025-01-01')) \
    .select('total_precipitation_sum')

# Convert country geometry to EE and get bounds
geometry = country.geometry.union_all()
bounds = geometry.bounds

# ⚠ This part may not work without a custom xarray engine. Replace as needed.

ds = xr.open_dataset(
    era5,
    engine='ee',
    projection=era5.first().select(0).projection(),
    geometry=bounds
)

# Extract and preprocess data
da = ds.total_precipitation_sum
da = da.sortby(['lat', 'lon']).fillna(0.0)

# Group data by pixel for SPI computation
da_precip_groupby = da.stack(pixel=('lat', 'lon')).groupby('pixel')

# SPI configuration
scale = 3
distribution = climate_indices.indices.Distribution.gamma
data_start_year = 2000
calibration_year_initial = 2000
calibration_year_final = 2024
periodicity = climate_indices.compute.Periodicity.monthly

# Function to calculate SPI for a pixel
def calculate_spi(group):
    spi_values = climate_indices.indices.spi(
        group.values,
        scale,
        distribution,
        data_start_year,
        calibration_year_initial,
        calibration_year_final,
        periodicity
    )
    return xr.DataArray(spi_values, coords={'time': group.time}, dims=['time'])

# --- TIMED SPI calculation ---
start = time.time()

da_spi = da_precip_groupby.apply(calculate_spi)

end = time.time()
print(f"SPI calculation completed in {end - start:.2f} seconds")

# Convert back to 2D
da_spi = da_spi.unstack('pixel')

# Plot SPI for a specific year
selected = da_spi.sel(time='2024')
legend_levels = [-3, -2, -1, 0, 1, 2, 3]

# Plot with more visible context
selected.plot(
    cmap='RdBu',
    col='time',
    col_wrap=4,
    levels=legend_levels,
    aspect=1.2
)

# Set spatial extent to cover all of Croatia with some buffer
# Automatically zoom to each country — uncomment as needed

# Portugal
# plt.xlim(-10.0, -6.0)   # Longitude range
# plt.ylim(36.5, 42.5)    # Latitude range

# Italy
plt.xlim(6.0, 19.0)
plt.ylim(36.0, 47.5)

# France
# plt.xlim(-5.0, 9.5)
# plt.ylim(41.0, 51.5)

# Croatia
# plt.xlim(13.0, 20.5)
# plt.ylim(42.0, 47.0)

# Cyprus
# plt.xlim(32.0, 34.0)
# plt.ylim(34.5, 35.7)

# Spain
# plt.xlim(-9.5, 4.5)
# plt.ylim(36.0, 44.5)

# plt.suptitle("Standardized Precipitation Index", fontsize=16)
plt.show()