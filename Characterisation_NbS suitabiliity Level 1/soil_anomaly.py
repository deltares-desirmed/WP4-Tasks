#import os
#import requests
#import xarray as xr

# 1. Download soil moisture anomaly data from NOAA and save locally
# filename = 'soilw.mon.mean.v2.nc'
# url = 'http://psl.noaa.gov/thredds/dodsC/Datasets/cpcsoil/soilw.mon.mean.v2.nc'

## Download only if the file doesn't already exist
#if not os.path.exists(filename):
#    print(f"Downloading {filename}...")
#    response = requests.get(url)
#    with open(filename, 'wb') as f:
#        f.write(response.content)
#    print("Download complete.")
#else:
#    print(f"{filename} already exists. Skipping download.")

## 2. Load the dataset from the local file
#ds = xr.open_dataset(filename)
#soilw = ds['soilw']




import xarray as xr
import matplotlib.pyplot as plt
import cartopy.crs as ccrs
import pandas as pd
import os

# 1. Load dataset without dask
file_path = r"C:\Users\spinosa\Downloads\soilw.mon.mean.v2.nc"
ds = xr.open_dataset(file_path)

# 2. Fix longitude format
soilw = ds['soilw']
soilw.coords['lon'] = (soilw.coords['lon'] + 180) % 360 - 180
soilw = soilw.sortby('lon')

# 3. Extract only 2024 data FIRST (to reduce memory usage)
soilw_2024 = soilw.sel(time=soilw['time.year'] == 2024)

# 4. Compute monthly climatology from 1971–2000
climatology = soilw.sel(time=slice('1971', '2000')).groupby('time.month').mean('time')

# 5. Compute anomaly for 2024 only
anomaly2024 = soilw_2024.groupby('time.month') - climatology

# 6. Set up the plot with EqualEarth projection
projection = ccrs.EqualEarth()
fig, axes = plt.subplots(6, 2, sharex=True, sharey=True,
                         constrained_layout=True,
                         subplot_kw={'projection': projection})
fig.set_size_inches(11.7, 16.5)

# 7. Loop through each month and plot
for index, ax in enumerate(axes.flat):
    if index < anomaly2024.sizes['time']:
        data = anomaly2024.isel(time=index)
        im = data.plot(
            ax=ax,
            transform=ccrs.PlateCarree(),
            cmap='Spectral',
            vmin=-200, vmax=200,
            add_colorbar=False, add_labels=False
        )
        title = pd.to_datetime(data.time.values).strftime('%Y-%b')
        ax.set_title(title, fontsize=9)
        ax.set_aspect('auto')
        ax.coastlines()
        ax.gridlines(draw_labels=False)
    else:
        ax.set_visible(False)

# 8. Add shared colorbar and title
fig.colorbar(im, ax=axes[5, :2], shrink=0.4, pad=0.05, location='bottom',
             label='Soil Moisture Anomaly (mm)')
fig.suptitle('Global Soil Moisture Anomaly - 2024', fontsize=16)

plt.show()



#Set mapping to meditaranean
# 6. Set up the plot with a regional-friendly projection
projection = ccrs.Mercator()
fig, axes = plt.subplots(6, 2, sharex=True, sharey=True,
                         constrained_layout=True,
                         subplot_kw={'projection': projection})
fig.set_size_inches(11.7, 16.5)

# 7. Loop through each month and plot
for index, ax in enumerate(axes.flat):
    if index < anomaly2024.sizes['time']:
        data = anomaly2024.isel(time=index)
        im = data.plot(
            ax=ax,
            transform=ccrs.PlateCarree(),
            cmap='Spectral',
            vmin=-200, vmax=200,
            add_colorbar=False,
            add_labels=False
        )
        title = pd.to_datetime(data.time.values).strftime('%Y-%b')
        ax.set_title(title, fontsize=9)
        ax.set_aspect('auto')
        ax.set_extent([-10, 35, 30, 50], crs=ccrs.PlateCarree())  #  Zoom to Mediterranean
        ax.coastlines()
        ax.gridlines(draw_labels=False)
    else:
        ax.set_visible(False)

# 8. Add shared colorbar and title
fig.colorbar(im, ax=axes[5, :2], shrink=0.4, pad=0.05, location='bottom',
             label='Soil Moisture Anomaly (mm)')
fig.suptitle('Mediterranean Soil Moisture Anomaly - 2024', fontsize=16)

plt.show()
