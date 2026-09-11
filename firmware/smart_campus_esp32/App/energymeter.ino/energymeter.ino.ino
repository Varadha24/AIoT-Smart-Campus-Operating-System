#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
#include <Adafruit_INA219.h>

// =====================================================
// WIFI SETTINGS
// =====================================================
const char* WIFI_SSID = "INKER_ROBOTICS.....!!!!!";
const char* WIFI_PASSWORD = "Inker.Robotics@2022";

// =====================================================
// PIN DEFINITIONS
// =====================================================
#define SDA_PIN       21
#define SCL_PIN       22

#define BUZZER_PIN    25
#define FLAME_PIN     26
#define BUTTON_PIN    27

// =====================================================
// LIMITS
// =====================================================
const float CURRENT_LIMIT = 0.50;   // Ampere
const float POWER_LIMIT   = 2.00;   // Watt

// =====================================================
// FLAME SENSOR
// =====================================================
// Most LM393 flame sensor modules:
// DO = LOW  -> flame detected
// DO = HIGH -> no flame
const bool FLAME_ACTIVE_LOW = true;

// =====================================================
// OBJECTS
// =====================================================
Adafruit_INA219 ina219;
WebServer server(80);

// =====================================================
// SENSOR VARIABLES
// =====================================================
float voltageV = 0.0;
float currentA = 0.0;
float powerW   = 0.0;
float energyWh = 0.0;

unsigned long lastEnergyTime = 0;
unsigned long lastSensorRead = 0;
unsigned long lastPrintTime  = 0;

// =====================================================
// ALERT VARIABLES
// =====================================================
bool highCurrent = false;
bool highPower   = false;
bool automaticAlert = false;

bool manualSOS = false;
bool buzzerState = false;

// =====================================================
// FLAME VARIABLES
// =====================================================
bool flameDetected = false;
int flameRaw = HIGH;

// =====================================================
// BUTTON VARIABLES
// =====================================================
bool lastButtonState = HIGH;
unsigned long lastButtonTime = 0;

const unsigned long DEBOUNCE_TIME = 200;

// =====================================================
// FUNCTION DECLARATIONS
// =====================================================
void readINA219();
void readFlameSensor();
void updateAlerts();
void updateBuzzer();
void checkPhysicalButton();

String getSystemStatus();
String getAlertMessage();

void handleRoot();
void handleData();
void handleStatus();

void handleBuzzerOn();
void handleBuzzerOff();

void handleSOSOn();
void handleSOSOff();

void connectWiFi();

// =====================================================
// SETUP
// =====================================================
void setup()
{
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("======================================");
  Serial.println(" SMART CAMPUS ENERGY MONITOR");
  Serial.println(" ESP32 + INA219 + FLAME SENSOR");
  Serial.println("======================================");

  // ===================================================
  // PIN SETUP
  // ===================================================
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  // IMPORTANT:
  // Internal pull-up helps LM393/open-collector DO
  pinMode(FLAME_PIN, INPUT_PULLUP);

  pinMode(BUTTON_PIN, INPUT_PULLUP);

  // ===================================================
  // I2C
  // ===================================================
  Wire.begin(SDA_PIN, SCL_PIN);

  // ===================================================
  // INA219
  // ===================================================
  if (!ina219.begin())
  {
    Serial.println("ERROR: INA219 NOT FOUND!");
    Serial.println("Check SDA, SCL, VCC and GND.");
  }
  else
  {
    Serial.println("INA219 initialized successfully.");

    // Calibration for standard INA219
    ina219.setCalibration_32V_2A();
  }

  // ===================================================
  // WIFI
  // ===================================================
  connectWiFi();

  // ===================================================
  // WEB SERVER ROUTES
  // ===================================================
  server.on("/", handleRoot);

  server.on("/data", handleData);
  server.on("/status", handleStatus);

  server.on("/buzzer/on", handleBuzzerOn);
  server.on("/buzzer/off", handleBuzzerOff);

  server.on("/sos/on", handleSOSOn);
  server.on("/sos/off", handleSOSOff);

  server.begin();

  Serial.println("Web server started.");

  // ===================================================
  // INITIAL VALUES
  // ===================================================
  lastEnergyTime = millis();
  lastSensorRead = millis();
  lastPrintTime  = millis();

  Serial.println();
  Serial.println("System ready.");
  Serial.println("======================================");
}

