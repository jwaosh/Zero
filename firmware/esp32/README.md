# Zero button device (ESP32 / Pico W)

A two-button device that records distraction events:

- **Button 1 → impulse** (you had the urge)
- **Button 2 → action** (you acted on it)

Each press sends an HTTPS `POST /api/events` with the device's bearer token.

## Hardware

- An ESP32 dev board (or Raspberry Pi Pico W) with the Arduino core installed.
- Two momentary push buttons.
- Onboard LED is used for feedback (1 blink = sent OK, 3 blinks = failed).

### Wiring

Buttons are wired active-low using the internal pull-ups — no resistors needed:

```
Button 1:  GPIO14  ── button ── GND
Button 2:  GPIO27  ── button ── GND
```

Change `BUTTON1_PIN` / `BUTTON2_PIN` in `zero_buttons.ino` if you use other pins.

## Setup

1. In the web dashboard, open **Devices → Create device** and copy the token
   (it is shown only once).
2. Copy `config.example.h` to `config.h` and fill in your WiFi credentials,
   the deployed `API_BASE` (https), and the `DEVICE_TOKEN` — or just edit the
   `#define`s at the top of `zero_buttons.ino` directly.
3. In the Arduino IDE, select your board, install the ESP32 board package if
   needed, and upload `zero_buttons.ino`.
4. Open the Serial Monitor at 115200 baud to watch it connect and see the
   HTTP status of each press.

## Notes

- The sketch uses `client.setInsecure()` to skip TLS certificate validation,
  which keeps a hobby device simple. For stronger security, pin the server's
  root CA instead.
- **Enhancement (not implemented):** buffer presses locally when WiFi is down
  and resend on reconnect, so no event is lost offline.
- A MicroPython port is straightforward: read the two pins, debounce, and use
  `urequests.post` with the same JSON body and `Authorization` header.
