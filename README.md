# AIoT-Smart-Campus-Operating-System

The AIoT Smart Campus Operating System is an integrated Internet-of-Things platform designed to monitor, manage, and automate campus operations in real-time. The system creates a unified digital ecosystem where physical campus infrastructure (buildings, classrooms, parking, power systems) is continuously monitored through wireless sensor networks and represented in a live 3D digital twin.
The platform combines three independent yet interconnected subsystems: a web-based admin dashboard with digital twin visualization for school administrators; a mobile app for emergency response and real-time alerts accessible to all users; and a standalone smart parking system for autonomous vehicle access control.
Each subsystem is powered by an ESP32 microcontroller running independent firmware, enabling modular deployment, scalability, and fault tolerance. Data flows through WiFi connectivity to a local web server or cloud backend, ensuring real-time responsiveness without dependency on external internet infrastructure.

SETUP & OPERATION GUIDE
Connect & Run Web UI (Laptop / Desktop)
STEP 1: Upload Firmware
1.	Plug ESP32 #1 into laptop via USB cable
2.	Open Arduino IDE
3.	Load firmware sketch 
4.	Select ESP32 board and correct COM port
5.	Click Upload (firmware compiles and loads onto ESP32)
STEP 2: WiFi Setup & IP Configuration
1.	Press EN (reset) button on ESP32
2.	Open Arduino IDE → Serial Monitor (set baud rate to 115200)
3.	Wait for startup message and WiFi prompt
4.	On your laptop/phone: Find and connect to "SmartCampus-setup" WiFi network
5.	Open browser and navigate to 192.168.4.1 (captive portal appears)
6.	Select your campus WiFi network from list
7.	If using phone hotspot, change WiFi to 2.4 GHz (not 5 GHz)
8.	Enter WiFi password and click Save
9.	ESP32 connects to your WiFi. Serial monitor displays assigned IP address (e.g., 192.168.1.45) → NOTE THIS IP
STEP 3: Start Local Web Server
1.	Open project folder on VSCode on laptop
2.	Navigate to project folder: cd smart-campus-twin
3.	First time only: npm install (downloads React dependencies)
4.	Run dev server: npm run dev
5.	Terminal displays: "Local: http://localhost:5173"
6.	Open this URL in web browser
STEP 4: Connect Dashboard to ESP32
1.	In web dashboard, click settings icon (gear symbol, top right)
2.	In settings panel, enter: http://192.168.1.45 (use your ESP32 IP from step 2)
3.	Click SAVE button
4.	Navigate to LIVE tab in dashboard
5.	Verify data streams in: Temperature, Humidity, Air Quality, RFID scans appear live
6.	If no data: Check ESP32 is on same WiFi. Restart both ESP32 and laptop.
STEP 5: Power from Battery
1.	Once dashboard shows live data, unplug USB from laptop
2.	Connect 5V battery pack to ESP32 VIN and GND pins
3.	Web dashboard continues to show live data (ESP32 must stay on same WiFi)
4.	Verify sensors still reading correctly

Setup Mobile App (Fire Alerts & Energy Monitoring)
1.	Open mobile app firmware source code in Arduino IDE
2.	Find lines defining WiFi SSID and password
3.	Replace with your campus WiFi network name and password
4.	Compile and upload to ESP32 #2 via USB
5.	Disconnect USB and power ESP32 #2 from 5V battery
6.	Mobile app automatically connects to WiFi
7.	Display shows real-time Voltage, Current, Power, Energy readings
8.	Press physical SOS button or trigger fire sensor to activate buzzer alert
NOTE: WiFi credentials are hardcoded in firmware. If network changes, re-edit code and re-upload to ESP32.

Setup Smart Parking (Standalone)
Smart Parking is independent and requires NO WiFi setup.
Hardware Assembly
1.	Connect 4 IR sensors to ESP32 GPIO pins (13, 32, 14, 33) as defined in parking firmware
2.	Connect LCD 16x2 to I2C pins (GPIO 21 SDA, GPIO 22 SCL)
3.	Connect servo motor to GPIO 26 and power (5V from Arduino UNO)
4.	Battery connects to Arduino UNO VIN/GND (provides 5V boost for LCD and servo)
5.	Ensure all grounds are common (ESP32 GND = Arduino GND = battery -)
Deployment
1.	Upload parking firmware to ESP32 #3 via Arduino IDE
2.	Power on battery; LCD lights up and displays "Initializing..."
3.	System performs self-test of IR sensors
4.	LCD shows "Slots Free: 3" (all parking slots empty)
5.	When car approaches entrance IR sensor: System detects vehicle
6.	If slot available: Servo rotates to open gate
7.	When car parks: Slot IR sensor detects it; LCD updates count
8.	Repeat cycle automatically
9.	If all slots full: LCD displays "PARKING FULL" and gate remains locked