// =====================================================
// LOOP
// =====================================================
void loop()
{
  // Handle web clients
  server.handleClient();

  // ===================================================
  // SENSOR READING EVERY 500 ms
  // ===================================================
  if (millis() - lastSensorRead >= 500)
  {
    lastSensorRead = millis();

    readINA219();
    readFlameSensor();

    updateAlerts();
    updateBuzzer();
  }

  // ===================================================
  // PHYSICAL BUTTON
  // ===================================================
  checkPhysicalButton();

  // ===================================================
  // SERIAL MONITOR
  // ===================================================
  if (millis() - lastPrintTime >= 2000)
  {
    lastPrintTime = millis();

    Serial.println();
    Serial.println("--------------------------------------");

    Serial.print("Voltage     : ");
    Serial.print(voltageV, 2);
    Serial.println(" V");

    Serial.print("Current     : ");
    Serial.print(currentA, 3);
    Serial.println(" A");

    Serial.print("Power       : ");
    Serial.print(powerW, 3);
    Serial.println(" W");

    Serial.print("Energy      : ");
    Serial.print(energyWh, 4);
    Serial.println(" Wh");

    Serial.print("Energy      : ");
    Serial.print(energyWh / 1000.0, 6);
    Serial.println(" kWh");

    Serial.print("Current Limit: ");
    Serial.print(CURRENT_LIMIT, 2);
    Serial.println(" A");

    Serial.print("High Current : ");
    Serial.println(highCurrent ? "YES" : "NO");

    Serial.print("High Power   : ");
    Serial.println(highPower ? "YES" : "NO");

    Serial.print("Auto Alert   : ");
    Serial.println(automaticAlert ? "ON" : "OFF");

    Serial.print("Flame Raw    : ");
    Serial.println(flameRaw);

    Serial.print("Flame        : ");
    Serial.println(flameDetected ? "DETECTED" : "NOT DETECTED");

    Serial.print("App/Manual SOS: ");
    Serial.println(manualSOS ? "ON" : "OFF");

    Serial.print("Buzzer       : ");
    Serial.println(buzzerState ? "ON" : "OFF");

    Serial.print("System Status: ");
    Serial.println(getSystemStatus());

    Serial.print("Alert        : ");
    Serial.println(getAlertMessage());

    Serial.println("--------------------------------------");
  }

  // ===================================================
  // WIFI RECONNECT
  // ===================================================
  if (WiFi.status() != WL_CONNECTED)
  {
    static unsigned long lastWiFiAttempt = 0;

    if (millis() - lastWiFiAttempt >= 10000)
    {
      lastWiFiAttempt = millis();

      Serial.println("WiFi disconnected. Reconnecting...");

      WiFi.disconnect();
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    }
  }
}

// =====================================================
// WIFI CONNECTION
// =====================================================
void connectWiFi()
{
  Serial.println();
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;

  while (WiFi.status() != WL_CONNECTED && attempts < 30)
  {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED)
  {
    Serial.println("WiFi connected!");

    Serial.print("ESP32 IP Address: ");
    Serial.println(WiFi.localIP());

    Serial.println();
    Serial.println("Use these URLs in MIT App Inventor:");

    Serial.print("DATA   : http://");
    Serial.print(WiFi.localIP());
    Serial.println("/data");

    Serial.print("STATUS : http://");
    Serial.print(WiFi.localIP());
    Serial.println("/status");
  }
  else
  {
    Serial.println("WiFi connection failed!");
  }
}

