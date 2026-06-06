// ---------------------------------------------------------------------------
// Zero — button device firmware (ESP32 / Raspberry Pi Pico W with Arduino core)
//
// Two momentary buttons:
//   Button 1 (BUTTON1_PIN) -> impulse  (POST {"button":1})
//   Button 2 (BUTTON2_PIN) -> action   (POST {"button":2})
//
// On each press it POSTs to <API_BASE>/api/events with the device's bearer
// token. The onboard LED blinks once on success, three times on failure.
//
// Copy config.example.h to config.h and fill in your values, OR edit the
// constants directly below.
// ---------------------------------------------------------------------------

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

// ---- Configuration --------------------------------------------------------
// Either define these here, or move them to a config.h and #include it.
#ifndef WIFI_SSID
#define WIFI_SSID "your-wifi-ssid"
#define WIFI_PASSWORD "your-wifi-password"
// Base URL of the deployed API, no trailing slash. Must be https for ingest.
#define API_BASE "https://your-api.example.com"
// Device token from the dashboard "Devices" page (shown once on creation).
#define DEVICE_TOKEN "zd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
#endif

const int BUTTON1_PIN = 14;  // impulse
const int BUTTON2_PIN = 27;  // action
const int LED_PIN = LED_BUILTIN;
const unsigned long DEBOUNCE_MS = 60;

// ---- State ----------------------------------------------------------------
int lastState1 = HIGH;
int lastState2 = HIGH;
unsigned long lastChange1 = 0;
unsigned long lastChange2 = 0;

void blink(int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(80);
    digitalWrite(LED_PIN, LOW);
    delay(80);
  }
}

void connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.printf("\nConnected: %s\n", WiFi.localIP().toString().c_str());
}

// Returns true on HTTP 2xx.
bool sendPress(int button) {
  if (WiFi.status() != WL_CONNECTED) connectWifi();

  WiFiClientSecure client;
  client.setInsecure();  // skip cert validation; simplest for a hobby device

  HTTPClient http;
  String url = String(API_BASE) + "/api/events";
  if (!http.begin(client, url)) {
    Serial.println("http.begin failed");
    return false;
  }
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + DEVICE_TOKEN);

  String body = String("{\"button\":") + button + "}";
  int code = http.POST(body);
  Serial.printf("button %d -> HTTP %d\n", button, code);
  http.end();
  return code >= 200 && code < 300;
}

void handleButton(int pin, int &lastState, unsigned long &lastChange,
                  int buttonNumber) {
  int reading = digitalRead(pin);
  if (reading != lastState && (millis() - lastChange) > DEBOUNCE_MS) {
    lastChange = millis();
    lastState = reading;
    // Active-low: a press pulls the pin LOW.
    if (reading == LOW) {
      blink(sendPress(buttonNumber) ? 1 : 3);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON1_PIN, INPUT_PULLUP);
  pinMode(BUTTON2_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  connectWifi();
  blink(2);  // ready
}

void loop() {
  handleButton(BUTTON1_PIN, lastState1, lastChange1, 1);
  handleButton(BUTTON2_PIN, lastState2, lastChange2, 2);
  delay(5);
}
