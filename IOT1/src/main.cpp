// == SMART PARKING SYSTEM (ESP32 + HTTPS DEV + JWT) ==
// ✅ FINAL (11/2025)
// - Admin login chỉ lấy JWT (Bearer) cho mọi API
// - Check-in luôn ghi đúng plate + user_id chủ xe (ưu tiên user tra biển số;
//   nếu không có, vẫn check-in, rồi lấy user_id từ server: data.history.user_id)
// - Hiển thị user_id đúng theo lịch sử trên server (không nhầm với admin)
// - Non-blocking (millis), mỗi slot có state machine riêng
// - Parse timestamp linh hoạt, historyId 64-bit, refresh token 401

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ESP32Servo.h>
#include <ArduinoJson.h>
#include <functional>

// ================== CẤU HÌNH ==================
#define NUM_SLOTS 4
const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASS = "";

// API (Node/Render)
const char* BASE_URL        = "https://smart-parking-mini.onrender.com";
const char* LOGIN_PATH      = "/api/auth/login";
const char* FIND_PLATE_PATH = "/api/users/license-plate/";
const char* CHECKIN_PATH    = "/api/parking/checkin";
const char* CHECKOUT_PATH   = "/api/parking/checkout";
const char* SLOT_STATUS_PUT_FMT = "/api/slots/%d/status";

// Supabase REST fallback (TẮT mặc định)
#define USE_SUPABASE_FALLBACK 0
const char* SUPA_URL = "https://<your-project>.supabase.co";
const char* SUPA_KEY = "<anon-or-service-key>";

// Auth demo (admin chỉ để lấy JWT)
const char* LOGIN_EMAIL     = "admin@smartparking.com";
const char* LOGIN_PASSWORD  = "123456";

// Tham số hệ thống
static const uint32_t HTTP_TIMEOUT_MS        = 20000;
static const uint8_t  MAX_HTTP_RETRIES       = 2;
static const uint8_t  MAX_AUTH_RETRIES       = 1;
static const uint32_t WIFI_RETRY_DELAY_MS    = 5000;
static const uint32_t ULTRA_TIMEOUT_US       = 30000;
static const uint32_t SERVO_OPEN_DURATION_MS = 3000; // Servo mở 3s

// Scheduler
static const uint32_t SENSE_INTERVAL_MS = 120;
static const uint32_t PRINT_INTERVAL_MS = 5000;

// Hysteresis
const float OCCUPY_THRESH = 10.0f;
const float FREE_THRESH   = 14.0f;

// ================== DỮ LIỆU DEMO ==================
struct DatabaseEntry { String plate; };
const DatabaseEntry DATABASE[] = {
  {"51D-22222"}, {"51D-22223"}, {"51A-12345"}, {"29B-67890"}, {"99A-99999"}
};
const int DATABASE_COUNT = sizeof(DATABASE)/sizeof(DATABASE[0]);

struct ParkedCar {
  String plate;
  int    slotId;
  String userId;     // user_id chủ xe (đồng bộ với server)
  String historyId;
  String checkInAt;
  String checkOutAt;
};

// ================== SLOT STATE ==================
enum SlotState { SLOT_IDLE, SLOT_OPENING, SLOT_WAIT_CLOSE };

struct Slot {
  int trig, echo, ledGreen, ledRed, servoPin;
  Servo servo;
  float distance;
  bool  occupied;
  SlotState state;
  unsigned long stateStartTime;
};

Slot slots[NUM_SLOTS] = {
  {4, 2, 5, 18, 15, Servo(), 400, false, SLOT_IDLE, 0},
  {19, 21, 23, 22, 13, Servo(), 400, false, SLOT_IDLE, 0},
  {25, 26, 14, 27, 12, Servo(), 400, false, SLOT_IDLE, 0},
  {32, 33, 0, 17, 16, Servo(), 400, false, SLOT_IDLE, 0}
};

ParkedCar parkedCars[NUM_SLOTS];
int parkedCount = 0;

