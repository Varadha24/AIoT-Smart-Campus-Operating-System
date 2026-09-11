/*
  SMART CAMPUS ESP32 — single file, all-in-one
  RC522 + DHT11 + MQ135 + WiFi provisioning + WS/REST API + OTA

  7 tags hardcoded below in TAG_TABLE (dummy names now). Replace UID hex
  with real scanned UIDs: open Serial Monitor @115200, scan tag, copy
  printed "Scanned UID:" value into TAG_TABLE, re-upload.

  Libs needed: WiFiManager, ESPAsyncWebServer, AsyncTCP, ArduinoJson, MFRC522, DHT sensor library (Adafruit)
*/

#include <WiFi.h>
#include <WiFiManager.h>
#include <ESPAsyncWebServer.h>
#include <AsyncTCP.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <MFRC522.h>
#include <DHT.h>
#include <Update.h>

#define RC522_SS_PIN   5
#define RC522_RST_PIN  27
#define DHT_PIN        4
#define DHT_TYPE       DHT11
#define MQ135_PIN      34

const char* DEVICE_ID = "classroom_101";
const char* FIRMWARE_VERSION = "v1.0.0";

MFRC522 rfid(RC522_SS_PIN, RC522_RST_PIN);
DHT dht(DHT_PIN, DHT_TYPE);
AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

float g_temperature = NAN, g_humidity = NAN;
int g_mq135 = 0;
String g_airQuality = "GOOD";

unsigned long lastSensorRead = 0, lastHeartbeat = 0;
const unsigned long SENSOR_INTERVAL_MS = 2500;
const unsigned long HEARTBEAT_INTERVAL_MS = 10000;

// ── 7 RFID TAGS — replace uid hex with real scanned values ──
struct Tag { const char* uid; const char* uidKey; const char* name; const char* type; };
Tag TAG_TABLE[] = {
  {"6E8A2407", "UID_1", "Aravind Menon",     "student"},
  {"26360524", "UID_2", "Sneha Pillai",      "student"},
  {"05B40B07", "UID_3", "Rahul Nair",        "student"},
  {"99014CB8", "UID_4", "Anjali Krishnan",   "student"},
  {"7742D92B", "UID_5", "Dr. Suresh Kumar",  "teacher"},
  {"A2AB05BE", "UID_6", "Prof. Lakshmi Devi","teacher"},
  {"816EC36E", "UID_7", "Prof. Vinod Raj",   "teacher"},
};
const int TAG_COUNT = sizeof(TAG_TABLE) / sizeof(TAG_TABLE[0]);

struct AttendanceEvent { String uid; String name; String type; unsigned long ts; };
#define ATTENDANCE_BUFFER_SIZE 20
AttendanceEvent attendanceBuffer[ATTENDANCE_BUFFER_SIZE];
int attendanceHead = 0, attendanceCount = 0;

String classifyAirQuality(int raw) {
  if (raw <= 400) return "GOOD";
  if (raw <= 700) return "MODERATE";
  return "POOR";
}

String uidToHexString(MFRC522::Uid *uid) {
  String s;
  for (byte i = 0; i < uid->size; i++) {
    if (uid->uidByte[i] < 0x10) s += "0";
    s += String(uid->uidByte[i], HEX);
  }
  s.toUpperCase();
  return s;
}

bool lookupTag(const String &uidHex, String &outUidKey, String &outName, String &outType) {
  for (int i = 0; i < TAG_COUNT; i++) {
    if (uidHex == TAG_TABLE[i].uid) {
      outUidKey = TAG_TABLE[i].uidKey;
      outName = TAG_TABLE[i].name;
      outType = TAG_TABLE[i].type;
      return true;
    }
  }
  return false;
}

void pushAttendance(const String &uidKey, const String &name, const String &type) {
  AttendanceEvent &e = attendanceBuffer[attendanceHead];
  e.uid = uidKey; e.name = name; e.type = type; e.ts = millis();
  attendanceHead = (attendanceHead + 1) % ATTENDANCE_BUFFER_SIZE;
  if (attendanceCount < ATTENDANCE_BUFFER_SIZE) attendanceCount++;

  StaticJsonDocument<256> doc;
  doc["event"] = "attendance";
  doc["uid"] = uidKey;
  doc["name"] = name;
  doc["type"] = type;
  doc["timestamp"] = (unsigned long)(millis() / 1000);
  String out; serializeJson(doc, out);
  ws.textAll(out);
}

