# AIoT Smart Campus Operating System

An integrated **Artificial Intelligence of Things (AIoT)** platform for real-time monitoring, management, and automation of campus operations.

The **AIoT Smart Campus Operating System** creates a unified digital ecosystem in which physical campus infrastructure—including buildings, classrooms, parking facilities, and power systems—is continuously monitored through wireless sensor networks and represented through a **live 3D digital twin**.

The system combines three independent yet interconnected subsystems:

1. **Web-Based Admin Dashboard** — Provides administrators with real-time campus monitoring and 3D digital twin visualization.
2. **Mobile Emergency & Energy Monitoring App** — Provides real-time alerts, emergency response, and electrical energy monitoring.
3. **Standalone Smart Parking System** — Provides automated vehicle detection, parking-slot monitoring, and gate access control.

Each subsystem uses an **ESP32 microcontroller with dedicated firmware**, enabling modular deployment, scalability, and fault isolation. Sensor data is transmitted through Wi-Fi to a local web server or cloud backend, allowing real-time monitoring without requiring continuous dependence on external internet services.

---

## System Architecture

The platform consists of three primary subsystems:

| Subsystem                     | Controller | Main Function                                                  |
| ----------------------------- | ---------- | -------------------------------------------------------------- |
| Smart Campus Digital Twin     | ESP32 #1   | Environmental monitoring, RFID, and web dashboard              |
| Emergency & Energy Monitoring | ESP32 #2   | Fire/SOS alerts and electrical energy monitoring               |
| Smart Parking                 | ESP32 #3   | Vehicle detection, parking-slot monitoring, and automated gate |

---

# Setup & Operation Guide

## 1. Web UI Setup — Laptop / Desktop

The web dashboard connects to **ESP32 #1** to display real-time campus sensor data.

### Step 1: Upload Firmware

1. Connect **ESP32 #1** to the laptop using a USB cable.
2. Open **Arduino IDE**.
3. Open the ESP32 firmware sketch.
4. Select the appropriate **ESP32 board**.
5. Select the correct **COM port**.
6. Click **Upload**.
7. Wait for the firmware to compile and upload successfully.

---

### Step 2: Wi-Fi Setup & IP Configuration

1. Press the **EN / Reset** button on ESP32 #1.

2. Open **Arduino IDE → Serial Monitor**.

3. Set the baud rate to **115200**.

4. Wait for the ESP32 startup messages and Wi-Fi configuration prompt.

5. On a laptop or smartphone, search for the Wi-Fi network:

   ```text
   SmartCampus-setup
   ```

6. Connect to the `SmartCampus-setup` network.

7. Open a web browser and navigate to:

   ```text
   http://192.168.4.1
   ```

8. The Wi-Fi configuration portal will appear.

9. Select the campus Wi-Fi network from the available networks.

10. If using a mobile hotspot, ensure that the hotspot operates on **2.4 GHz** rather than 5 GHz.

11. Enter the Wi-Fi password.

12. Click **Save**.

13. ESP32 will connect to the configured Wi-Fi network.

14. Check the Serial Monitor for the IP address assigned to the ESP32.

Example:

```text
ESP32 IP Address: 192.168.1.45
```

> **Important:** Note down the assigned ESP32 IP address. It will be required to connect the web dashboard to the ESP32.

---

### Step 3: Start the Local Web Server

1. Open the project folder in **Visual Studio Code**.

2. Open the integrated terminal.

3. Navigate to the project directory:

   ```bash
   cd smart-campus-twin
   ```