String AUTH_TOKEN = "";
static uint8_t g_authRetry = 0;
WiFiClientSecure g_tlsClient;

// ================== TIỆN ÍCH ==================
String urlEncode(const String& v) {
  String enc = ""; char buf[4];
  for (size_t i = 0; i < v.length(); i++) {
    char c = v.charAt(i);
    if (('a'<=c && c<='z')||('A'<=c && c<='Z')||('0'<=c && c<='9')||c=='-'||c=='_'||c=='.'||c=='~') enc+=c;
    else { snprintf(buf, sizeof(buf), "%%%02X", (unsigned char)c); enc+=buf; }
  }
  return enc;
}
String buildUrl(const char* path) { return String(BASE_URL) + String(path); }

void addCommonHeaders(HTTPClient& cli) {
  cli.addHeader("Accept", "application/json");
  cli.addHeader("User-Agent", "ESP32-ParkingSystem/1.4");
  cli.addHeader("ngrok-skip-browser-warning", "true");
  cli.addHeader("Connection", "close");
  if (AUTH_TOKEN.length() > 0) cli.addHeader("Authorization", "Bearer " + AUTH_TOKEN);
}
bool httpBegin(HTTPClient& http, const String& url) { return http.begin(g_tlsClient, url); }

int findParkedIndexBySlot(int slotId) {
  for (int i = 0; i < parkedCount; i++) if (parkedCars[i].slotId == slotId) return i;
  return -1;
}
void removeParkedIndex(int idx) {
  if (idx < 0 || idx >= parkedCount) return;
  for (int k = idx; k < parkedCount - 1; k++) parkedCars[k] = parkedCars[k + 1];
  parkedCount--;
}

// ================== JSON HELPERS ==================
String parseTimestamp(const JsonVariant& json, const char* a, const char* b, const char* c, const char* d) {
  if (json[a].is<String>() && json[a].as<String>().length() > 0) return json[a].as<String>();
  if (json[b].is<String>() && json[b].as<String>().length() > 0) return json[b].as<String>();
  if (json[c].is<String>() && json[c].as<String>().length() > 0) return json[c].as<String>();
  if (json[d].is<String>() && json[d].as<String>().length() > 0) return json[d].as<String>();
  return "";
}

// ================== AUTH ==================
bool loginAndGetToken() {
  HTTPClient https; https.useHTTP10(true); https.setTimeout(HTTP_TIMEOUT_MS); https.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);
  String url = buildUrl(LOGIN_PATH);
  if (!httpBegin(https, url)) { Serial.println("❌ begin() login fail"); return false; }

  StaticJsonDocument<256> body; body["email"] = LOGIN_EMAIL; body["password"] = LOGIN_PASSWORD;
  String json; serializeJson(body, json);
  https.addHeader("Content-Type", "application/json"); addCommonHeaders(https);

  int code = https.POST(json);
  if (code <= 0) { Serial.printf("❌ Login HTTP error: %s (%d)\n", https.errorToString(code).c_str(), code); https.end(); return false; }

  bool ok = false;
  if (code == 200) {
    DynamicJsonDocument doc(2048);
    auto err = deserializeJson(doc, https.getString());
    if (!err) {
      if (doc["data"]["token"].is<String>())      AUTH_TOKEN = doc["data"]["token"].as<String>();
      else if (doc["token"].is<String>())         AUTH_TOKEN = doc["token"].as<String>();
      else if (doc["access_token"].is<String>())  AUTH_TOKEN = doc["access_token"].as<String>();
      ok = AUTH_TOKEN.length() > 0;
    }
  } else {
    Serial.printf("⚠️ Login code=%d: %s\n", code, https.getString().c_str());
  }
  https.end();
  Serial.println(ok ? "✅ Lấy token OK" : "❌ Lấy token FAIL");
  return ok;
}
bool ensureAuth() { if (AUTH_TOKEN.length() > 0) return true; Serial.println("ℹ️ Chưa có token → login()"); return loginAndGetToken(); }

