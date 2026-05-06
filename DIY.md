This tutorial provides a complete end-to-end pipeline for monitoring forest cover using Google Earth Engine (GEE), PyTorch, and Satellite Imagery. We will move from raw data acquisition to a trained Deep Learning model capable of generating binary forest maps.

---

## Project Overview: Satellite-Based Forest Classification
The goal is to classify pixels into two categories: **Forest** (1) and **Non-Forest** (0) using the Normalized Difference Vegetation Index (NDVI) derived from Sentinel-2 data.

### Workflow:
1.  **Acquisition:** Retrieve NDVI composites via Google Earth Engine.
2.  **Labeling:** Generate a balanced dataset of 32x32 patches using a threshold.
3.  **Training:** Train a Convolutional Neural Network (CNN) in PyTorch.
4.  **Inference:** Create high-resolution binary maps for different years.

---

## Step 1: Data Acquisition (Google Earth Engine)
We use GEE to create a cloud-free median composite for the dry season (January–March). This ensures the "greenness" captured is from perennial forests rather than seasonal agriculture.



### Key Logic:
*   **Source:** `COPERNICUS/S2_SR_HARMONIZED` (Sentinel-2 Surface Reflectance).
*   **NDVI Formula:** $NDVI = \frac{B8 - B4}{B8 + B4}$.
*   **Export:** The data is exported to Google Drive at a 10m resolution in UTM 18N projection (EPSG:32618).

---

## Step 2: Automated Labeling and Dataset Creation
Once the `.tif` files are downloaded, we need to prepare data for the neural network. Instead of manual labeling, we use an **NDVI threshold ($\geq 0.6$)** to automatically identify "Forest" samples.

### The "Patch" Approach:
A CNN doesn't just look at one pixel; it looks at the **context**. We extract 32x32 pixel patches around random centroids.

*   **Filtering:** We ensure centroids are far enough from the edges to allow a full patch.
*   **Balancing:** We pick 500 "Forest" and 500 "Non-Forest" samples to prevent model bias.
*   **Storage:** Data is saved in **Zarr** format, which allows for fast, compressed, and chunked data access during training.

---

## Step 3: CNN Model Architecture
We implement a `SimpleCNN` using PyTorch. The model acts as a feature extractor that learns to recognize the spatial textures of forests versus bare ground or urban areas.

### Layers:
1.  **Conv1:** Detects basic edges (1 to 16 filters).
2.  **MaxPool:** Reduces dimensions (32x32 $\rightarrow$ 16x16).
3.  **Conv2:** Detects complex textures (16 to 32 filters).
4.  **Fully Connected (FC):** Flattens the image and classifies the probability using a **Sigmoid** activation function.



---

## Step 4: Training and Validation
The training script includes several critical deep learning practices:
*   **Data Cleaning:** Replacing `NaN` values with 0.0 to prevent the "NaN Loss" bug common in satellite data.
*   **Loss Function:** `BCELoss` (Binary Cross Entropy), ideal for 0/1 classification.
*   **Optimizer:** `Adam` with a learning rate of 0.001.
*   **Validation:** 20% of the data is set aside to check accuracy on unseen patches.

---

## Step 5: Fine-Grained Inference (Mapping)
To create the final forest map, we use a **Sliding Window** approach.

### The Stride Strategy:
Instead of moving the window by 32 pixels (which creates "blocks"), we use a **Stride of 1**.
1.  The model predicts the probability for every possible 32x32 window.
2.  Probabilities are accumulated and averaged for each pixel.
3.  A final threshold of 0.5 is applied to create a smooth, binary GeoTIFF.

---

## Results and Export
The final output is a binary GeoTIFF where:
*   **0 (White):** Non-Forest
*   **1 (Green):** Forest

This allows you to compare the forest cover between 2020 and 2024 (or any other year) to quantify deforestation or reforestation in your study area.

### Summary Statistics Example:
> **Year 2024:**
> *   Training Loss: 0.045
> *   Validation Accuracy: 98.5%
> *   Output: `Forest_Map_Binary_2024.tif`