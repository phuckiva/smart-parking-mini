const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Sample parking slots data
const sampleSlots = [
  { id: 1, isOccupied: false, sensorValue: 0 },
  { id: 2, isOccupied: true, sensorValue: 1 },
  { id: 3, isOccupied: false, sensorValue: 0 },
  { id: 4, isOccupied: true, sensorValue: 1 },
  { id: 5, isOccupied: false, sensorValue: 0 },
  { id: 6, isOccupied: false, sensorValue: 0 },
  { id: 7, isOccupied: true, sensorValue: 1 },
  { id: 8, isOccupied: false, sensorValue: 0 }
];

// API Routes
app.get('/api/slots', (req, res) => {
  res.json({
    success: true,
    data: sampleSlots,
    totalSlots: sampleSlots.length,
    availableSlots: sampleSlots.filter(slot => !slot.isOccupied).length,
    occupiedSlots: sampleSlots.filter(slot => slot.isOccupied).length
  });
});

app.get('/api/slots/:id', (req, res) => {
  const slotId = parseInt(req.params.id);
  const slot = sampleSlots.find(s => s.id === slotId);
  
  if (!slot) {
    return res.status(404).json({
      success: false,
      message: 'Slot not found'
    });
  }
  
  res.json({
    success: true,
    data: slot
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Smart Parking Backend'
  });
});

app.listen(PORT, () => {
  console.log(`Smart Parking Backend API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Slots API: http://localhost:${PORT}/api/slots`);
});