// ================== HTTP helper (retry + refresh 401) ==================
bool doHttpWithRetry(std::function<int(HTTPClient&)> fnDo, const String& url, int& outCode, String& outPayload) {
  for (uint8_t attempt = 0; attempt < MAX_HTTP_RETRIES; attempt++) {
    HTTPClient https; https.useHTTP10(true); https.setTimeout(HTTP_TIMEOUT_MS); https.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);
    if (!httpBegin(https, url)) { Serial.println("❌ begin() fail"); return false; }
    addCommonHeaders(https);

    outCode = fnDo(https);
    outPayload = https.getString();
    https.end();

    if (outCode == 401) {
      if (g_authRetry < MAX_AUTH_RETRIES && loginAndGetToken()) { g_authRetry++; continue; }
      return false;
    }
    g_authRetry = 0;
    return (outCode > 0);
  }
  return false;
}

// ================== SUPABASE FALLBACK (tuỳ chọn) ==================
#if USE_SUPABASE_FALLBACK
bool supaInsertCheckin(const String& userId, int slotId, const String& plate, String& outHistoryId, String& outCheckInAt) {
  String url = String(SUPA_URL) + "/rest/v1/parking_history";
  HTTPClient http; http.useHTTP10(true); http.setTimeout(HTTP_TIMEOUT_MS);
  if (!httpBegin(http, url)) return false;
  http.addHeader("apikey", SUPA_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPA_KEY);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Prefer", "return=representation");

  StaticJsonDocument<256> body;
  body["slot_id"] = slotId; body["user_id"] = userId; body["license_plate"] = plate;
  String json; serializeJson(body, json);

  int code = http.POST(json);
  String payload = http.getString(); http.end();

  if (code == 201) {
    DynamicJsonDocument doc(1024);
    if (!deserializeJson(doc, payload)) {
      outHistoryId = String((long long)doc[0]["id"].as<long long>());
      outCheckInAt = parseTimestamp(doc[0], "check_in_time", "checkInTime", "check_in_at", "checkInAt");
      return outHistoryId.length() > 0;
    }
  }
  return false;
}
bool supaUpdateCheckout(const String& historyId, String& outCheckOutAt) {
  String url = String(SUPA_URL) + "/rest/v1/parking_history?id=eq." + historyId;
  HTTPClient http; http.useHTTP10(true); http.setTimeout(HTTP_TIMEOUT_MS);
  if (!httpBegin(http, url)) return false;
  http.addHeader("apikey", SUPA_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPA_KEY);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Prefer", "return=representation");

  StaticJsonDocument<128> body;
  body["check_out_time"] = "now()";
  String json; serializeJson(body, json);

  int code = http.PATCH(json);
  String payload = http.getString(); http.end();

  if (code == 200) {
    DynamicJsonDocument doc(512);
    if (!deserializeJson(doc, payload)) {
      outCheckOutAt = parseTimestamp(doc[0], "check_out_time", "checkOutTime", "check_out_at", "checkOutAt");
      return outCheckOutAt.length() > 0;
    }
  }
  return false;
}
#endif

// ================== API LAYER ==================

