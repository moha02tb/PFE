// Test if MapboxMapScreen can be imported without errors
try {
  const MapboxMapScreen = require('./screens/MapboxMapScreen').default;
  console.log('✓ MapboxMapScreen imported successfully:', typeof MapboxMapScreen);
} catch (error) {
  console.error('✗ MapboxMapScreen import failed:', error.message);
  console.error(error.stack);
}