4. If this is the first setup, install the required dependencies:

   ```bash
   npm install
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. The terminal should display a local development URL similar to:

   ```text
   Local: http://localhost:5173
   ```

7. Open the displayed URL in a web browser.

---

### Step 4: Connect the Dashboard to ESP32

1. Open the Smart Campus web dashboard.
2. Click the **Settings ⚙️** icon in the top-right corner.
3. Locate the ESP32/API connection field.
4. Enter the IP address assigned to ESP32.

Example:

```text
http://192.168.1.45
```

> Replace `192.168.1.45` with the IP address displayed in your ESP32 Serial Monitor.

5. Click **Save**.
6. Navigate to the **LIVE** tab.
7. Verify that sensor data is being received in real time.

The dashboard should display data such as:

* Temperature
* Humidity
* Air Quality
* RFID Scans

#### Troubleshooting

If live data is not appearing:

* Confirm that the ESP32 is powered on.
* Confirm that the ESP32 and laptop are connected to the **same Wi-Fi network**.
* Verify the ESP32 IP address in the dashboard settings.
* Check the ESP32 Serial Monitor for errors.
* Restart the ESP32 and laptop if necessary.

---

### Step 5: Power ESP32 Using a Battery

Once the dashboard is successfully receiving live sensor data:

1. Disconnect the USB cable from the laptop.
2. Connect a suitable **5V battery/power pack** to the ESP32 power input.
3. Ensure the ESP32 remains connected to the same Wi-Fi network.
4. Open the web dashboard again if necessary.
5. Verify that sensor readings continue to update normally.

> **Note:** The ESP32 must remain connected to the network for the dashboard to receive live data.

---

# 2. Mobile App Setup — Fire Alerts & Energy Monitoring

The second subsystem uses **ESP32 #2** for emergency alerts and electrical energy monitoring.

### Setup

1. Open the mobile-app ESP32 firmware in **Arduino IDE**.
2. Locate the Wi-Fi SSID and password definitions in the source code.
3. Replace them with the credentials of the campus Wi-Fi network.

Example:

```cpp
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";
```

4. Compile the firmware.
5. Connect **ESP32 #2** to the computer using USB.
6. Select the appropriate ESP32 board and COM port.
7. Upload the firmware.
8. Disconnect the USB cable.
9. Power ESP32 #2 using a suitable **5V battery/power source**.
10. The ESP32 will automatically connect to the configured Wi-Fi network.
11. Open the mobile application.
12. Verify that real-time electrical measurements are being displayed.

The system provides measurements such as:

* Voltage
* Current
* Power
* Energy

### Emergency Alert Operation

The system can trigger an emergency alert through:

* Physical **SOS button**
* Fire sensor

When an emergency condition is detected:

1. The sensor/button triggers the emergency event.
2. ESP32 processes the event.
3. The buzzer is activated.
4. The mobile application receives/displays the corresponding alert.

> **Important:** Wi-Fi credentials are currently hardcoded in the ESP32 firmware. If the Wi-Fi network changes, update the credentials in the source code and upload the firmware again.

---

# 3. Smart Parking System — Standalone Operation

The Smart Parking subsystem operates independently from the Wi-Fi-based campus monitoring system.

**No Wi-Fi configuration is required.**

## Hardware Assembly

### IR Sensors

Connect the four IR sensors to the ESP32 GPIO pins:

| IR Sensor   | ESP32 GPIO |
| ----------- | ---------: |
| IR Sensor 1 |    GPIO 13 |
| IR Sensor 2 |    GPIO 32 |
| IR Sensor 3 |    GPIO 14 |
| IR Sensor 4 |    GPIO 33 |

### 16×2 LCD

Connect the I2C LCD as follows:

| LCD Pin | ESP32   |
| ------- | ------- |
| SDA     | GPIO 21 |
| SCL     | GPIO 22 |

### Servo Motor

Connect the servo signal line to:

```text
Servo Signal → GPIO 26
```

The servo is powered using the specified **5V supply**.

### Power & Ground

* Connect the battery to the Arduino UNO VIN/GND input as specified by the hardware design.
* Use the resulting supply for the required LCD and servo power.
* Ensure that all connected devices share a **common ground**.

```text
ESP32 GND
     │
     ├── Arduino UNO GND
     │
     └── Battery (-)
