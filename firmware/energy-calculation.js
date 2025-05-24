// Read measurements.json and calculate total energy
const fs = require('fs');
const path = require('path');

const measurementsPath = path.join(__dirname, 'measurements.json');

let totalEnergy = 0;

try {
  const data = fs.readFileSync(measurementsPath, 'utf8');
  const measurements = JSON.parse(data);
  if (Array.isArray(measurements)) {
    totalEnergy = measurements.reduce((sum, m) => sum + parseFloat(m.energy), 0);
    console.log(`Total energy: ${totalEnergy.toFixed(4)} Joules`);
  } else {
    console.error('measurements.json does not contain an array.');
  }
} catch (err) {
  console.error('Error reading or parsing measurements.json:', err);
}
