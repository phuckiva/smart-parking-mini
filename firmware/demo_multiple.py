# 🚀 ESP32 Simulator Quick Demo Script
# Chạy multiple simulators cho demo

import subprocess
import sys
import time
import threading

def run_simulator(slot_id, api_url="http://localhost:8888/api"):
    """Run a simulator instance"""
    try:
        print(f"🚀 Starting Simulator for Slot {slot_id}")
        subprocess.run([sys.executable, "simulator.py", str(slot_id), api_url])
    except KeyboardInterrupt:
        print(f"🛑 Simulator Slot {slot_id} stopped")
    except Exception as e:
        print(f"❌ Error in Slot {slot_id}: {e}")

def main():
    """Main demo function"""
    print("🎬 Smart Parking Demo - Multiple ESP32 Simulators")
    print("=" * 60)
    
    # Configuration
    slots = [1, 2, 3, 4, 5]  # Simulate 5 parking slots
    api_url = "http://localhost:8888/api"
    
    print(f"🎯 Starting {len(slots)} simulators...")
    print(f"🌐 API URL: {api_url}")
    print("=" * 60)
    
    # Start simulators in separate threads
    threads = []
    
    try:
        for slot_id in slots:
            thread = threading.Thread(target=run_simulator, args=(slot_id, api_url))
            thread.daemon = True
            thread.start()
            threads.append(thread)
            time.sleep(1)  # Stagger startup
        
        print("✅ All simulators started!")
        print("📋 Controls:")
        print("  - Press Ctrl+C to stop all simulators")
        print("  - Check backend dashboard to see real-time updates")
        print("  - Each slot will simulate parking behavior automatically")
        print("=" * 60)
        
        # Keep main thread alive
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n🛑 Stopping all simulators...")
        print("👋 Demo ended!")
        
    except Exception as e:
        print(f"❌ Demo error: {e}")

if __name__ == "__main__":
    main()