// =====================================================
// READ INA219
// =====================================================
void readINA219()
{
  float shuntVoltage_mV = ina219.getShuntVoltage_mV();
  float busVoltage_V   = ina219.getBusVoltage_V();
  float current_mA     = ina219.getCurrent_mA();
  float power_mW       = ina219.getPower_mW();

  voltageV = busVoltage_V;
  currentA = current_mA / 1000.0;
  powerW   = power_mW / 1000.0;

  // ===================================================
  // ENERGY CALCULATION
  // ===================================================
  unsigned long now = millis();

  if (lastEnergyTime > 0)
  {
    float elapsedHours =
      (now - lastEnergyTime) / 3600000.0;

    energyWh += powerW * elapsedHours;
  }

  lastEnergyTime = now;
}

// =====================================================
// READ FLAME SENSOR
// =====================================================
void readFlameSensor()
{
  flameRaw = digitalRead(FLAME_PIN);

  if (FLAME_ACTIVE_LOW)
  {
    // LOW = flame
    flameDetected = (flameRaw == LOW);
  }
  else
  {
    // HIGH = flame
    flameDetected = (flameRaw == HIGH);
  }
}

// =====================================================
// UPDATE ALERTS
// =====================================================
void updateAlerts()
{
  highCurrent = (currentA > CURRENT_LIMIT);
  highPower   = (powerW > POWER_LIMIT);

  automaticAlert = highCurrent || highPower;
}

// =====================================================
// UPDATE BUZZER
// =====================================================
void updateBuzzer()
{
  // Buzzer ON if:
  // 1. Manual SOS
  // 2. High current/power
  // 3. Flame detected

  bool shouldBuzz =
    manualSOS ||
    automaticAlert ||
    flameDetected;

  buzzerState = shouldBuzz;

  digitalWrite(
    BUZZER_PIN,
    buzzerState ? HIGH : LOW
  );
}

// =====================================================
// PHYSICAL PUSH BUTTON
// =====================================================
// CORRECTED DEBOUNCE LOGIC
// =====================================================
void checkPhysicalButton()
{
  static bool lastReading = HIGH;
  static bool stableState = HIGH;
  static unsigned long lastDebounceTime = 0;

  bool reading = digitalRead(BUTTON_PIN);

  // Detect any change in the physical button
  if (reading != lastReading)
  {
    lastDebounceTime = millis();
    lastReading = reading;
  }

  // Wait for the signal to remain stable
  if ((millis() - lastDebounceTime) > DEBOUNCE_TIME)
  {
    // Only act when the stable state actually changes
    if (reading != stableState)
    {
      stableState = reading;

      // Button pressed
      if (stableState == LOW)
      {
        manualSOS = !manualSOS;

        Serial.println();

        if (manualSOS)
        {
          Serial.println("PHYSICAL BUTTON: SOS ON");
        }
        else
        {
          Serial.println("PHYSICAL BUTTON: SOS OFF");
        }

        updateBuzzer();
      }
    }
  }
}

// =====================================================
// SYSTEM STATUS
// =====================================================
String getSystemStatus()
{
  if (WiFi.status() != WL_CONNECTED)
  {
    return "DISCONNECTED";
  }

  if (manualSOS)
  {
    return "SOS";
  }

  if (flameDetected)
  {
    return "FIRE";
  }

  if (automaticAlert)
  {
    return "WARNING";
  }

  return "NORMAL";
}

// =====================================================
// ALERT MESSAGE
// =====================================================
String getAlertMessage()
{
  if (manualSOS)
  {
    return "EMERGENCY SOS";
  }

  if (flameDetected)
  {
    return "FLAME DETECTED";
  }

  if (highCurrent && highPower)
  {
    return "HIGH CURRENT + HIGH POWER";
  }

  if (highCurrent)
  {
    return "HIGH CURRENT";
  }

  if (highPower)
  {
    return "HIGH POWER";
  }

  return "No alerts";
}