```

> **Warning:** Verify the voltage and current requirements of the ESP32, LCD, servo, and sensors before connecting the power supply. Do not exceed the rated input voltage of any component.

---

## Smart Parking Deployment

1. Upload the smart parking firmware to **ESP32 #3** using Arduino IDE.

2. Power on the system.

3. The LCD will initialize and display:

   ```text
   Initializing...
   ```

4. The system performs a self-test of the connected IR sensors.

5. Once initialization is complete, the LCD displays the available parking slots.

Example:

```text
Slots Free: 3
```

6. When a vehicle approaches the entrance, the entrance IR sensor detects the vehicle.
7. The system checks the availability of parking slots.
8. If a slot is available, the servo motor rotates to open the gate.
9. When the vehicle occupies a parking slot, the corresponding IR sensor detects the vehicle.
10. The available-slot count is updated automatically on the LCD.
11. The system continues monitoring the parking area continuously.

### Parking Full Condition

When all available parking slots are occupied:

```text
PARKING FULL
```

The gate remains closed until a parking slot becomes available.

---

# Operating Flow

```text
                  AIoT SMART CAMPUS
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
     ESP32 #1        ESP32 #2        ESP32 #3
          │              │              │
          ▼              ▼              ▼
   Campus Digital    Emergency &     Smart Parking
       Twin          Energy Monitor      System
          │              │              │
          ▼              ▼              ▼
     Web Dashboard    Mobile App      LCD + Gate
```

---

# Key Features

* Real-time campus environmental monitoring
* Live 3D digital twin visualization
* Temperature and humidity monitoring
* Air-quality monitoring
* RFID-based identification/scanning
* Emergency SOS alerts
* Fire detection and buzzer alerts
* Real-time voltage, current, power, and energy monitoring
* Automated parking-slot detection
* Vehicle detection and gate control
* LCD-based parking availability display
* Modular ESP32-based architecture
* Independent subsystem operation
* Local network operation for real-time responsiveness

---

# Technology Stack

### Hardware

* ESP32 development boards
* RFID module
* Temperature & humidity sensor
* Air-quality sensor
* IR sensors
* 16×2 I2C LCD
* Servo motor
* SOS button
* Fire sensor
* Buzzer
* Arduino UNO
* Battery/power supply

### Software

* Arduino IDE
* ESP32 Arduino Framework
* Visual Studio Code
* React-based Web UI
* Node.js / npm
* Local web server
* Mobile application

---

# Troubleshooting

| Problem                         | Possible Solution                                                                             |
| ------------------------------- | --------------------------------------------------------------------------------------------- |
| ESP32 does not connect to Wi-Fi | Verify SSID/password and ensure the network is 2.4 GHz                                        |
| Dashboard shows no sensor data  | Check ESP32 IP address and confirm both devices are on the same network                       |
| Web server does not start       | Run `npm install` and then `npm run dev`                                                      |
| Mobile app receives no data     | Verify Wi-Fi credentials in ESP32 #2 firmware                                                 |
| Parking LCD does not display    | Check I2C wiring, power, and common ground                                                    |
| Parking slot count is incorrect | Check IR sensor wiring and sensor alignment                                                   |
| Servo does not operate          | Verify GPIO 26 connection and adequate 5V power                                               |
| Gate does not open              | Confirm that at least one parking slot is available and the entrance IR sensor is functioning |

---

# Project Structure

A typical project structure may look like:

```text
AIoT-Smart-Campus-Operating-System/
│
├── web-dashboard/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── firmware/
│   ├── campus-monitoring/
│   ├── emergency-energy/
│   └── smart-parking/
│
├── mobile-app/
│   └── ...
│
├── hardware/
│   ├── circuit-diagrams/
│   └── documentation/
│
└── README.md
```

> Update the directory names above to match the actual project structure.

---

# Getting Started — Quick Reference

### Web Dashboard

```bash
cd smart-campus-twin
npm install
npm run dev
```

Then open:

```text
http://localhost:5173
```

Configure the ESP32 IP address through the dashboard **Settings** panel.

### ESP32 Firmware

1. Open the required firmware in Arduino IDE.
2. Select the ESP32 board.
3. Select the correct COM port.
4. Upload the firmware.
5. Configure Wi-Fi where required.
6. Power the ESP32 using the appropriate power source.

### Smart Parking

1. Connect the sensors and actuators.
2. Upload the parking firmware.
3. Power on the system.
4. Verify LCD initialization.
5. Verify IR sensor operation.
6. Test vehicle detection and gate control.

---
