import os
import geopandas as gpd
import ee
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import rioxarray
import numpy as np
from urllib.request import urlretrieve

# === Initialize Earth Engine ===
try:
    ee.Initialize(project='XXXXXXXXX')  # Replace with your GEE project ID
except Exception:
    ee.Authenticate()
    ee.Initialize(project='XXXXXXXXX')

# === Define SARL Asset ===
sarl = ee.Image("projects/sat-io/open-datasets/SARL")

# === Class Info (excluding 0, 5, 6) ===
sarl_classes = {
    1: 'Permanent River',
    2: 'Permanent Lake',
    3: 'Seasonal River',
    4: 'Seasonal Lake'
}
sarl_colors = {
    1: '#FFD700',  # Yellow - Permanent River
    2: '#00FFFF',  # Cyan   - Permanent Lake
    3: '#0000FF',  # Blue   - Seasonal River
    4: '#6A0DAD'   # Purple - Seasonal Lake
}

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

# === Output Folder ===
output_dir = "sarl_visuals"
os.makedirs(output_dir, exist_ok=True)

# === Function to Convert GeoDataFrame to EE Geometry ===
def gdf_to_ee(gdf):
    return ee.Geometry(gdf.geometry.union_all().__geo_interface__)

# === Visualization Setup ===
palette = [sarl_colors[k] for k in sorted(sarl_colors)]
cmap = plt.matplotlib.colors.ListedColormap(palette)
bounds = [0.5, 1.5, 2.5, 3.5, 4.5]
norm = plt.matplotlib.colors.BoundaryNorm(bounds, cmap.N)

# === Load HydroRIVERS dataset ===
rivers_path = r"C:\Users\Gebruiker\OneDrive\DesirMED info\Paper\Rivers\HydroRIVERS_v10_eu_shp\HydroRIVERS_v10_eu_shp\HydroRIVERS_v10_eu.shp"
rivers_gdf = gpd.read_file(rivers_path)
rivers_gdf = rivers_gdf.to_crs("EPSG:4326")

# === Process Each Region ===
for item in regions_info:
    region = item['region']
    shapefile_path = item['shapefile']
    print(f" Processing {region}...")

    try:
        gdf = gpd.read_file(shapefile_path)
    except UnicodeDecodeError:
        print(f" Encoding issue detected in {region}, retrying with ISO-8859-1...")
        gdf = gpd.read_file(shapefile_path, encoding='ISO-8859-1')

    gdf = gdf.to_crs("EPSG:4326")
    ee_geom = gdf_to_ee(gdf)
    bbox = ee_geom.bounds()

    # Select SARL year band
    year_band = 'Y2021'
    band_img = sarl.select(year_band).clip(bbox)

    # Mask out background (0), no-data (5, 6)
    mask = band_img.gt(0).And(band_img.lt(5))
    clean_img = band_img.updateMask(mask)

    # Download as GeoTIFF
    filename = f"{region}_SARL_{year_band}.tif".replace(" ", "_")
    tif_path = os.path.join(output_dir, filename)

    if not os.path.exists(tif_path):
        url = clean_img.getDownloadURL({
            'scale': 100,
            'region': bbox,
            'format': 'GEO_TIFF'
        })
        urlretrieve(url, tif_path)

    # Clip river layer to current region
    rivers_clipped = gpd.clip(rivers_gdf, gdf)

    # Read and Plot
    da = rioxarray.open_rasterio(tif_path, masked=True).squeeze()
    fig, ax = plt.subplots(figsize=(8, 8), facecolor='white')
    da.plot.imshow(ax=ax, cmap=cmap, norm=norm, add_colorbar=False)
    gdf.boundary.plot(ax=ax, edgecolor='black', linewidth=1)

    # Plot rivers
    if not rivers_clipped.empty:
        rivers_clipped.plot(ax=ax, color='steelblue', linewidth=0.8, alpha=0.8, label='Rivers')

    # Title & Labels
    ax.set_title(f"{region} - SARL {year_band}", fontsize=14, fontweight='bold')
    ax.set_xlabel("Longitude")
    ax.set_ylabel("Latitude")

    # Legend
    labels = [sarl_classes[i] for i in sorted(sarl_classes)]
    patches = [mpatches.Patch(color=sarl_colors[i], label=labels[i - 1]) for i in sorted(sarl_classes)]
    if not rivers_clipped.empty:
        patches.append(mpatches.Patch(color='steelblue', label='Rivers'))
    ax.legend(handles=patches, title='Water Class', loc='lower right', frameon=True)

    # Save
    out_png = os.path.join(output_dir, f"{region}_SARL_{year_band}.png")
    plt.tight_layout()
    plt.savefig(out_png, dpi=300)
    plt.show()