void broadcastSensors() {
  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["temperature"] = isnan(g_temperature) ? 0 : g_temperature;
  doc["humidity"] = isnan(g_humidity) ? 0 : g_humidity;
  doc["mq135"] = g_mq135;
  doc["airQuality"] = g_airQuality;
  doc["status"] = "online";
  String out; serializeJson(doc, out);
  ws.textAll(out);
}

void broadcastHeartbeat() {
  StaticJsonDocument<128> doc;
  doc["event"] = "heartbeat";
  doc["timestamp"] = (unsigned long)(millis() / 1000);
  String out; serializeJson(doc, out);
  ws.textAll(out);
}

void handleStatus(AsyncWebServerRequest *request) {
  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["status"] = "online";
  doc["wifi"] = WiFi.status() == WL_CONNECTED ? "connected" : "disconnected";
  doc["ip"] = WiFi.localIP().toString();
  doc["uptimeMs"] = millis();
  String out; serializeJson(doc, out);
  request->send(200, "application/json", out);
}

void handleSensors(AsyncWebServerRequest *request) {
  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["temperature"] = isnan(g_temperature) ? 0 : g_temperature;
  doc["humidity"] = isnan(g_humidity) ? 0 : g_humidity;
  doc["mq135"] = g_mq135;
  doc["airQuality"] = g_airQuality;
  doc["status"] = "online";
  String out; serializeJson(doc, out);
  request->send(200, "application/json", out);
}

void handleAttendance(AsyncWebServerRequest *request) {
  DynamicJsonDocument doc(2048);
  JsonArray arr = doc.to<JsonArray>();
  int idx = attendanceHead;
  for (int i = 0; i < attendanceCount; i++) {
    idx = (idx - 1 + ATTENDANCE_BUFFER_SIZE) % ATTENDANCE_BUFFER_SIZE;
    JsonObject o = arr.createNestedObject();
    o["uid"] = attendanceBuffer[idx].uid;
    o["name"] = attendanceBuffer[idx].name;
    o["type"] = attendanceBuffer[idx].type;
    o["timestamp"] = attendanceBuffer[idx].ts / 1000;
  }
  String out; serializeJson(doc, out);
  request->send(200, "application/json", out);
}

void handleDevice(AsyncWebServerRequest *request) {
  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["firmware"] = FIRMWARE_VERSION;
  doc["wifi"] = WiFi.status() == WL_CONNECTED ? "connected" : "disconnected";
  doc["ip"] = WiFi.localIP().toString();
  String out; serializeJson(doc, out);
  request->send(200, "application/json", out);
}

