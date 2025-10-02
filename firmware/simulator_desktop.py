"""
🖥️ ESP32 Simulator - Windows Desktop App
Sử dụng customtkinter cho giao diện hiện đại
"""

try:
    import customtkinter as ctk
    MODERN_UI = True
except ImportError:
    import tkinter as tk
    import tkinter.ttk as ttk
    MODERN_UI = False
    print("⚠️ CustomTkinter not found. Using standard Tkinter.")
    print("💡 Install for modern UI: pip install customtkinter")

import threading
import requests
import json
import time
from datetime import datetime

class ModernESP32Simulator:
    def __init__(self):
        if MODERN_UI:
            ctk.set_appearance_mode("dark")
            ctk.set_default_color_theme("blue")
            self.root = ctk.CTk()
        else:
            self.root = tk.Tk()
            
        self.root.title("🚗 Smart Parking ESP32 Simulator")
        self.root.geometry("1000x700")
        
        # Configuration
        self.api_base_url = "http://localhost:8888/api"
        self.simulators = {}
        self.running = False
        
        self.setup_ui()
        self.update_thread = None
        
        # Add default slots
        self.add_slot_data(1)
        self.add_slot_data(2)
        self.add_slot_data(3)
        self.update_display()
    
    def setup_ui(self):
        """Setup modern UI"""
        if MODERN_UI:
            self.setup_modern_ui()
        else:
            self.setup_classic_ui()
    
    def setup_modern_ui(self):
        """Setup CustomTkinter modern UI"""
        # Main frame
        main_frame = ctk.CTkFrame(self.root)
        main_frame.pack(fill="both", expand=True, padx=20, pady=20)
        
        # Title
        title = ctk.CTkLabel(main_frame, text="🚗 ESP32 Simulator", 
                            font=ctk.CTkFont(size=28, weight="bold"))
        title.pack(pady=20)
        
        # Configuration frame
        config_frame = ctk.CTkFrame(main_frame)
        config_frame.pack(fill="x", padx=20, pady=10)
        
        ctk.CTkLabel(config_frame, text="🌐 API URL:", 
                    font=ctk.CTkFont(size=14, weight="bold")).pack(side="left", padx=10)
        
        self.api_url_var = tk.StringVar(value=self.api_base_url)
        self.api_entry = ctk.CTkEntry(config_frame, textvariable=self.api_url_var, width=400)
        self.api_entry.pack(side="left", padx=10)
        
        ctk.CTkButton(config_frame, text="Test Connection", 
                     command=self.test_connection).pack(side="left", padx=10)
        
        # Control frame
        control_frame = ctk.CTkFrame(main_frame)
        control_frame.pack(fill="x", padx=20, pady=10)
        
        ctk.CTkButton(control_frame, text="▶️ Start All", 
                     command=self.start_simulation, 
                     fg_color="green").pack(side="left", padx=5)
        
        ctk.CTkButton(control_frame, text="⏹️ Stop All", 
                     command=self.stop_simulation, 
                     fg_color="red").pack(side="left", padx=5)
        
        ctk.CTkButton(control_frame, text="➕ Add Slot", 
                     command=self.add_slot).pack(side="left", padx=5)
        
        # Slots frame
        self.slots_frame = ctk.CTkScrollableFrame(main_frame, height=300)
        self.slots_frame.pack(fill="both", expand=True, padx=20, pady=10)
        
        # Log frame
        log_frame = ctk.CTkFrame(main_frame)
        log_frame.pack(fill="x", padx=20, pady=10)
        
        ctk.CTkLabel(log_frame, text="📝 Log", 
                    font=ctk.CTkFont(size=16, weight="bold")).pack()
        
        self.log_text = ctk.CTkTextbox(log_frame, height=150)
        self.log_text.pack(fill="x", padx=10, pady=10)
    
    def setup_classic_ui(self):
        """Setup classic Tkinter UI"""
        # Main frame
        main_frame = ttk.Frame(self.root)
        main_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Title
        title = tk.Label(main_frame, text="🚗 ESP32 Simulator", 
                        font=("Arial", 24, "bold"))
        title.pack(pady=10)
        
        # Configuration frame
        config_frame = ttk.LabelFrame(main_frame, text="🔧 Configuration")
        config_frame.pack(fill="x", padx=10, pady=5)
        
        ttk.Label(config_frame, text="API URL:").grid(row=0, column=0, padx=5, pady=5)
        self.api_url_var = tk.StringVar(value=self.api_base_url)
        ttk.Entry(config_frame, textvariable=self.api_url_var, width=50).grid(row=0, column=1, padx=5, pady=5)
        ttk.Button(config_frame, text="Test", command=self.test_connection).grid(row=0, column=2, padx=5, pady=5)
        
        # Control frame
        control_frame = ttk.LabelFrame(main_frame, text="🎮 Control")
        control_frame.pack(fill="x", padx=10, pady=5)
        
        ttk.Button(control_frame, text="▶️ Start", command=self.start_simulation).grid(row=0, column=0, padx=5, pady=5)
        ttk.Button(control_frame, text="⏹️ Stop", command=self.stop_simulation).grid(row=0, column=1, padx=5, pady=5)
        ttk.Button(control_frame, text="➕ Add", command=self.add_slot).grid(row=0, column=2, padx=5, pady=5)
        
        # Slots frame
        slots_frame = ttk.LabelFrame(main_frame, text="🅿️ Slots")
        slots_frame.pack(fill="both", expand=True, padx=10, pady=5)
        
        self.slots_canvas = tk.Canvas(slots_frame)
        self.slots_scrollbar = ttk.Scrollbar(slots_frame, orient="vertical", command=self.slots_canvas.yview)
        self.slots_frame = ttk.Frame(self.slots_canvas)
        
        self.slots_canvas.configure(yscrollcommand=self.slots_scrollbar.set)
        self.slots_canvas.pack(side="left", fill="both", expand=True)
        self.slots_scrollbar.pack(side="right", fill="y")
        
        self.slots_canvas.create_window((0, 0), window=self.slots_frame, anchor="nw")
        
        # Log frame
        log_frame = ttk.LabelFrame(main_frame, text="📝 Log")
        log_frame.pack(fill="x", padx=10, pady=5)
        
        self.log_text = tk.Text(log_frame, height=8, wrap=tk.WORD)
        log_scroll = ttk.Scrollbar(log_frame, orient="vertical", command=self.log_text.yview)
        self.log_text.configure(yscrollcommand=log_scroll.set)
        
        self.log_text.pack(side="left", fill="both", expand=True)
        log_scroll.pack(side="right", fill="y")
    
    def add_slot_data(self, slot_id):
        """Add slot data"""
        if slot_id not in self.simulators:
            self.simulators[slot_id] = {
                'slot_id': slot_id,
                'status': False,
                'distance': 25.0,
                'mode': 'auto',
                'last_update': datetime.now(),
                'running': False
            }
            self.log(f"➕ Added Slot {slot_id}")
    
    def add_slot(self):
        """Add new slot"""
        if MODERN_UI:
            dialog = ctk.CTkInputDialog(text="Enter Slot ID:", title="Add Slot")
            slot_id = dialog.get_input()
        else:
            slot_id = tk.simpledialog.askstring("Add Slot", "Enter Slot ID:")
        
        if slot_id and slot_id.isdigit():
            self.add_slot_data(int(slot_id))
            self.update_display()
    
    def test_connection(self):
        """Test API connection"""
        api_url = self.api_url_var.get()
        try:
            response = requests.get(f"{api_url}/slots", timeout=5)
            if response.status_code == 200:
                self.log("✅ API connection successful!")
                if MODERN_UI:
                    ctk.CTkMessageBox.show(title="Success", text="API connection successful!")
                else:
                    tk.messagebox.showinfo("Success", "API connection successful!")
            else:
                self.log(f"❌ API returned status {response.status_code}")
        except Exception as e:
            self.log(f"❌ Connection failed: {e}")
            if MODERN_UI:
                ctk.CTkMessageBox.show(title="Error", text=f"Connection failed: {e}")
            else:
                tk.messagebox.showerror("Error", f"Connection failed: {e}")
    
    def start_simulation(self):
        """Start simulation"""
        if not self.running:
            self.running = True
            self.api_base_url = self.api_url_var.get()
            
            for slot_id in self.simulators:
                self.simulators[slot_id]['running'] = True
            
            self.update_thread = threading.Thread(target=self.simulation_loop)
            self.update_thread.daemon = True
            self.update_thread.start()
            
            self.log("▶️ Simulation started")
    
    def stop_simulation(self):
        """Stop simulation"""
        self.running = False
        for slot_id in self.simulators:
            self.simulators[slot_id]['running'] = False
        self.log("⏹️ Simulation stopped")
    
    def simulation_loop(self):
        """Simulation loop"""
        while self.running:
            try:
                for slot_id, slot_data in self.simulators.items():
                    if slot_data['running']:
                        self.simulate_slot(slot_id, slot_data)
                
                self.root.after(0, self.update_display)
                time.sleep(2)
            except Exception as e:
                self.log(f"❌ Simulation error: {e}")
                time.sleep(1)
    
    def simulate_slot(self, slot_id, slot_data):
        """Simulate one slot"""
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
                distance = random.uniform(3, 8) if random.random() < 0.7 else random.uniform(15, 40)
            else:
                distance = random.uniform(3, 8) if random.random() < 0.3 else random.uniform(15, 40)
        
        # Update status
        old_status = slot_data['status']
        new_status = distance <= 10
        slot_data['distance'] = distance
        slot_data['status'] = new_status
        slot_data['last_update'] = datetime.now()
        
        # Send API update if status changed
        if old_status != new_status:
            self.send_api_update(slot_id, new_status, distance)
    
    def send_api_update(self, slot_id, occupied, distance):
        """Send API update"""
        try:
            url = f"{self.api_base_url}/slots/{slot_id}/status"
            payload = {
                "status": "occupied" if occupied else "available",
                "sensor_id": f"ESP32_SLOT_{slot_id}",
                "timestamp": int(time.time() * 1000),
                "distance": distance
            }
            
            response = requests.put(url, json=payload, timeout=5)
            if response.status_code == 200:
                status_text = "🚗 OCCUPIED" if occupied else "🅿️ AVAILABLE"
                self.log(f"📡 Slot {slot_id}: {status_text}")
        except Exception as e:
            self.log(f"❌ Slot {slot_id}: API error - {e}")
    
    def update_display(self):
        """Update slot display"""
        if MODERN_UI:
            # Clear existing widgets
            for widget in self.slots_frame.winfo_children():
                widget.destroy()
            
            # Create slot widgets
            for slot_id, slot_data in sorted(self.simulators.items()):
                self.create_modern_slot_widget(slot_data)
        else:
            # Update classic UI
            for widget in self.slots_frame.winfo_children():
                widget.destroy()
            
            for i, (slot_id, slot_data) in enumerate(sorted(self.simulators.items())):
                self.create_classic_slot_widget(slot_data, i)
            
            self.slots_frame.update_idletasks()
            self.slots_canvas.configure(scrollregion=self.slots_canvas.bbox("all"))
    
    def create_modern_slot_widget(self, slot_data):
        """Create modern slot widget"""
        slot_frame = ctk.CTkFrame(self.slots_frame)
        slot_frame.pack(fill="x", padx=10, pady=5)
        
        # Header
        header_frame = ctk.CTkFrame(slot_frame)
        header_frame.pack(fill="x", padx=10, pady=5)
        
        slot_label = ctk.CTkLabel(header_frame, text=f"🅿️ Slot {slot_data['slot_id']}", 
                                 font=ctk.CTkFont(size=16, weight="bold"))
        slot_label.pack(side="left")
        
        status_text = "🚗 OCCUPIED" if slot_data['status'] else "✅ AVAILABLE"
        status_color = "red" if slot_data['status'] else "green"
        status_label = ctk.CTkLabel(header_frame, text=status_text, 
                                   text_color=status_color, 
                                   font=ctk.CTkFont(size=14, weight="bold"))
        status_label.pack(side="right")
        
        # Distance
        distance_label = ctk.CTkLabel(slot_frame, text=f"📏 {slot_data['distance']:.1f} cm", 
                                     font=ctk.CTkFont(size=20))
        distance_label.pack(pady=10)
        
        # Mode buttons
        mode_frame = ctk.CTkFrame(slot_frame)
        mode_frame.pack(fill="x", padx=10, pady=5)
        
        for mode in ['auto', 'manual', 'random']:
            color = "blue" if slot_data['mode'] == mode else "gray"
            btn = ctk.CTkButton(mode_frame, text=mode.title(), 
                               command=lambda m=mode, sid=slot_data['slot_id']: self.set_mode(sid, m),
                               fg_color=color)
            btn.pack(side="left", padx=5)
    
    def create_classic_slot_widget(self, slot_data, row):
        """Create classic slot widget"""
        frame = ttk.LabelFrame(self.slots_frame, text=f"Slot {slot_data['slot_id']}")
        frame.grid(row=row, column=0, sticky="ew", padx=5, pady=2)
        
        status_text = "🚗 OCCUPIED" if slot_data['status'] else "✅ AVAILABLE"
        ttk.Label(frame, text=status_text, font=("Arial", 12, "bold")).grid(row=0, column=0, columnspan=3)
        
        ttk.Label(frame, text=f"Distance: {slot_data['distance']:.1f} cm").grid(row=1, column=0, columnspan=3)
        
        ttk.Label(frame, text="Mode:").grid(row=2, column=0)
        for i, mode in enumerate(['auto', 'manual', 'random']):
            ttk.Button(frame, text=mode.title(), 
                      command=lambda m=mode, sid=slot_data['slot_id']: self.set_mode(sid, m)).grid(row=2, column=i+1)
    
    def set_mode(self, slot_id, mode):
        """Set simulation mode"""
        if slot_id in self.simulators:
            self.simulators[slot_id]['mode'] = mode
            self.log(f"🔧 Slot {slot_id}: Mode changed to {mode}")
            self.update_display()
    
    def log(self, message):
        """Add log message"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_message = f"[{timestamp}] {message}\n"
        
        if MODERN_UI:
            self.log_text.insert("end", log_message)
        else:
            self.log_text.insert(tk.END, log_message)
            self.log_text.see(tk.END)
    
    def run(self):
        """Run the application"""
        self.log("🚀 Modern ESP32 Simulator ready!")
        if MODERN_UI:
            self.log("✨ Using CustomTkinter modern UI")
        else:
            self.log("📱 Using standard Tkinter UI")
        self.root.mainloop()

def main():
    """Main function"""
    app = ModernESP32Simulator()
    app.run()

if __name__ == "__main__":
    main()