// Tra user theo biển số — trả "" nếu không tìm thấy
String fetchUserIdByPlate(String plate) {
  if (!ensureAuth()) return "";

  String url = String(BASE_URL) + String(FIND_PLATE_PATH) + urlEncode(plate);
  int code = -1; String payload;
  bool ok = doHttpWithRetry([&](HTTPClient& https){ return https.GET(); }, url, code, payload);
  if (!ok) { Serial.println("❌ GET plate fail"); return ""; }

  Serial.printf("🌐 GET plate code: %d\n", code);
  if (code == 200) {
    DynamicJsonDocument doc(4096);
    if (!deserializeJson(doc, payload)) {
      String userId = "";

      if (doc["data"]["id"].is<String>())                  userId = doc["data"]["id"].as<String>();
      else if (doc["id"].is<String>())                     userId = doc["id"].as<String>();
      else if (doc["data"]["user"]["id"].is<String>())     userId = doc["data"]["user"]["id"].as<String>();
      else if (doc["user"]["id"].is<String>())             userId = doc["user"]["id"].as<String>();
      else if (doc["data"]["userId"].is<String>())         userId = doc["data"]["userId"].as<String>();
      else if (doc["userId"].is<String>())                 userId = doc["userId"].as<String>();
      else if (doc["data"]["id"].is<long long>())          userId = String(doc["data"]["id"].as<long long>());
      else if (doc["id"].is<long long>())                  userId = String(doc["id"].as<long long>());
      else if (doc["data"]["user"]["id"].is<long long>())  userId = String(doc["data"]["user"]["id"].as<long long>());
      else if (doc["user"]["id"].is<long long>())          userId = String(doc["user"]["id"].as<long long>());
      else if (doc["data"]["userId"].is<long long>())      userId = String(doc["data"]["userId"].as<long long>());
      else if (doc["userId"].is<long long>())              userId = String(doc["userId"].as<long long>());

      userId.trim();
      if (userId.length() > 0 && userId != "null") {
        Serial.println("✅ Tìm thấy userId: " + userId + " cho plate: " + plate);
        return userId;
      } else {
        Serial.println("⛔ Không tìm thấy userId trong payload cho plate: " + plate);
        return "";
      }
    } else {
      Serial.println("❌ JSON parse lỗi khi tìm userId theo plate");
      return "";
    }
  } else if (code == 404) {
    Serial.println("ℹ️ Plate không tồn tại (404): " + plate);
    return "";
  } else {
    Serial.printf("⚠️ GET plate code=%d payload=%s\n", code, payload.c_str());
    return "";
  }
}

// Check-in linh hoạt: có userId thì gửi; không có vẫn check-in với plate+slotId.
// Luôn cố gắng lấy lại user_id từ server (ưu tiên data.history.user_id).
bool apiCheckIn(const String& userIdMaybeEmpty,
                const String& plate,
                int slotId,
                String& outHistoryId,
                String& outCheckInAt,
                String* outResolvedUserId /* có thể nullptr */) {
  if (!ensureAuth()) return false;
  String url = buildUrl(CHECKIN_PATH);

  int code=-1; String payload;
  bool ok = doHttpWithRetry([&](HTTPClient& https){
    https.addHeader("Content-Type", "application/json");
    StaticJsonDocument<384> body;

    body["slot_id"]       = slotId;
    body["slotId"]        = slotId;
    body["license_plate"] = plate;
    body["licensePlate"]  = plate;

    String trimmed = userIdMaybeEmpty; trimmed.trim();
    if (trimmed.length() > 0 && trimmed != "null") {
      body["user_id"] = trimmed;
      body["userId"]  = trimmed;
    }

    String json; serializeJson(body, json);
    Serial.println("➡️ CHECK-IN Body: " + json);
    return https.POST(json);
  }, url, code, payload);

  Serial.printf("📝 CHECK-IN slot %d → %d\n", slotId, code);

  if (ok && (code==200 || code==201)) {
    DynamicJsonDocument doc(8192);
    if (!deserializeJson(doc, payload)) {

      // historyId (ưu tiên data.history.id)
      if (doc["data"]["history"]["id"].is<long long>())      outHistoryId = String(doc["data"]["history"]["id"].as<long long>());
      else if (doc["data"]["history"]["id"].is<String>())    outHistoryId = doc["data"]["history"]["id"].as<String>();
      else if (doc["data"]["id"].is<long long>())            outHistoryId = String(doc["data"]["id"].as<long long>());
      else if (doc["data"]["id"].is<String>())               outHistoryId = doc["data"]["id"].as<String>();
      else if (doc["id"].is<long long>())                    outHistoryId = String(doc["id"].as<long long>());
      else if (doc["id"].is<String>())                       outHistoryId = doc["id"].as<String>();

      // timestamp
      JsonVariant dataNode;
      if (!doc["data"]["history"].isNull()) dataNode = doc["data"]["history"];
      else if (!doc["data"].isNull())       dataNode = doc["data"];
      else                                  dataNode = doc.as<JsonVariant>();
      outCheckInAt = parseTimestamp(dataNode, "check_in_time", "checkInTime", "check_in_at", "checkInAt");

      // ✅ ƯU TIÊN user_id từ history (đúng như server đã ghi)
      if (outResolvedUserId) {
        String resolved = "";
        if (doc["data"]["history"]["user_id"].is<String>())         resolved = doc["data"]["history"]["user_id"].as<String>();
        else if (doc["data"]["history"]["user_id"].is<long long>()) resolved = String(doc["data"]["history"]["user_id"].as<long long>());

        // fallback nếu API không trả trong history
        if (resolved.length() == 0 || resolved == "null") {
          if (doc["data"]["user"]["id"].is<String>())               resolved = doc["data"]["user"]["id"].as<String>();
          else if (doc["data"]["userId"].is<String>())              resolved = doc["data"]["userId"].as<String>();
          else if (doc["userId"].is<String>())                      resolved = doc["userId"].as<String>();
          else if (doc["data"]["user"]["id"].is<long long>())       resolved = String(doc["data"]["user"]["id"].as<long long>());
          else if (doc["data"]["userId"].is<long long>())           resolved = String(doc["data"]["userId"].as<long long>());
          else if (doc["userId"].is<long long>())                   resolved = String(doc["userId"].as<long long>());
        }
        resolved.trim();
        if (resolved.length() > 0 && resolved != "null") {
          *outResolvedUserId = resolved;
          Serial.println("✅ Server user_id (history.user_id): " + resolved);
        }
      }

      bool success = outHistoryId.length() > 0 && outHistoryId != "null";
      if (!success) Serial.println("❌ Lỗi: historyId không hợp lệ: " + outHistoryId);
      return success;
    }
  }

  if (payload.length()) Serial.println(payload);
  return false;
}