// =====================================================
// ROOT PAGE
// =====================================================
void handleRoot()
{
  String html = "";

  html += "<!DOCTYPE html>";
  html += "<html>";
  html += "<head>";
  html += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
  html += "<title>Smart Campus Energy Monitor</title>";
  html += "</head>";

  html += "<body>";

  html += "<h1>Smart Campus Energy Monitor</h1>";

  html += "<h2>Energy</h2>";

  html += "<p>Voltage: ";
  html += String(voltageV, 2);
  html += " V</p>";

  html += "<p>Current: ";
  html += String(currentA, 3);
  html += " A</p>";

  html += "<p>Power: ";
  html += String(powerW, 3);
  html += " W</p>";

  html += "<p>Energy: ";
  html += String(energyWh, 4);
  html += " Wh</p>";

  html += "<p>Energy: ";
  html += String(energyWh / 1000.0, 6);
  html += " kWh</p>";

  html += "<h2>Flame Sensor</h2>";

  html += "<p>Raw: ";
  html += String(flameRaw);
  html += "</p>";

  html += "<p>Flame: ";
  html += flameDetected ? "DETECTED" : "NOT DETECTED";
  html += "</p>";

  html += "<h2>System</h2>";

  html += "<p>Status: ";
  html += getSystemStatus();
  html += "</p>";

  html += "<p>Alert: ";
  html += getAlertMessage();
  html += "</p>";

  html += "<p>Buzzer: ";
  html += buzzerState ? "ON" : "OFF";
  html += "</p>";

  html += "<p>Manual SOS: ";
  html += manualSOS ? "ON" : "OFF";
  html += "</p>";

  html += "</body>";
  html += "</html>";

  server.send(200, "text/html", html);
}

// =====================================================
// /DATA
// =====================================================
// IMPORTANT:
// Keep this format unchanged for MIT App Inventor.
//
// 1 = Voltage
// 2 = Current
// 3 = Power
// 4 = Energy kWh
// =====================================================
void handleData()
{
  String data = "";

  data += String(voltageV, 2);
  data += ",";

  data += String(currentA, 3);
  data += ",";

  data += String(powerW, 3);
  data += ",";

  data += String(energyWh / 1000.0, 6);

  server.send(200, "text/plain", data);
}

// =====================================================
// /STATUS
// =====================================================
// Format:
//
// STATUS,ALERT,BUZZER,FLAME,RAW
//
// Example:
//
// NORMAL,No alerts,OFF,NO_FLAME,1
//
// or
//
// FIRE,FLAME DETECTED,ON,FLAME_DETECTED,0
// =====================================================
void handleStatus()
{
  String status = getSystemStatus();

  String alert = getAlertMessage();

  String buzzer =
    buzzerState ? "ON" : "OFF";

  String flame =
    flameDetected ? "FLAME_DETECTED" : "NO_FLAME";

  String raw =
    String(flameRaw);

  String response = "";

  response += status;
  response += ",";

  response += alert;
  response += ",";

  response += buzzer;
  response += ",";

  response += flame;
  response += ",";

  response += raw;

  server.send(
    200,
    "text/plain",
    response
  );
}

// =====================================================
// BUZZER ON
// =====================================================
void handleBuzzerOn()
{
  manualSOS = true;

  updateBuzzer();

  server.send(
    200,
    "text/plain",
    "Buzzer ON"
  );
}

// =====================================================
// BUZZER OFF
// =====================================================
void handleBuzzerOff()
{
  manualSOS = false;

  updateBuzzer();

  server.send(
    200,
    "text/plain",
    "Buzzer OFF"
  );
}

// =====================================================
// SOS ON
// =====================================================
void handleSOSOn()
{
  manualSOS = true;

  updateBuzzer();

  server.send(
    200,
    "text/plain",
    "SOS ON"
  );
}

// =====================================================
// SOS OFF
// =====================================================
void handleSOSOff()
{
  manualSOS = false;

  updateBuzzer();

  server.send(
    200,
    "text/plain",
    "SOS OFF"
  );
}