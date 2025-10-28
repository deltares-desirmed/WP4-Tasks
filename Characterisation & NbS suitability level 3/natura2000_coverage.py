import pandas as pd

# Prepare list to store area stats
area_stats = []

# Replace your plotting loop with this (summary only shown)
for item in regions_info:
    region = item['region']
    shapefile_path = item['shapefile']

    print(f" Processing area for {region}...")

    try:
        region_gdf = gpd.read_file(shapefile_path).to_crs("EPSG:4326")
    except UnicodeDecodeError:
        region_gdf = gpd.read_file(shapefile_path, encoding="ISO-8859-1").to_crs("EPSG:4326")

    bbox = tuple(region_gdf.total_bounds)

    with fiona.open(natura_path, 'r') as src:
        filtered_features = [
            {**feature, 'geometry': feature['geometry']}
            for feature in src.filter(bbox=bbox)
        ]

    if not filtered_features:
        print(f" No Natura 2000 areas found in {region}")
        area_stats.append({'Region': region, 'Area_km2': 0})
        continue

    natura_gdf = gpd.GeoDataFrame.from_features(filtered_features, crs="EPSG:4326")
    natura_clipped = gpd.clip(natura_gdf, region_gdf)

    # Reproject to a metric CRS for accurate area (e.g., EPSG:3035 – Europe LAEA)
    natura_clipped = natura_clipped.to_crs("EPSG:3035")
    natura_clipped['area_km2'] = natura_clipped.geometry.area / 10**6

    total_area = natura_clipped['area_km2'].sum()
    area_stats.append({'Region': region, 'Area_km2': total_area})

# Create DataFrame
area_df = pd.DataFrame(area_stats).sort_values(by='Area_km2', ascending=False)
print(area_df)

# Plot
plt.figure(figsize=(10, 6))
plt.barh(area_df['Region'], area_df['Area_km2'], color='green')
plt.xlabel("Natura 2000 Area (km²)")
plt.title("Natura 2000 Coverage by Region")
plt.grid(True, linestyle='--', alpha=0.5)
plt.tight_layout()
plt.show()