// Check-out
bool apiCheckOut(const String& historyId, String& outCheckOutAt) {
  if (!ensureAuth()) return false;
  String url = buildUrl(CHECKOUT_PATH);

  int code=-1; String payload;
  bool ok = doHttpWithRetry([&](HTTPClient& https){
    https.addHeader("Content-Type", "application/json");
    StaticJsonDocument<192> body;
    body["history_id"] = historyId;
    body["id"]         = historyId;
    String json; serializeJson(body, json);
    Serial.println("➡️ CHECK-OUT Body: " + json);
    return https.POST(json);
  }, url, code, payload);

  Serial.printf("🧾 CHECK-OUT history=%s → %d\n", historyId.c_str(), code);

  if (ok && code==200) {
    DynamicJsonDocument doc(8192);
    if (!deserializeJson(doc, payload)) {
      JsonVariant dataNode;
      if (!doc["data"]["history"].isNull()) dataNode = doc["data"]["history"];
      else if (!doc["data"].isNull())       dataNode = doc["data"];
      else                                  dataNode = doc.as<JsonVariant>();
      outCheckOutAt = parseTimestamp(dataNode, "check_out_time", "checkOutTime", "check_out_at", "checkOutAt");
      Serial.println("🕒 Parsed check-out time: " + outCheckOutAt);
      return outCheckOutAt.length()>0;
    }
  }
#if USE_SUPABASE_FALLBACK
  if (supaUpdateCheckout(historyId, outCheckOutAt)) return true;
#endif
  if (payload.length()) Serial.println(payload);
  return false;
}