const char ADMIN_PAGE[] PROGMEM = R"HTML(
<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Smart Campus ESP32 — Device Management</title>
<style>
body{font-family:sans-serif;background:#0b0f1a;color:#dbe4f5;max-width:480px;margin:40px auto;padding:0 16px}
h1{font-size:18px}
.card{background:#121a2c;border:1px solid #1e2b47;border-radius:12px;padding:16px;margin-bottom:16px}
.row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px;border-bottom:1px solid #1e2b4740}
button,input[type=file]{width:100%;padding:10px;border-radius:8px;border:1px solid #2dd4ee55;background:#2dd4ee22;color:#2dd4ee;font-size:14px;margin-top:8px}
progress{width:100%;margin-top:10px}
</style></head><body>
<h1>Smart Campus ESP32 — Device Management</h1>
<div class="card">
  <div class="row"><span>Device ID</span><b id="devId">-</b></div>
  <div class="row"><span>Firmware</span><b id="fw">-</b></div>
  <div class="row"><span>Wi-Fi</span><b id="wifi">-</b></div>
  <div class="row"><span>IP</span><b id="ip">-</b></div>
</div>
<div class="card">
  <b>Update firmware (OTA)</b>
  <form id="f" method="POST" action="/update" enctype="multipart/form-data">
    <input type="file" name="firmware" accept=".bin">
    <button type="submit">Update firmware</button>
  </form>
  <progress id="p" value="0" max="100" style="display:none"></progress>
</div>
<script>
fetch('/api/device').then(r=>r.json()).then(d=>{
  devId.textContent=d.deviceId; fw.textContent=d.firmware; wifi.textContent=d.wifi; ip.textContent=d.ip;
});
document.getElementById('f').addEventListener('submit', function(e){
  e.preventDefault();
  const data = new FormData(this);
  const xhr = new XMLHttpRequest();
  const p = document.getElementById('p');
  p.style.display='block';
  xhr.upload.onprogress = (ev)=>{ if(ev.lengthComputable) p.value = (ev.loaded/ev.total)*100; };
  xhr.onload = ()=> alert(xhr.responseText || 'Update complete. Rebooting...');
  xhr.open('POST','/update'); xhr.send(data);
});
</script>
</body></html>
)HTML";

void setupRoutes() {
  server.on("/api/status", HTTP_GET, handleStatus);
  server.on("/api/sensors", HTTP_GET, handleSensors);
  server.on("/api/attendance", HTTP_GET, handleAttendance);
  server.on("/api/device", HTTP_GET, handleDevice);

  server.on("/admin", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send_P(200, "text/html", ADMIN_PAGE);
  });

  server.on("/update", HTTP_POST,
    [](AsyncWebServerRequest *request) {
      bool ok = !Update.hasError();
      AsyncWebServerResponse *response = request->beginResponse(200, "text/plain", ok ? "Update OK. Rebooting..." : "Update FAILED");
      response->addHeader("Connection", "close");
      request->send(response);
      delay(500);
      ESP.restart();
    },
    [](AsyncWebServerRequest *request, String filename, size_t index, uint8_t *data, size_t len, bool final) {
      if (index == 0) {
        Serial.printf("OTA start: %s\n", filename.c_str());
        if (!Update.begin(UPDATE_SIZE_UNKNOWN)) Update.printError(Serial);
      }
      if (Update.write(data, len) != len) Update.printError(Serial);
      if (final) {
        if (Update.end(true)) Serial.printf("OTA success: %uB\n", index + len);
        else Update.printError(Serial);
      }
    });

  ws.onEvent([](AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len) {
    if (type == WS_EVT_CONNECT) {
      Serial.printf("WS client #%u connected\n", client->id());
      broadcastSensors();
    } else if (type == WS_EVT_DISCONNECT) {
      Serial.printf("WS client #%u disconnected\n", client->id());
    }
  });
  server.addHandler(&ws);
  server.begin();
}

void setup() {
  Serial.begin(115200);

  SPI.begin();
  rfid.PCD_Init();
  dht.begin();
  pinMode(MQ135_PIN, INPUT);

  // Wi-Fi provisioning — no hardcoded SSID/password.
  // First boot: opens AP "SmartCampus-Setup" -> captive portal -> pick network -> save.
  WiFiManager wm;
  wm.setConfigPortalTimeout(180);
  bool connected = wm.autoConnect("SmartCampus-Setup");
  if (!connected) {
    Serial.println("Failed to connect, restarting...");
    ESP.restart();
  }
  Serial.print("Connected. IP: ");
  Serial.println(WiFi.localIP());

  setupRoutes();
}

void loop() {
  ws.cleanupClients();

  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    String uidHex = uidToHexString(&rfid.uid);
    Serial.println("Scanned UID: " + uidHex); // use this to fill real UID into TAG_TABLE

    String uidKey, name, type;
    if (lookupTag(uidHex, uidKey, name, type)) {
      pushAttendance(uidKey, name, type);
      Serial.printf("RFID scan: %s (%s)\n", name.c_str(), uidKey.c_str());
    } else {
      Serial.println("Unknown tag — not in TAG_TABLE yet.");
    }
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
  }

  unsigned long now = millis();
  if (now - lastSensorRead >= SENSOR_INTERVAL_MS) {
    lastSensorRead = now;
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (!isnan(t)) g_temperature = t;
    if (!isnan(h)) g_humidity = h;
    g_mq135 = analogRead(MQ135_PIN);
    g_airQuality = classifyAirQuality(g_mq135);
    broadcastSensors();
  }

  if (now - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeat = now;
    broadcastHeartbeat();
  }
}
