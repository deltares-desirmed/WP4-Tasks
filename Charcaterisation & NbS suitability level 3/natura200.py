import os
import geopandas as gpd
import matplotlib.pyplot as plt
import fiona
from shapely.geometry import shape

# === File Paths ===
natura_path = r"C:\Users\Gebruiker\OneDrive\DesirMED info\Paper\Nature\natura2000\Natura2000_end2023_epsg4326.shp"

# === Define Regions ===
regions_info = [
    {'region': 'Split_Dalmatia', 'country': 'Croatia', 'shapefile': r'C:\Users\Gebruiker\OneDrive\DesirMED info\Paper\case_study_locations\Croatia\Split_Dalmatia.shp'},
    {'region': 'Macedonia_Thrace', 'country': 'Greece', 'shapefile': r'C:\Users\Gebruiker\OneDrive\DesirMED info\Paper\case_study_locations\Greece\Macedonia_Thrace.shp'},
    {'region': 'Potenza', 'country': 'Italy', 'shapefile': r'C:\Users\Gebruiker\OneDrive\DesirMED info\Paper\case_study_locations\Italy\Potenza.shp'},
    {'region': 'Corse_du_Sud', 'country': 'France', 'shapefile': r'C:\Users\Gebruiker\OneDrive\DesirMED info\Paper\case_study_locations\France\Corse_du_Sud.shp'},
    {'region': 'Sardegna', 'country': 'Italy', 'shapefile': r'C:\Users\Gebruiker\OneDrive\DesirMED info\Paper\case_study_locations\Italy\Sardegna.shp'},
    {'region': 'Beiras_Centro', 'country': 'Portugal', 'shapefile': r'C:\Users\Gebruiker\OneDrive\DesirMED info\Paper\case_study_locations\Portugal\Beiras_Centro.shp'},
    {'region': 'Nicosia', 'country': 'Cyprus', 'shapefile': r'C:\Users\Gebruiker\OneDrive\DesirMED info\Paper\case_study_locations\Cyprus\Nicosia.shp'},
    {'region': 'Valencia', 'country': 'Spain', 'shapefile': r'C:\Users\Gebruiker\OneDrive\DesirMED info\Paper\case_study_locations\Spain\Valencia.shp'}
]

# === Process Each Region ===
for item in regions_info:
    region = item['region']
    shapefile_path = item['shapefile']
    print(f" Displaying Natura 2000 map for {region}...")

    try:
        region_gdf = gpd.read_file(shapefile_path).to_crs("EPSG:4326")
    except UnicodeDecodeError:
        region_gdf = gpd.read_file(shapefile_path, encoding="ISO-8859-1").to_crs("EPSG:4326")

    # Get bounding box for region
    bbox = tuple(region_gdf.total_bounds)  # (minx, miny, maxx, maxy)

    # Filter features inside bbox using fiona
    with fiona.open(natura_path, 'r') as src:
        filtered_features = [
            {**feature, 'geometry': feature['geometry']}
            for feature in src.filter(bbox=bbox)
        ]


    # Convert to GeoDataFrame and clip to actual region geometry
    natura_gdf = gpd.GeoDataFrame.from_features(filtered_features, crs="EPSG:4326")
    natura_clipped = gpd.clip(natura_gdf, region_gdf)

    # Plot
    fig, ax = plt.subplots(figsize=(10, 10))
    region_gdf.boundary.plot(ax=ax, edgecolor='black', linewidth=1)
    natura_clipped.plot(ax=ax, color='green', alpha=0.5, label='Natura 2000 Areas')

    ax.set_title(f"Natura 2000 Areas in {region.replace('_', ' ')}", fontsize=14)
    ax.set_xlabel("Longitude")
    ax.set_ylabel("Latitude")
    ax.legend()
    ax.tick_params(labelsize=10)
    ax.grid(True, linestyle='--', alpha=0.5)

    plt.tight_layout()
    plt.show()