// Update slot status API
bool putSlotStatus(int slotId, const String& status) {
  if (!ensureAuth()) return false;
  char path[128]; snprintf(path, sizeof(path), SLOT_STATUS_PUT_FMT, slotId);
  String url = buildUrl(path);
  int code=-1; String payload;
  bool ok = doHttpWithRetry([&](HTTPClient& https){
    https.addHeader("Content-Type", "application/json");
    StaticJsonDocument<128> body; body["status"]=status; String json; serializeJson(body, json);
    Serial.println("➡️ PUT slot status: " + json);
    return https.PUT(json);
  }, url, code, payload);
  Serial.printf("🔄 PUT slot %d status='%s' → %d\n", slotId, status.c_str(), code);
  if (!ok || (code != 200 && code != 204)) {
    if (payload.length()) Serial.println(payload);
    return false;
  }
  return true;
}

// ================== PHẦN CỨNG ==================
float readDistanceCM(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW); delayMicroseconds(2);
  digitalWrite(trigPin, HIGH); delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long duration = pulseIn(echoPin, HIGH, ULTRA_TIMEOUT_US);
  float distance = duration * 0.034f / 2.0f;
  if (distance <= 0 || distance > 400) distance = 400;
  return distance;
}

void printStatus() {
  Serial.println("\n📋 ====== TRẠNG THÁI HIỆN TẠI ======");
  Serial.println("+-----+-------------+-----------+-------------+--------------------------------------+---------------------+---------------------+");
  Serial.println("| Slot| Khoảng cách | Trạng thái|   Biển số   |                UserID               |     Check-in at     |    Check-out at     |");
  Serial.println("+-----+-------------+-----------+-------------+--------------------------------------+---------------------+---------------------+");
  for (int i = 0; i < NUM_SLOTS; i++) {
    String status = slots[i].occupied ? "🚗 Có xe " : "🟢 Trống  ";
    String plate = "-", userId = "-", inAt = "-", outAt = "-";
    int idx = findParkedIndexBySlot(i + 1);
    if (idx >= 0) {
      auto &pc = parkedCars[idx];
      plate  = pc.plate; userId = pc.userId;

      if (pc.checkInAt.length() > 18)  inAt  = pc.checkInAt.substring(0, 19);
      else if (pc.checkInAt.length() > 0) inAt = pc.checkInAt;

      if (pc.checkOutAt.length() > 18) outAt = pc.checkOutAt.substring(0, 19);
      else if (pc.checkOutAt.length() > 0) outAt = pc.checkOutAt;
    }
    char line[360];
    snprintf(line, sizeof(line), "|  %-2d |   %6.1f cm | %-9s| %-11s| %-36s| %-19s | %-19s |",
             i + 1, slots[i].distance, status.c_str(), plate.c_str(), userId.c_str(),
             inAt.c_str(), outAt.c_str());
    Serial.println(line);
  }
  Serial.println("+-----+-------------+-----------+-------------+--------------------------------------+---------------------+---------------------+");
  Serial.printf("🅿️ Xe đang đậu: %d/%d | FreeHeap=%uB\n", parkedCount, NUM_SLOTS, ESP.getFreeHeap());
  Serial.println("===========================================================================================================================\n");
}

void initHardware() {
  Serial.println("🔧 Khởi tạo hardware...");
  for (int i = 0; i < NUM_SLOTS; i++) {
    pinMode(slots[i].trig, OUTPUT);
    pinMode(slots[i].echo, INPUT);
    pinMode(slots[i].ledGreen, OUTPUT);
    pinMode(slots[i].ledRed, OUTPUT);
    slots[i].servo.attach(slots[i].servoPin);
    slots[i].servo.write(0);
    slots[i].distance = 400;
    slots[i].occupied = false;
    slots[i].state = SLOT_IDLE;
    slots[i].stateStartTime = 0;
    digitalWrite(slots[i].ledGreen, HIGH);
    digitalWrite(slots[i].ledRed, LOW);
  }
  Serial.println("✅ Hardware sẵn sàng!");
}

