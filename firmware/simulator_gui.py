"""
🎮 ESP32 Simulator GUI
Giao diện đồ họa để mô phỏng nhiều ESP32 cùng lúc
"""

import tkinter as tk
from tkinter import ttk, messagebox
import threading
import requests
import json
import time
from datetime import datetime

class ESP32SimulatorGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("🚗 Smart Parking ESP32 Simulator")
        self.root.geometry("800x600")
        
        # Configuration
        self.api_base_url = "http://localhost:8888/api"
        self.simulators = {}  # slot_id -> simulator_data
        self.running = False
        
        self.setup_ui()
        self.update_thread = None
    
    def setup_ui(self):
        """Setup user interface"""
        # Main frame
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Configuration frame
        config_frame = ttk.LabelFrame(main_frame, text="🔧 Configuration", padding="10")
        config_frame.grid(row=0, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))
        
        ttk.Label(config_frame, text="API URL:").grid(row=0, column=0, sticky=tk.W)
        self.api_url_var = tk.StringVar(value=self.api_base_url)
        ttk.Entry(config_frame, textvariable=self.api_url_var, width=50).grid(row=0, column=1, padx=(10, 0))
        
        ttk.Button(config_frame, text="Test Connection", command=self.test_connection).grid(row=0, column=2, padx=(10, 0))
        
        # Control frame
        control_frame = ttk.LabelFrame(main_frame, text="🎮 Control", padding="10")
        control_frame.grid(row=1, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))
        
        ttk.Button(control_frame, text="▶️ Start All", command=self.start_simulation).grid(row=0, column=0, padx=(0, 5))
        ttk.Button(control_frame, text="⏹️ Stop All", command=self.stop_simulation).grid(row=0, column=1, padx=5)
        ttk.Button(control_frame, text="➕ Add Slot", command=self.add_slot).grid(row=0, column=2, padx=5)
        ttk.Button(control_frame, text="➖ Remove Slot", command=self.remove_slot).grid(row=0, column=3, padx=5)
        
        # Slots frame
        slots_frame = ttk.LabelFrame(main_frame, text="🅿️ Parking Slots", padding="10")
        slots_frame.grid(row=2, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 10))
        
        # Treeview for slots
        columns = ("Slot ID", "Status", "Distance", "Mode", "Last Update")
        self.tree = ttk.Treeview(slots_frame, columns=columns, show="headings", height=10)
        
        for col in columns:
            self.tree.heading(col, text=col)
            self.tree.column(col, width=120)
        
        self.tree.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Scrollbar for treeview
        scrollbar = ttk.Scrollbar(slots_frame, orient=tk.VERTICAL, command=self.tree.yview)
        scrollbar.grid(row=0, column=1, sticky=(tk.N, tk.S))
        self.tree.configure(yscrollcommand=scrollbar.set)
        
        # Slot control frame
        slot_control_frame = ttk.LabelFrame(main_frame, text="🔧 Slot Control", padding="10")
        slot_control_frame.grid(row=3, column=0, columnspan=2, sticky=(tk.W, tk.E))
        
        ttk.Label(slot_control_frame, text="Selected Slot:").grid(row=0, column=0, sticky=tk.W)
        self.selected_slot_var = tk.StringVar()
        ttk.Label(slot_control_frame, textvariable=self.selected_slot_var).grid(row=0, column=1, padx=(10, 0))
        
        ttk.Label(slot_control_frame, text="Distance (cm):").grid(row=1, column=0, sticky=tk.W)
        self.distance_var = tk.StringVar(value="25")
        distance_entry = ttk.Entry(slot_control_frame, textvariable=self.distance_var, width=10)
        distance_entry.grid(row=1, column=1, padx=(10, 0), sticky=tk.W)
        
        ttk.Button(slot_control_frame, text="Set Distance", command=self.set_distance).grid(row=1, column=2, padx=(10, 0))
        
        mode_frame = ttk.Frame(slot_control_frame)
        mode_frame.grid(row=2, column=0, columnspan=3, sticky=tk.W, pady=(10, 0))
        
        ttk.Label(mode_frame, text="Mode:").grid(row=0, column=0, sticky=tk.W)
        self.mode_var = tk.StringVar(value="auto")
        ttk.Radiobutton(mode_frame, text="Auto", variable=self.mode_var, value="auto").grid(row=0, column=1, padx=(10, 0))
        ttk.Radiobutton(mode_frame, text="Manual", variable=self.mode_var, value="manual").grid(row=0, column=2, padx=(10, 0))
        ttk.Radiobutton(mode_frame, text="Random", variable=self.mode_var, value="random").grid(row=0, column=3, padx=(10, 0))
        
        ttk.Button(mode_frame, text="Apply Mode", command=self.apply_mode).grid(row=0, column=4, padx=(20, 0))
        
        # Log frame
        log_frame = ttk.LabelFrame(main_frame, text="📝 Log", padding="10")
        log_frame.grid(row=4, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        self.log_text = tk.Text(log_frame, height=8, wrap=tk.WORD)
        self.log_text.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        log_scroll = ttk.Scrollbar(log_frame, orient=tk.VERTICAL, command=self.log_text.yview)
        log_scroll.grid(row=0, column=1, sticky=(tk.N, tk.S))
        self.log_text.configure(yscrollcommand=log_scroll.set)
        
        # Configure grid weights
        main_frame.columnconfigure(0, weight=1)
        main_frame.rowconfigure(2, weight=1)
        main_frame.rowconfigure(4, weight=1)
        
        slots_frame.columnconfigure(0, weight=1)
        slots_frame.rowconfigure(0, weight=1)
        
        log_frame.columnconfigure(0, weight=1)
        log_frame.rowconfigure(0, weight=1)
        
        # Bind tree selection
        self.tree.bind("<<TreeviewSelect>>", self.on_slot_select)
        
        # Add some default slots
        self.add_slot_data(1)
        self.add_slot_data(2)
        self.add_slot_data(3)
    
    def log(self, message):
        """Add message to log"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.log_text.insert(tk.END, f"[{timestamp}] {message}\n")
        self.log_text.see(tk.END)
    
    def test_connection(self):
        """Test API connection"""
        api_url = self.api_url_var.get()
        try:
            response = requests.get(f"{api_url}/slots", timeout=5)
            if response.status_code == 200:
                self.log("✅ API connection successful!")
                messagebox.showinfo("Success", "API connection successful!")
            else:
                self.log(f"❌ API returned status {response.status_code}")
                messagebox.showerror("Error", f"API returned status {response.status_code}")
        except requests.exceptions.RequestException as e:
            self.log(f"❌ Connection failed: {e}")
            messagebox.showerror("Error", f"Connection failed: {e}")
    
    def add_slot_data(self, slot_id):
        """Add a new slot to simulation"""
        if slot_id not in self.simulators:
            self.simulators[slot_id] = {
                'slot_id': slot_id,
                'status': False,
                'distance': 25.0,
                'mode': 'auto',
                'last_update': datetime.now(),
                'running': False
            }
            self.update_tree()
            self.log(f"➕ Added Slot {slot_id}")
    
    def add_slot(self):
        """Add new slot dialog"""
        dialog = tk.Toplevel(self.root)
        dialog.title("Add Slot")
        dialog.geometry("300x150")
        dialog.transient(self.root)
        dialog.grab_set()
        
        ttk.Label(dialog, text="Slot ID:").pack(pady=10)
        slot_id_var = tk.StringVar()
        entry = ttk.Entry(dialog, textvariable=slot_id_var)
        entry.pack(pady=5)
        entry.focus()
        
        def on_ok():
            try:
                slot_id = int(slot_id_var.get())
                if slot_id > 0:
                    self.add_slot_data(slot_id)
                    dialog.destroy()
                else:
                    messagebox.showerror("Error", "Slot ID must be positive")
            except ValueError:
                messagebox.showerror("Error", "Invalid slot ID")
        
        def on_cancel():
            dialog.destroy()
        
        button_frame = ttk.Frame(dialog)
        button_frame.pack(pady=20)
        ttk.Button(button_frame, text="OK", command=on_ok).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="Cancel", command=on_cancel).pack(side=tk.LEFT, padx=5)
        
        entry.bind("<Return>", lambda e: on_ok())
    
    def remove_slot(self):
        """Remove selected slot"""
        selected = self.tree.selection()
        if selected:
            item = self.tree.item(selected[0])
            slot_id = int(item['values'][0])
            
            if slot_id in self.simulators:
                del self.simulators[slot_id]
                self.update_tree()
                self.log(f"➖ Removed Slot {slot_id}")
        else:
            messagebox.showwarning("Warning", "Please select a slot to remove")
    
    def on_slot_select(self, event):
        """Handle slot selection"""
        selected = self.tree.selection()
        if selected:
            item = self.tree.item(selected[0])
            slot_id = int(item['values'][0])
            self.selected_slot_var.set(f"Slot {slot_id}")
            
            if slot_id in self.simulators:
                slot_data = self.simulators[slot_id]
                self.distance_var.set(str(slot_data['distance']))
                self.mode_var.set(slot_data['mode'])
    
    def set_distance(self):
        """Set distance for selected slot"""
        selected = self.tree.selection()
        if selected:
            item = self.tree.item(selected[0])
            slot_id = int(item['values'][0])
            
            try:
                distance = float(self.distance_var.get())
                if slot_id in self.simulators:
                    self.simulators[slot_id]['distance'] = distance
                    self.simulators[slot_id]['mode'] = 'manual'
                    self.mode_var.set('manual')
                    self.log(f"🔧 Slot {slot_id}: Set distance to {distance}cm")
                    self.update_tree()
            except ValueError:
                messagebox.showerror("Error", "Invalid distance value")
        else:
            messagebox.showwarning("Warning", "Please select a slot")
    
    def apply_mode(self):
        """Apply mode to selected slot"""
        selected = self.tree.selection()
        if selected:
            item = self.tree.item(selected[0])
            slot_id = int(item['values'][0])
            
            if slot_id in self.simulators:
                mode = self.mode_var.get()
                self.simulators[slot_id]['mode'] = mode
                self.log(f"🔧 Slot {slot_id}: Mode changed to {mode}")
                self.update_tree()
        else:
            messagebox.showwarning("Warning", "Please select a slot")
    
    def start_simulation(self):
        """Start simulation for all slots"""
        if not self.running:
            self.running = True
            self.api_base_url = self.api_url_var.get()
            
            for slot_id in self.simulators:
                self.simulators[slot_id]['running'] = True
            
            self.update_thread = threading.Thread(target=self.simulation_loop)
            self.update_thread.daemon = True
            self.update_thread.start()
            
            self.log("▶️ Simulation started for all slots")
    
    def stop_simulation(self):
        """Stop simulation for all slots"""
        self.running = False
        
        for slot_id in self.simulators:
            self.simulators[slot_id]['running'] = False
        
        self.log("⏹️ Simulation stopped for all slots")
    
    def simulation_loop(self):
        """Main simulation loop"""
        while self.running:
            try:
                for slot_id, slot_data in self.simulators.items():
                    if slot_data['running']:
                        self.simulate_slot(slot_id, slot_data)
                
                # Update UI
                self.root.after(0, self.update_tree)
                
                time.sleep(2)  # Update every 2 seconds
                
            except Exception as e:
                self.log(f"❌ Simulation error: {e}")
                time.sleep(1)
    
    def simulate_slot(self, slot_id, slot_data):
        """Simulate one slot"""
        try:
            # Calculate distance based on mode
            if slot_data['mode'] == 'manual':
                distance = slot_data['distance']
            elif slot_data['mode'] == 'random':
                import random
                distance = random.uniform(5, 50)
            else:  # auto mode
                import random
                hour = datetime.now().hour
                if 7 <= hour <= 9 or 17 <= hour <= 19:
                    # Rush hour
                    distance = random.uniform(3, 8) if random.random() < 0.7 else random.uniform(15, 40)
                else:
                    distance = random.uniform(3, 8) if random.random() < 0.3 else random.uniform(15, 40)
            
            # Update status
            old_status = slot_data['status']
            new_status = distance <= 10  # 10cm threshold
            slot_data['distance'] = distance
            slot_data['status'] = new_status
            slot_data['last_update'] = datetime.now()
            
            # Send API update if status changed
            if old_status != new_status:
                self.send_api_update(slot_id, new_status, distance)
                
        except Exception as e:
            self.log(f"❌ Slot {slot_id} simulation error: {e}")
    
    def send_api_update(self, slot_id, occupied, distance):
        """Send status update to API"""
        try:
            url = f"{self.api_base_url}/slots/{slot_id}/status"
            
            payload = {
                "status": "occupied" if occupied else "available",
                "sensor_id": f"ESP32_SLOT_{slot_id}",
                "timestamp": int(time.time() * 1000),
                "distance": distance
            }
            
            headers = {
                "Content-Type": "application/json",
                "X-API-Key": "smart-parking-2025"
            }
            
            response = requests.put(url, json=payload, headers=headers, timeout=5)
            
            if response.status_code == 200:
                status_text = "🚗 OCCUPIED" if occupied else "🅿️ AVAILABLE"
                self.log(f"📡 Slot {slot_id}: {status_text} (API updated)")
            else:
                self.log(f"❌ Slot {slot_id}: API error [{response.status_code}]")
                
        except requests.exceptions.RequestException as e:
            self.log(f"❌ Slot {slot_id}: Network error - {e}")
    
    def update_tree(self):
        """Update the slots tree view"""
        # Clear existing items
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        # Add current slots
        for slot_id, slot_data in sorted(self.simulators.items()):
            status_text = "🚗 OCCUPIED" if slot_data['status'] else "🅿️ AVAILABLE"
            distance_text = f"{slot_data['distance']:.1f}cm"
            mode_text = slot_data['mode'].upper()
            update_text = slot_data['last_update'].strftime("%H:%M:%S")
            
            self.tree.insert("", tk.END, values=(
                slot_id, status_text, distance_text, mode_text, update_text
            ))

def main():
    """Main function for GUI simulator"""
    root = tk.Tk()
    app = ESP32SimulatorGUI(root)
    
    try:
        root.mainloop()
    except KeyboardInterrupt:
        app.stop_simulation()
    
if __name__ == "__main__":
    main()