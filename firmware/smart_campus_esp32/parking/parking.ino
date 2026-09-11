#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ESP32Servo.h>

// ---------------- PIN DEFINITIONS ----------------

// Parking slot IR sensors
#define SLOT1_IR 13
#define SLOT2_IR 32
#define SLOT3_IR 14

// Entrance IR sensor
#define ENTRANCE_IR 33

// Servo
#define SERVO_PIN 26

// LCD
#define SDA_PIN 21
#define SCL_PIN 22

// ---------------- OBJECTS ----------------

LiquidCrystal_I2C lcd(0x3F, 16, 2);
Servo gateServo;

// ---------------- SETTINGS ----------------

#define IR_DETECTED LOW

// Servo positions
#define GATE_CLOSED 0
#define GATE_OPEN 90

void setup() {

  Serial.begin(115200);

  // IR sensors
  pinMode(SLOT1_IR, INPUT);
  pinMode(SLOT2_IR, INPUT);
  pinMode(SLOT3_IR, INPUT);
  pinMode(ENTRANCE_IR, INPUT);

  // I2C LCD
  Wire.begin(SDA_PIN, SCL_PIN);

  lcd.init();
  lcd.backlight();

  // Servo
  gateServo.attach(SERVO_PIN);
  gateServo.write(GATE_CLOSED);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("SMART PARKING");
  lcd.setCursor(0, 1);
  lcd.print("System Ready");

  delay(2000);
  lcd.clear();
}

void loop() {

  // ---------------- READ PARKING SLOTS ----------------

  bool slot1Occupied = (digitalRead(SLOT1_IR) == IR_DETECTED);
  bool slot2Occupied = (digitalRead(SLOT2_IR) == IR_DETECTED);
  bool slot3Occupied = (digitalRead(SLOT3_IR) == IR_DETECTED);

  // ---------------- COUNT AVAILABLE SLOTS ----------------

  int availableSlots = 0;

  if (!slot1Occupied)
    availableSlots++;

  if (!slot2Occupied)
    availableSlots++;

  if (!slot3Occupied)
    availableSlots++;

  // ---------------- LCD DISPLAY ----------------

  lcd.setCursor(0, 0);
  lcd.print("Available: ");
  lcd.print(availableSlots);
  lcd.print(" ");

  lcd.setCursor(0, 1);

  if (availableSlots == 0) {
    lcd.print("PARKING FULL ");
  }
  else {
    lcd.print("Slots Free ");
  }

  // ---------------- ENTRANCE DETECTION ----------------

  bool carAtEntrance = (digitalRead(ENTRANCE_IR) == IR_DETECTED);

  if (carAtEntrance) {

    Serial.println("Car detected at entrance");

    if (availableSlots > 0) {

      Serial.println("Slot available - Opening gate");

      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Slot Available");
      lcd.setCursor(0, 1);
      lcd.print("Gate Opening...");

      // Open gate
      gateServo.write(GATE_OPEN);

      delay(3000);

      // Close gate
      gateServo.write(GATE_CLOSED);

      Serial.println("Gate closed");

      lcd.clear();
      delay(500);
    }

    else {

      Serial.println("Parking FULL");

      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("PARKING FULL");
      lcd.setCursor(0, 1);
      lcd.print("Gate Closed");

      gateServo.write(GATE_CLOSED);

      delay(2000);

      lcd.clear();
    }
  }

  delay(200);
}