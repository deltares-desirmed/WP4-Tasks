import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import math

# === Load the cleaned long-format population dataset ===
file_path = r"C:\Users\Gebruiker\OneDrive\DesirMED info\Paper\CLEAN_ZonalPop_ByRegion_1975_2030.csv"
df = pd.read_csv(file_path)

# === Set seaborn style ===
sns.set(style="whitegrid")

# === Get unique years and sort them ===
years = sorted(df['Year'].unique())
n_years = len(years)

# === Determine subplot grid size ===
cols = 4
rows = math.ceil(n_years / cols)

# === Assign consistent colors to each region using Set3 ===
unique_regions = df['Region'].unique()
palette = sns.color_palette('Set3', n_colors=len(unique_regions))
region_color_map = dict(zip(unique_regions, palette))

# === Create subplots ===
fig, axes = plt.subplots(rows, cols, figsize=(20, rows * 4), constrained_layout=True)
axes = axes.flatten()

# === Plot each year as a subplot ===
for i, year in enumerate(years):
    ax = axes[i]
    data = df[df['Year'] == year].sort_values('Population', ascending=False)
    region_order = data['Region'].tolist()
    region_palette = [region_color_map[reg] for reg in region_order]

    sns.barplot(data=data, x='Population', y='Region', ax=ax, palette=region_palette)
    ax.set_title(f"Population by Region in {year}", fontsize=12)
    ax.set_xlabel("Population")
    ax.set_ylabel("Region")

# === Remove unused subplots ===
for j in range(i + 1, len(axes)):
    fig.delaxes(axes[j])

# === Add super title ===
fig.suptitle("Regional Population per Year (1975–2030)", fontsize=18)
plt.show()
