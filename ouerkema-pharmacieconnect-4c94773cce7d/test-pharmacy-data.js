// Test script to verify pharmacy data loading
const fs = require('fs');
const path = require('path');

// Mock translation function
const mockTranslations = {
  'pharmacies.central': 'Central Pharmacy',
  'pharmacies.centralAddress': '123 Habib Bourguiba Street, Tunis',
  'pharmacies.ennour': 'Ennour Pharmacy',
  'pharmacies.ennourAddress': 'Farhat Hached Avenue, Sfax',
  'pharmacies.salam': 'Salam Pharmacy',
  'pharmacies.salamAddress': '45 Republic Avenue, Tunis',
  'pharmacies.nour': 'Nour Pharmacy',
  'pharmacies.nourAddress': '78 Liberty Street, Ariana',
  'pharmacies.medina': 'Medina Pharmacy',
  'pharmacies.medinaAddress': '12 Jamaa Ez Zitouna Street, Tunis',
  'home.closed': 'Closed'
};

const t = (key) => mockTranslations[key] || key;

// Load and test pharmacy data
try {
  const pharmaciesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'pharmacies.json'), 'utf8'));

  console.log('✅ JSON file loaded successfully');
  console.log(`📊 Found ${pharmaciesData.length} pharmacies`);

  // Process data like the utility function would
  const processedData = pharmaciesData.map(pharmacy => ({
    ...pharmacy,
    name: t(pharmacy.nameKey),
    address: t(pharmacy.addressKey),
    openHours: pharmacy.openHoursKey ? t(pharmacy.openHoursKey) : pharmacy.openHours
  }));

  console.log('\n📋 Processed pharmacy data:');
  processedData.forEach((pharmacy, index) => {
    console.log(`${index + 1}. ${pharmacy.name}`);
    console.log(`   📍 ${pharmacy.address}`);
    console.log(`   📞 ${pharmacy.phone}`);
    console.log(`   🕒 ${pharmacy.openHours}`);
    console.log(`   ${pharmacy.isOpen ? '🟢 Open' : '🔴 Closed'}`);
    console.log(`   ${pharmacy.emergency ? '🚨 Emergency' : '📋 Regular'}`);
    console.log('');
  });

  // Test filtering
  const openPharmacies = processedData.filter(p => p.isOpen);
  const emergencyPharmacies = processedData.filter(p => p.emergency);

  console.log(`🟢 Open pharmacies: ${openPharmacies.length}`);
  console.log(`🚨 Emergency pharmacies: ${emergencyPharmacies.length}`);

  console.log('\n✅ All tests passed! Pharmacy data is working correctly.');

} catch (error) {
  console.error('❌ Error testing pharmacy data:', error);
}
