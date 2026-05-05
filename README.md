# Satellite Imagery Binary Classifier: Forest Detection (NDVI)

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Python](https://img.shields.io/badge/Python-3.9+-blue?style=for-the-badge&logo=python)
![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)
![Jupyter Notebook](https://img.shields.io/badge/Jupyter-Notebook-orange?style=for-the-badge&logo=Jupyter)

This project implements a comprehensive pipeline to classify satellite imagery into **Forest** and **Non-Forest** categories. By combining cloud-based data acquisition with local Deep Learning, the system monitors environmental changes using Sentinel-2 NDVI data.

## 📌 Project Overview
The workflow bridges the gap between massive satellite data collection and localized AI model training. We use a Convolutional Neural Network (CNN) to analyze $32 \times 32$ pixel patches, generating high-resolution forest maps to compare land cover between 2020 and 2024.

## 🛠️ Tech Stack
*   **Data Acquisition:** `Google Earth Engine (JavaScript API)`
*   **Deep Learning:** `PyTorch` (CNN Architecture, Autograd)
*   **Geospatial Data:** `Rasterio` (GeoTIFF management), `Zarr` (Efficient chunked storage)
*   **Analysis:** `NumPy`, `Matplotlib`

---

## 📂 Hybrid Workflow Structure

### Phase 1: Data Acquisition (JavaScript - GEE)
Before the Python pipeline begins, the raw data is prepared using the Google Earth Engine Code Editor:
*   **Collection Filtering:** Sentinel-2 L2A collections are filtered for specific dates (Dry Season) and low cloud cover.
*   **NDVI Calculation:** Normalized Difference Vegetation Index is computed across the entire region.
*   **Export:** Cleaned GeoTIFF composites for 2020 and 2024 are exported to Google Drive for local processing.

### Phase 2: Data Extraction & Labeling (Python)
*   **Automated Labeling:** Forest centroids are identified using an NDVI threshold ($\ge 0.6$).
*   **Sampling:** A balanced dataset of 1,000 patches (500 per class) is randomly sampled.
*   **Zarr Storage:** Patches are streamed into a `.zarr` file, allowing the training loop to access data without overloading system RAM.

### Phase 3: CNN Training
A custom `SimpleCNN` is trained to recognize spatial patterns:
*   **Layers:** Dual-layer convolution with MaxPooling for feature extraction.
*   **Training Logic:** 20 epochs using the `Adam` optimizer and `BCELoss`.
*   **Hardware:** Optimized for **CUDA/GPU** with a CPU fallback.

### Phase 4: High-Resolution Inference
The model is deployed on the full-scale GeoTIFFs:
*   **Sliding Window:** Applies the model across the entire image.
*   **Stride = 1:** By moving the window pixel-by-pixel and averaging overlaps, the system creates a smooth, sub-pixel probability map that avoids "blocky" artifacts.

---

## 🚀 Execution Guide

### 1. Requirements
```bash
pip install torch rasterio zarr numpy matplotlib
```

### 2. Steps
1.  **GEE (JS):** Export your NDVI GeoTIFFs from Google Earth Engine.
2.  **Process:** Run the extraction notebook to generate `dataset_ndvi.zarr`.
3.  **Train:** Run the CNN training loop. The model weights will save to `forest_classification_model.pth`.
4.  **Infer:** Apply the model to the 2020 and 2024 images using the `apply_fine_model` function.

## 🛡️ Data Integrity & Safety
*   **NaN Handling:** Uses `np.nan_to_num` to handle "NoData" pixels often found in satellite exports.
*   **Normalization:** Accounts for contrast variations across different satellite orbits/dates.
*   **Shape Consistency:** Uses `.view(-1)` to ensure the 1D label tensor matches the model output, preventing batch-dimension crashes.

---
*Developed for environmental monitoring and deforestation analysis.*
