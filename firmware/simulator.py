#!/usr/bin/env python3
"""
🚗 Smart Parking ESP32 Simulator
Mô phỏng firmware ESP32 với cảm biến siêu âm HC-SR04
Không cần phần cứng thực tế - chỉ cần chạy script Python
"""

import time
import json
import random
import requests
import threading
from datetime import datetime
from typing import Dict, Any
import sys

class ESP32Simulator:
    def __init__(self, slot_id: int = 1, api_base_url: str = "http://localhost:8888/api"):
        self.slot_id = slot_id
        self.api_base_url = api_base_url
        self.api_key = "smart-parking-2025"
        
        # Simulator settings
        self.distance_threshold = 10  # cm
        self.measure_interval = 2     # seconds
        self.debounce_time = 5        # seconds
        
        # State variables
        self.current_status = False   # False = available, True = occupied
        self.last_status = False
        self.last_status_change = 0
        self.is_connected = False
        self.running = False
        
        # Simulation mode
        self.simulation_mode = "auto"  # auto, manual, random
        self.manual_distance = 50      # cm for manual mode
        
        print(f"🚗 ESP32 Simulator initialized for Slot {slot_id}")
        print(f"📡 API Base URL: {api_base_url}")
    
    def start(self):
        """Start the simulator"""
        print("🚀 Starting ESP32 Simulator...")
        self.running = True
        
        # Test API connection
        if self.test_connection():
            self.is_connected = True
            print("✅ API connection successful!")
        else:
            print("❌ API connection failed - continuing in offline mode")
        
        # Start main loop in separate thread
        main_thread = threading.Thread(target=self._main_loop)
        main_thread.daemon = True
        main_thread.start()
        
        # Start interactive control
        self._interactive_control()
    
    def stop(self):
        """Stop the simulator"""
        print("🛑 Stopping ESP32 Simulator...")
        self.running = False
    
    def test_connection(self) -> bool:
        """Test API connection"""
        try:
            response = requests.get(f"{self.api_base_url}/slots", timeout=5)
            return response.status_code == 200
        except requests.exceptions.RequestException:
            return False
    
    def measure_distance(self) -> float:
        """Simulate ultrasonic sensor measurement"""
        if self.simulation_mode == "manual":
            return self.manual_distance
        elif self.simulation_mode == "random":
            # Random distance between 5-50cm with some noise
            base_distance = random.uniform(5, 50)
            noise = random.uniform(-2, 2)
            return max(0, base_distance + noise)
        else:  # auto mode
            # Simulate realistic parking behavior
            current_time = time.time()
            
            # Create patterns: morning/evening rush hours
            hour = datetime.now().hour
            if 7 <= hour <= 9 or 17 <= hour <= 19:
                # Rush hour - higher chance of occupied
                if random.random() < 0.7:
                    return random.uniform(3, 8)  # Car present
                else:
                    return random.uniform(15, 40)  # No car
            else:
                # Normal hours - lower chance of occupied
                if random.random() < 0.3:
                    return random.uniform(3, 8)  # Car present
                else:
                    return random.uniform(15, 40)  # No car
    
    def send_status_update(self, occupied: bool) -> bool:
        """Send status update to API"""
        if not self.is_connected:
            print("📡 Offline mode - status not sent")
            return False
        
        url = f"{self.api_base_url}/slots/{self.slot_id}/status"
        
        payload = {
            "status": "occupied" if occupied else "available",
            "sensor_id": f"ESP32_SLOT_{self.slot_id}",
            "timestamp": int(time.time() * 1000),
            "distance": self.measure_distance()
        }
        
        headers = {
            "Content-Type": "application/json",
            "X-API-Key": self.api_key
        }
        
        try:
            print(f"📤 Sending: {json.dumps(payload)}")
            response = requests.put(url, json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                print(f"✅ Status updated successfully! Response: {response.text}")
                return True
            else:
                print(f"❌ API error [{response.status_code}]: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Network error: {e}")
            return False
    
    def _main_loop(self):
        """Main simulation loop"""
        print("🔄 Starting main simulation loop...")
        
        while self.running:
            try:
                # Measure distance
                distance = self.measure_distance()
                self.current_status = distance <= self.distance_threshold
                
                # Show current state
                status_text = "🚗 OCCUPIED" if self.current_status else "🅿️ AVAILABLE"
                print(f"📏 Distance: {distance:.1f}cm | Status: {status_text}")
                
                # Check for status change with debounce
                current_time = time.time()
                if self.current_status != self.last_status:
                    if current_time - self.last_status_change >= self.debounce_time:
                        print(f"🔄 Status changed: {status_text}")
                        
                        # Send to API
                        if self.send_status_update(self.current_status):
                            self.last_status = self.current_status
                            self.last_status_change = current_time
                
                time.sleep(self.measure_interval)
                
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"❌ Error in main loop: {e}")
                time.sleep(1)
    
    def _interactive_control(self):
        """Interactive control for testing"""
        print("\n" + "="*50)
        print("🎮 INTERACTIVE CONTROL")
        print("Commands:")
        print("  'auto'    - Auto simulation mode")
        print("  'random'  - Random distance mode")  
        print("  'manual'  - Manual control mode")
        print("  'set XX'  - Set manual distance to XX cm")
        print("  'status'  - Show current status")
        print("  'test'    - Test API connection")
        print("  'quit'    - Exit simulator")
        print("="*50)
        
        while self.running:
            try:
                command = input("🎮 Command: ").strip().lower()
                
                if command == "quit" or command == "exit":
                    self.stop()
                    break
                elif command == "auto":
                    self.simulation_mode = "auto"
                    print("✅ Switched to auto simulation mode")
                elif command == "random":
                    self.simulation_mode = "random"
                    print("✅ Switched to random mode")
                elif command == "manual":
                    self.simulation_mode = "manual"
                    print("✅ Switched to manual mode")
                elif command.startswith("set "):
                    try:
                        distance = float(command.split()[1])
                        self.manual_distance = distance
                        print(f"✅ Manual distance set to {distance}cm")
                    except (IndexError, ValueError):
                        print("❌ Invalid format. Use: set 15")
                elif command == "status":
                    status_text = "🚗 OCCUPIED" if self.current_status else "🅿️ AVAILABLE"
                    print(f"📊 Slot {self.slot_id}: {status_text}")
                    print(f"📏 Last distance: {self.measure_distance():.1f}cm")
                    print(f"🔧 Mode: {self.simulation_mode}")
                elif command == "test":
                    if self.test_connection():
                        print("✅ API connection OK")
                        self.is_connected = True
                    else:
                        print("❌ API connection failed")
                        self.is_connected = False
                else:
                    print("❌ Unknown command. Type 'quit' to exit.")
                    
            except KeyboardInterrupt:
                self.stop()
                break
            except Exception as e:
                print(f"❌ Command error: {e}")

def main():
    """Main function"""
    print("🚗 Smart Parking ESP32 Simulator v1.0")
    print("="*50)
    
    # Configuration
    slot_id = 1
    api_url = "http://localhost:8888/api"
    
    # Parse command line arguments
    if len(sys.argv) > 1:
        try:
            slot_id = int(sys.argv[1])
        except ValueError:
            print("❌ Invalid slot ID. Using default: 1")
    
    if len(sys.argv) > 2:
        api_url = sys.argv[2]
    
    print(f"🎯 Simulating Slot ID: {slot_id}")
    print(f"🌐 API URL: {api_url}")
    print("="*50)
    
    # Create and start simulator
    simulator = ESP32Simulator(slot_id=slot_id, api_base_url=api_url)
    
    try:
        simulator.start()
    except KeyboardInterrupt:
        print("\n🛑 Simulator stopped by user")
    except Exception as e:
        print(f"❌ Simulator error: {e}")
    finally:
        simulator.stop()
        print("👋 Goodbye!")

if __name__ == "__main__":
    main()