String generatePlate() {
  if (random(0, 100) < 70 && DATABASE_COUNT > 0) {
    int idx = random(0, DATABASE_COUNT);
    Serial.println("📋 Lấy biển số từ DB: " + DATABASE[idx].plate);
    return DATABASE[idx].plate;
  }
  int prefix = random(11, 100); char letter = 'A' + random(0, 26); int suffix = random(1, 100000);
  char p[12]; sprintf(p, "%02d%c-%05d", prefix, letter, suffix);
  Serial.println("🎲 Sinh biển số ngẫu nhiên: " + String(p));
  return String(p);
}

// ================== SERVO STATE ==================
void updateServoStateMachine(int slotIdx) {
  Slot &s = slots[slotIdx];
  unsigned long now = millis();
  switch(s.state) {
    case SLOT_IDLE: break;
    case SLOT_OPENING:
      s.servo.write(90);
      s.state = SLOT_WAIT_CLOSE;
      s.stateStartTime = now;
      Serial.printf("🚪 Slot %d: Servo MỞ (90°)\n", slotIdx + 1);
      break;
    case SLOT_WAIT_CLOSE:
      if (now - s.stateStartTime >= SERVO_OPEN_DURATION_MS) {
        s.servo.write(0);
        s.state = SLOT_IDLE;
        Serial.printf("🚪 Slot %d: Servo ĐÓNG (0°)\n", slotIdx + 1);
      }
      break;
  }
}

// ================== LUỒNG CHÍNH ==================
void updateSlotStatus() {
  for (int i = 0; i < NUM_SLOTS; i++) {
    updateServoStateMachine(i);

    float dist = readDistanceCM(slots[i].trig, slots[i].echo);
    slots[i].distance = dist;

    bool prev = slots[i].occupied;
    bool now  = prev ? (dist < FREE_THRESH) : (dist < OCCUPY_THRESH);

    // XE VÀO
    if (!prev && now && parkedCount < NUM_SLOTS) {
      String plate = generatePlate();
      Serial.printf("🚗 === XE VÀO SLOT %d ===\n", i + 1);
      Serial.println("🔍 Biển số: " + plate);

      String userId = fetchUserIdByPlate(plate);
      if (userId.length() > 0 && userId != "null") {
        Serial.println("✅ Tìm thấy userId: " + userId + " cho plate: " + plate);
      } else {
        Serial.println("ℹ️ Chưa có user theo plate — vẫn CHECK-IN bằng plate+slot (server sẽ ghi lịch sử, có thể trả user_id).");
      }

      String historyId, checkInAt, resolvedUserFromServer = "";
      bool okIn = apiCheckIn(userId, plate, i + 1, historyId, checkInAt, &resolvedUserFromServer);

      if (!okIn) {
        Serial.println("❌ CHECK-IN FAIL → KHÔNG đổi trạng thái");
      } else {
        String localUserId = (userId.length() ? userId : String("(empty)"));
        String serverUserId = (resolvedUserFromServer.length() > 0 && resolvedUserFromServer != "null") 
                              ? resolvedUserFromServer : String("(empty)");
        
        Serial.println("🔎 userId(local before resolve)=" + localUserId);
        Serial.println("🔎 userId(server history)=" + serverUserId);
        
        // So sánh và hiển thị kết quả
        if (localUserId == serverUserId) {
          Serial.println("✅ KHỚP: userId local và server giống nhau!");
        } else if (localUserId == "(empty)" && serverUserId != "(empty)") {
          Serial.println("ℹ️ SYNC: Local empty → sử dụng server userId");
          userId = resolvedUserFromServer; // đồng bộ theo server/history
        } else if (localUserId != "(empty)" && serverUserId == "(empty)") {
          Serial.println("⚠️ WARNING: Local có userId nhưng server trả empty");
        } else {
          Serial.println("❌ KHÔNG KHỚP: Local=" + localUserId + " ≠ Server=" + serverUserId);
          userId = resolvedUserFromServer; // ưu tiên server/history
        }

        Serial.println("✅ CHECK-IN OK | historyId=" + historyId + " | at=" + checkInAt);

        if (!putSlotStatus(i + 1, "occupied")) Serial.println("⚠️ PUT occupied fail");

        parkedCars[parkedCount++] = {plate, i + 1, userId, historyId, checkInAt, ""};
        slots[i].occupied = true;

        digitalWrite(slots[i].ledGreen, LOW);
        digitalWrite(slots[i].ledRed, HIGH);

        slots[i].state = SLOT_OPENING;
      }
    }

    // XE RA
    if (prev && !now) {
      int idx = findParkedIndexBySlot(i + 1);
      Serial.printf("🚙 === XE RA KHỎI SLOT %d ===\n", i + 1);

      if (idx >= 0) {
        auto &pc = parkedCars[idx];
        Serial.println("📋 Biển số: " + pc.plate);
        Serial.println("👤 UserID: " + pc.userId);

        String outAt;
        bool okOut = false;
        if (pc.historyId.length() > 0 && pc.historyId != "null") okOut = apiCheckOut(pc.historyId, outAt);
        else Serial.println("⚠️ Không thể check-out: historyId không hợp lệ (" + pc.historyId + ")");

        if (okOut) {
          pc.checkOutAt = outAt;
          Serial.println("✅ CHECK-OUT OK | at=" + outAt);
        } else {
          Serial.println("⚠️ CHECK-OUT FAIL");
        }

        if (!putSlotStatus(i + 1, "available")) Serial.println("⚠️ PUT available fail");

        Serial.println("⏱  Thời gian: in=" + (pc.checkInAt.length() ? pc.checkInAt : "(unknown)") +
                       " | out=" + (pc.checkOutAt.length() ? pc.checkOutAt : "(unknown)"));

        removeParkedIndex(idx);
      }

      slots[i].occupied = false;
      digitalWrite(slots[i].ledGreen, HIGH);
      digitalWrite(slots[i].ledRed, LOW);
      slots[i].servo.write(0);
      slots[i].state = SLOT_IDLE;
    }
  }
}

