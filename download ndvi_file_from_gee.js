// ============================================================================ 
// S2 PIPELINE: ANNUAL NDVI BASED ON DRY SEASON COMPOSITE
// ============================================================================ 

// Study area coordinates (Pine Forest area, Haiti)
var aoi = ee.Geometry.Polygon([
  [[-72.0, 18.3], [-71.7, 18.3], [-71.7, 18.5], [-72.0, 18.5], [-72.0, 18.3]]
], null, false);

// Years to analyze
var years = [2016, 2020, 2024]; 

// 1. Define the "optimal" time window (Dry Season)
// We target January to March to get the clearest sky conditions in Haiti.
var startMonth = 1; 
var endMonth = 3; 

/**
 * Function to calculate NDVI from a seasonal composite for a specific year
 */
var getSeasonalAnnualNDVI = function(year) {
  
  var collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(aoi)
    // Filter by year
    .filter(ee.Filter.calendarRange(year, year, 'year'))
    // Filter by specific months (Dry Season)
    .filter(ee.Filter.calendarRange(startMonth, endMonth, 'month'))
    // Cloud cover metadata filter
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30));
    
  // Create a median composite to remove remaining cloud artifacts
  var composite = collection.median().clip(aoi);

  // Calculate NDVI: (NIR - Red) / (NIR + Red)
  // S2: B8 is NIR, B4 is Red
  var ndvi = composite.normalizedDifference(['B8', 'B4']).rename('NDVI');

  return ndvi.set('year', year).set('season', 'Dry_Season');
};

// 2. Export Loop
years.forEach(function(year) {
  var ndviImage = getSeasonalAnnualNDVI(year);
  
  var fileName = 'S2_NDVI_DrySeason_' + year;
  
  Export.image.toDrive({
    image: ndviImage,
    description: fileName,
    folder: 'GEE_NDVI_Pine_Forest',
    scale: 10,
    region: aoi,
    maxPixels: 1e10,
    crs: 'EPSG:32618' // UTM 18N for Haiti
  });

  print('Export task created for dry season: ' + year);
});

// 3. Visualization (Example for 2024)
var preview2024 = getSeasonalAnnualNDVI(2024);
var ndviParams = {
  min: 0.2, 
  max: 0.8, 
  palette: [
    '#ffffff', '#ce7e45', '#df923d', '#f1b555', '#fcd163', 
    '#99b718', '#74a901', '#66a000', '#529400', '#3e8601', 
    '#207401', '#056201', '#004c00', '#023b01', '#012e01', 
    '#011d01', '#011301'
  ]
};

Map.centerObject(aoi, 12);
Map.addLayer(preview2024, ndviParams, 'Annual Dry Season NDVI 2024');