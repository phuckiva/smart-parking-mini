import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [slots, setSlots] = useState([])
  const [stats, setStats] = useState({ totalSlots: 0, availableSlots: 0, occupiedSlots: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchSlots()
    // Refresh data every 5 seconds
    const interval = setInterval(fetchSlots, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchSlots = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/slots')
      if (!response.ok) {
        throw new Error('Failed to fetch slots')
      }
      const data = await response.json()
      setSlots(data.data)
      setStats({
        totalSlots: data.totalSlots,
        availableSlots: data.availableSlots,
        occupiedSlots: data.occupiedSlots
      })
      setError(null)
    } catch (err) {
      setError('Unable to connect to backend. Make sure the backend server is running on port 3001.')
      console.error('Error fetching slots:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚗 Smart Parking System</h1>
        <div className="stats">
          <div className="stat-item">
            <span className="stat-label">Total Slots:</span>
            <span className="stat-value">{stats.totalSlots}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Available:</span>
            <span className="stat-value available">{stats.availableSlots}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Occupied:</span>
            <span className="stat-value occupied">{stats.occupiedSlots}</span>
          </div>
        </div>
      </header>

      <main className="parking-area">
        {loading && <div className="loading">Loading parking data...</div>}
        {error && <div className="error">{error}</div>}
        
        {!loading && !error && (
          <div className="parking-grid">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className={`parking-slot ${slot.isOccupied ? 'occupied' : 'available'}`}
                title={`Slot ${slot.id} - ${slot.isOccupied ? 'Occupied' : 'Available'}`}
              >
                <div className="slot-number">{slot.id}</div>
                <div className="slot-status">
                  {slot.isOccupied ? '🚗' : '📭'}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="app-footer">
        <button onClick={fetchSlots} className="refresh-btn">
          🔄 Refresh
        </button>
        <p>Last updated: {new Date().toLocaleTimeString()}</p>
      </footer>
    </div>
  )
}

export default App