void testAPI() {
  Serial.println("\n🧪 TEST LOGIN + LICENSE PLATE");
  if (!loginAndGetToken()) { Serial.println("❌ Login thất bại"); return; }
  String testPlate = "51D-22222";
  String uid = fetchUserIdByPlate(testPlate);
  if (uid.length() > 0 && uid != "null") {
    Serial.println("✅ API OK — Tìm thấy userId: " + uid + " cho plate: " + testPlate);
  } else {
    Serial.println("ℹ️ testPlate chưa có user — vẫn check-in bằng plate+slot như luồng chính.");
  }
}

unsigned long nextSenseAt = 0;
unsigned long nextPrintAt = 0;

void setup() {
  Serial.begin(115200); delay(1200);
  Serial.println("\n🚗 SMART PARKING (FINAL — USER-ID SYNC WITH SERVER)");
  WiFi.mode(WIFI_STA); WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("🌐 Kết nối WiFi");
  int tries=0;
  while (WiFi.status()!=WL_CONNECTED && tries<30){
    Serial.print(".");
    delay(500);
    tries++;
  }
  Serial.println(WiFi.status()==WL_CONNECTED ? "\n✅ WiFi OK" : "\n❌ WiFi FAIL");

  g_tlsClient.setInsecure();
  g_tlsClient.setTimeout(HTTP_TIMEOUT_MS);
  randomSeed(esp_random());
  initHardware();

  if (WiFi.status()==WL_CONNECTED) {
    delay(500);
    testAPI();
  }

  unsigned long now = millis();
  nextSenseAt = now + SENSE_INTERVAL_MS;
  nextPrintAt = now + PRINT_INTERVAL_MS;
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ Mất WiFi, reconnect...");
    WiFi.reconnect();
    delay(WIFI_RETRY_DELAY_MS);
    return;
  }
  unsigned long now = millis();
  if (now >= nextSenseAt) { updateSlotStatus(); nextSenseAt = now + SENSE_INTERVAL_MS; }
  if (now >= nextPrintAt) { printStatus();      nextPrintAt = now + PRINT_INTERVAL_MS; }
}
