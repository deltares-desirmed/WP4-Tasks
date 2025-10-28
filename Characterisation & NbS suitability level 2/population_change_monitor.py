import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from scipy.stats import linregress

# === Load the cleaned long-format population dataset ===
file_path = r"C:\Users\Gebruiker\OneDrive\DesirMED info\Paper\CLEAN_ZonalPop_ByRegion_1975_2030.csv"
df = pd.read_csv(file_path)

# === Compute growth trend (slope) for each region ===
trend_data = []
for region in df['Region'].unique():
    region_df = df[df['Region'] == region]
    slope, intercept, r_value, p_value, std_err = linregress(region_df['Year'], region_df['Population'])
    trend_data.append({'Region': region, 'Slope': slope})

trend_df = pd.DataFrame(trend_data)

# === Define category thresholds ===
q1 = trend_df['Slope'].quantile(0.25)
q3 = trend_df['Slope'].quantile(0.75)

def classify_growth(slope):
    if slope < 0:
        return 'Decline'
    elif slope <= q1:
        return 'Neutral'
    elif slope <= q3:
        return 'Growth'
    else:
        return 'High Growth'

trend_df['Category'] = trend_df['Slope'].apply(classify_growth)

# === Plot categories ===
sns.set(style="whitegrid")
plt.figure(figsize=(10, 6))
palette = {'Decline': 'red', 'Neutral': 'gray', 'Growth': 'skyblue', 'High Growth': 'green'}

sns.barplot(data=trend_df.sort_values('Slope', ascending=False), 
            x='Slope', y='Region', hue='Category', dodge=False, palette=palette)

plt.title("Population Growth Trend by Region (1975–2030)")
plt.xlabel("Slope (Population Change per Year)")
plt.ylabel("Region")
plt.legend(title="Growth Category", bbox_to_anchor=(1.05, -0.15), loc='upper right', borderaxespad=0.)

plt.tight_layout()
plt.grid(False, axis='y')  #remove y-grid lines for clarity
plt.show()