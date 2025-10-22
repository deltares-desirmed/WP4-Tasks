import os
import requests
import xarray as xr

# 1. Define filename and URL for surface air temperature
filename = 'air.mon.mean.nc'
url = 'https://psl.noaa.gov/thredds/fileServer/Datasets/ncep.reanalysis.derived/surface/air.mon.mean.nc'

# 2. Download only if not already present
if not os.path.exists(filename):
    print(f"Downloading {filename}...")
    response = requests.get(url)
    with open(filename, 'wb') as f:
        f.write(response.content)
    print("Download complete.")
else:
    print(f"{filename} already exists. Skipping download.")

# 3. Load NetCDF file with xarray
ds = xr.open_dataset(filename)
air = ds['air']

# Check basic info
print(air)




import xarray as xr
import matplotlib.pyplot as plt
import cartopy.crs as ccrs
import pandas as pd
import os

# 1. Load temperature dataset
file_path = r'C:\Users\Gebruiker\OneDrive\DesirMED info\Paper\air.mon.mean.nc'
ds = xr.open_dataset(file_path)

# 2. Fix longitude format
air = ds['air']  # in Kelvin
air.coords['lon'] = (air.coords['lon'] + 180) % 360 - 180
air = air.sortby('lon')

# 3. Convert to Celsius
air_c = air - 273.15

# 4. Extract only 2024 data FIRST (to reduce memory usage)
air_2024 = air_c.sel(time=air_c['time.year'] == 2024)

# 5. Compute monthly climatology from 1971–2000
climatology = air_c.sel(time=slice('1971', '2000')).groupby('time.month').mean('time')

# 6. Compute anomaly for 2024 only
anomaly2024 = air_2024.groupby('time.month') - climatology

# 7. Set up the plot with EqualEarth projection
projection = ccrs.EqualEarth()
fig, axes = plt.subplots(6, 2, sharex=True, sharey=True,
                         constrained_layout=True,
                         subplot_kw={'projection': projection})
fig.set_size_inches(11.7, 16.5)

# 8. Loop through each month and plot
for index, ax in enumerate(axes.flat):
    if index < anomaly2024.sizes['time']:
        data = anomaly2024.isel(time=index)
        im = data.plot(
            ax=ax,
            transform=ccrs.PlateCarree(),
            cmap='RdBu_r',
            vmin=-5, vmax=5,
            add_colorbar=False, add_labels=False
        )
        title = pd.to_datetime(data.time.values).strftime('%Y-%b')
        ax.set_title(title, fontsize=9)
        ax.set_aspect('auto')
        ax.coastlines()
        ax.gridlines(draw_labels=False)
    else:
        ax.set_visible(False)

# 9. Add shared colorbar and title
fig.colorbar(im, ax=axes[5, :2], shrink=0.4, pad=0.05, location='bottom',
             label='Surface Air Temperature Anomaly (°C)')
fig.suptitle('Global Surface Temperature Anomaly - 2024', fontsize=16)

plt.show()





#Set mapping to meditaranean
# 10. Set up the plot with a regional-friendly projection
projection = ccrs.Mercator()
fig, axes = plt.subplots(6, 2, sharex=True, sharey=True,
                         constrained_layout=True,
                         subplot_kw={'projection': projection})
fig.set_size_inches(11.7, 16.5)

# 11. Loop through each month and plot
for index, ax in enumerate(axes.flat):
    if index < anomaly2024.sizes['time']:
        data = anomaly2024.isel(time=index)
        im = data.plot(
            ax=ax,
            transform=ccrs.PlateCarree(),
            cmap='RdBu_r',               #  Better for temperature
            vmin=-5, vmax=5,             #  °C anomaly range
            add_colorbar=False,
            add_labels=False
        )
        title = pd.to_datetime(data.time.values).strftime('%Y-%b')
        ax.set_title(title, fontsize=9)
        ax.set_aspect('auto')
        ax.set_extent([-10, 35, 30, 50], crs=ccrs.PlateCarree())  #  Mediterranean focus
        ax.coastlines()
        ax.gridlines(draw_labels=False)
    else:
        ax.set_visible(False)

# 12. Add shared colorbar and title
fig.colorbar(im, ax=axes[5, :2], shrink=0.4, pad=0.05, location='bottom',
             label='Surface Air Temperature Anomaly (°C)')
fig.suptitle('Mediterranean Temperature Anomaly - 2024', fontsize=16)

plt.show()

