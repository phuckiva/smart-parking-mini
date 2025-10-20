/*
🚗 SMART PARKING SYSTEM (ESP32 + Ngrok + JWT) — DEV HTTPS (bỏ verify)
- Login lấy token (POST /api/auth/login)
- GET /api/users/license-plate/{plate} kèm Bearer
- Tự login lại nếu 401, retry 1 lần
- DEV HTTPS: dùng g_tlsClient.setInsecure() + https.useHTTP10(true)
- Lưu ý: BASE_URL phải là https://<public>.ngrok-free.app|.dev đúng 100%
*/

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ESP32Servo.h>
#include <ArduinoJson.h>

// ================== CẤU HÌNH MẠNG & CHẾ ĐỘ ==================
#define NUM_SLOTS 4
const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASS = "";

// DEV HTTPS (bỏ verify)
#define USE_TLS 1

// ================== API ==================
// ⚠️ ĐỔI thành HTTPS public URL mà ngrok đang show (copy y nguyên)
const char* BASE_URL        = "http://localhost:8888";
const char* LOGIN_PATH      = "/api/auth/login";
const char* FIND_PLATE_PATH = "/api/users/license-plate/"; // path param

// Tài khoản demo
const char* LOGIN_EMAIL    = "admin@smartparking.com";
const char* LOGIN_PASSWORD = "123456";

// User mặc định nếu API lỗi
String DEFAULT_USERID = "00000000-0000-0000-0000-000000000000";

// ================== DB giả lập biển số ==================
struct DatabaseEntry { String plate; };
const DatabaseEntry DATABASE[] = {
  {"51D-22222"}, {"51D-22223"}, {"51A-12345"}, {"29B-67890"}, {"99A-99999"}
};
const int DATABASE_COUNT = sizeof(DATABASE)/sizeof(DATABASE[0]);

// ================== Cấu trúc dữ liệu ==================
struct ParkedCar { String plate; int slotId; String userId; };

struct Slot {
  int trig, echo, ledGreen, ledRed, servoPin;
  Servo servo;
  float distance;
  bool occupied;
};

// Pin mapping
Slot slots[NUM_SLOTS] = {
  {4, 2, 5, 18, 15},
  {19, 21, 23, 22, 13},
  {25, 26, 14, 27, 12},
  {32, 33, 0, 17, 16}
};

ParkedCar parkedCars[NUM_SLOTS];
int    parkedCount = 0;
String AUTH_TOKEN  = "";

// Hysteresis
const float OCCUPY_THRESH = 10.0;
const float FREE_THRESH   = 14.0;

// ================== GLOBAL CLIENT (HTTPS) ==================
WiFiClientSecure g_tlsClient;

// ================== Tiện ích ==================
String urlEncode(const String& value) {
  String enc = ""; char c; char buf[4];
  for (size_t i = 0; i < value.length(); i++) {
    c = value.charAt(i);
    if (('a' <= c && c <= 'z') || ('A' <= c && c <= 'Z') ||
        ('0' <= c && c <= '9') || c=='-'||c=='_'||c=='.'||c=='~') enc += c;
    else { snprintf(buf, sizeof(buf), "%%%02X", (unsigned char)c); enc += buf; }
  }
  return enc;
}

String buildUrl(const char* path) { return String(BASE_URL) + String(path); }

void addCommonHeaders(HTTPClient& cli) {
  cli.addHeader("Accept", "application/json");
  cli.addHeader("User-Agent", "ESP32-ParkingSystem/1.0");
  cli.addHeader("ngrok-skip-browser-warning", "true");
  cli.addHeader("Connection", "close");
  if (AUTH_TOKEN.length() > 0) cli.addHeader("Authorization", "Bearer " + AUTH_TOKEN);
}

// HTTP begin() cho HTTPS DEV
bool httpBegin(HTTPClient& http, const String& url) {
  return http.begin(g_tlsClient, url);
}

// ================== AUTH ==================
bool loginAndGetToken() {
  HTTPClient https;
  https.useHTTP10(true);                     // 👈 tránh ALPN/h2
  https.setTimeout(20000);
  https.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);

  String url = buildUrl(LOGIN_PATH);
  if (!httpBegin(https, url)) { 
    Serial.println("❌ begin() login fail"); 
    Serial.println("🔗 Đường dẫn gửi đăng nhập: " + url);
    return false; 
  }

  StaticJsonDocument<256> body;
  body["email"]    = LOGIN_EMAIL;
  body["password"] = LOGIN_PASSWORD;
  String json; serializeJson(body, json);

  https.addHeader("Content-Type", "application/json");
  addCommonHeaders(https);

  Serial.println("🔐 Đang đăng nhập...");
  int code = https.POST(json);
  if (code <= 0) {
    Serial.printf("❌ Login HTTP error: %s (%d)\n", https.errorToString(code).c_str(), code);
    Serial.println("🔗 Đường dẫn gửi đăng nhập: " + url);
    String resp = https.getString();
    if (resp.length() > 0) Serial.println("📄 Response: " + resp); else Serial.println("Hihi");
    https.end(); return false;
  }
  Serial.printf("🔐 Login code: %d\n", code);

  bool ok = false;
  if (code == 200) {
    String payload = https.getString();
    DynamicJsonDocument doc(4096);
    DeserializationError err = deserializeJson(doc, payload);
    if (!err) {
      if (doc["data"]["token"].is<String>()) {
        AUTH_TOKEN = doc["data"]["token"].as<String>(); ok = AUTH_TOKEN.length() > 0;
      } else if (doc["token"].is<String>()) {
        AUTH_TOKEN = doc["token"].as<String>(); ok = AUTH_TOKEN.length() > 0;
      } else if (doc["access_token"].is<String>()) {
        AUTH_TOKEN = doc["access_token"].as<String>(); ok = AUTH_TOKEN.length() > 0;
      } else {
        Serial.println("⚠️ JSON không có token (data.token/token/access_token)");
      }
      Serial.println(ok ? "✅ Lấy token OK" : "⚠️ Không lấy được token");
    } else {
      Serial.println("⚠️ JSON parse error (login): " + String(err.c_str()));
    }
  } else {
    Serial.println("⚠️ Login thất bại (code != 200)");
    String resp = https.getString();
    if (resp.length() > 0) Serial.println("📄 Response: " + resp);
  }

  https.end();
  return ok;
}

// ================== API: tìm user theo biển số ==================
String fetchUserIdByPlate(String plate, bool allowRetry = true) {
  HTTPClient https;
  https.useHTTP10(true);                     // 👈 tránh ALPN/h2
  https.setTimeout(20000);
  https.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);

  String requestUrl = String(BASE_URL) + String(FIND_PLATE_PATH) + urlEncode(plate);
  Serial.println("🔗 GET: " + requestUrl);

  if (!httpBegin(https, requestUrl)) { Serial.println("❌ begin() fail"); return DEFAULT_USERID; }

  addCommonHeaders(https);
  int code = https.GET();
  String userId = DEFAULT_USERID;

  if (code == 401 && allowRetry) {
    Serial.println("🔁 401 Unauthorized → login lại rồi retry...");
    https.end();
    if (loginAndGetToken()) return fetchUserIdByPlate(plate, false);
    Serial.println("❌ Login lại thất bại");
    return DEFAULT_USERID;
  }

  if (code > 0) {
    Serial.printf("🌐 GET code: %d\n", code);
    String payload = https.getString();

    if (code == 200) {
      DynamicJsonDocument doc(4096);
      DeserializationError err = deserializeJson(doc, payload);
      if (err) {
        Serial.println("⚠️ JSON parse error: " + String(err.c_str()));
      } else {
        if (doc["data"]["id"].is<String>()) {
          userId = doc["data"]["id"].as<String>();
          Serial.println("✅ userId: " + userId);
        } else if (doc["id"].is<String>()) {
          userId = doc["id"].as<String>();
          Serial.println("✅ userId (fallback): " + userId);
        } else {
          Serial.println("⚠️ Response không có data.id / id");
          int maxLen = 200;
          int payloadLen = payload.length();
          Serial.println(payload.substring(0, payloadLen < maxLen ? payloadLen : maxLen));
        }
      }
    } else if (code == 404) {
      Serial.println("⚠️ Không tìm thấy người dùng cho plate này");
    } else {
      Serial.println("⚠️ Server code != 200");
      int maxLen = 200;
      int payloadLen = payload.length();
      Serial.println(payload.substring(0, payloadLen < maxLen ? payloadLen : maxLen));
    }
  } else {
    Serial.printf("❌ HTTP error: %s (%d)\n", https.errorToString(code).c_str(), code);
  }

  https.end();
  return userId;
}

String getUserId(String plate) {
  Serial.println("\n🔍 Tra cứu biển số: " + plate);
  if (AUTH_TOKEN.length() == 0) {
    Serial.println("ℹ️ Chưa có token → login trước");
    if (!loginAndGetToken()) { Serial.println("❌ Login fail → dùng DEFAULT_USERID"); return DEFAULT_USERID; }
  }
  return fetchUserIdByPlate(plate, true);
}

// ================== Cảm biến & hiển thị ==================
float readDistanceCM(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW); delayMicroseconds(2);
  digitalWrite(trigPin, HIGH); delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long duration = pulseIn(echoPin, HIGH, 30000);
  float distance = duration * 0.034 / 2.0;
  if (distance <= 0 || distance > 400) distance = 400;
  return distance;
}

void printStatus() {
  Serial.println("\n📋 ====== TRẠNG THÁI HIỆN TẠI ======");
  Serial.println("+-----+-------------+-----------+-------------+--------------------------------------+");
  Serial.println("| Slot| Khoảng cách | Trạng thái|   Biển số   |                UserID               |");
  Serial.println("+-----+-------------+-----------+-------------+--------------------------------------+");
  for (int i = 0; i < NUM_SLOTS; i++) {
    String status = slots[i].occupied ? "🚗 Có xe " : "🟢 Trống  ";
    String plate = "-"; String userId = "-";
    for (int j = 0; j < parkedCount; j++) {
      if (parkedCars[j].slotId == i + 1) { plate = parkedCars[j].plate; userId = parkedCars[j].userId; break; }
    }
    char line[200];
    snprintf(line, sizeof(line), "|  %-2d |   %6.1f cm | %-9s| %-11s| %-36s|",
             i + 1, slots[i].distance, status.c_str(), plate.c_str(), userId.c_str());
    Serial.println(line);
  }
  Serial.println("+-----+-------------+-----------+-------------+--------------------------------------+");
  Serial.println("🅿️ Xe đang đậu: " + String(parkedCount) + "/" + String(NUM_SLOTS));
  Serial.println("========================================================\n");
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
    digitalWrite(slots[i].ledGreen, HIGH);
    digitalWrite(slots[i].ledRed, LOW);
  }
  Serial.println("✅ Hardware sẵn sàng!");
}

String generatePlate() {
  if (random(0,100) < 70 && DATABASE_COUNT > 0) {
    int idx = random(0, DATABASE_COUNT);
    Serial.println("📋 Lấy biển số từ DB: " + DATABASE[idx].plate);
    return DATABASE[idx].plate;
  }
  int prefix = random(11,100); char letter = 'A'+random(0,26); int suffix = random(1,100000);
  char p[12]; sprintf(p, "%02d%c-%05d", prefix, letter, suffix);
  Serial.println("🎲 Sinh biển số ngẫu nhiên: " + String(p));
  return String(p);
}

void updateSlotStatus() {
  for (int i = 0; i < NUM_SLOTS; i++) {
    float dist = readDistanceCM(slots[i].trig, slots[i].echo);
    slots[i].distance = dist;

    bool prev = slots[i].occupied;
    bool now  = prev ? (dist < FREE_THRESH) : (dist < OCCUPY_THRESH);

    // XE VÀO
    if (!prev && now && parkedCount < NUM_SLOTS) {
      String plate = generatePlate();
      Serial.println("🚗 === XE VÀO SLOT " + String(i + 1) + " ===");
      Serial.println("🔍 Biển số: " + plate);

      String userId = getUserId(plate);
      parkedCars[parkedCount++] = {plate, i + 1, userId};
      slots[i].occupied = true;

      digitalWrite(slots[i].ledGreen, LOW);
      digitalWrite(slots[i].ledRed, HIGH);
      slots[i].servo.write(90);
      Serial.println("✅ Vào slot " + String(i + 1) + " | UserID: " + userId);
      delay(3000);
      slots[i].servo.write(0);
    }

    // XE RA
    if (prev && !now) {
      for (int j = 0; j < parkedCount; j++) {
        if (parkedCars[j].slotId == i + 1) {
          Serial.println("🚙 === XE RA KHỎI SLOT " + String(i + 1) + " ===");
          Serial.println("📋 Biển số: " + parkedCars[j].plate);
          Serial.println("👤 UserID: " + parkedCars[j].userId);
          for (int k = j; k < parkedCount - 1; k++) parkedCars[k] = parkedCars[k + 1];
          parkedCount--; break;
        }
      }
      slots[i].occupied = false;
      digitalWrite(slots[i].ledGreen, HIGH);
      digitalWrite(slots[i].ledRed, LOW);
      slots[i].servo.write(0);
    }
  }
}

// ================== TEST API ==================
void testAPI() {
  Serial.println("\n🧪 TEST LOGIN + LICENSE PLATE");
  if (!loginAndGetToken()) { Serial.println("❌ Login thất bại"); return; }
  String uid = fetchUserIdByPlate("51D-22222", true);
  if (uid != DEFAULT_USERID) Serial.println("✅ API OK, userId=" + uid);
  else Serial.println("⚠️ API trả DEFAULT_USERID — kiểm tra route/DB");
}

// ================== SETUP/LOOP ==================
void setup() {
  Serial.begin(115200); delay(1200);
  Serial.println("\n🚗 SMART PARKING (DEV HTTPS) — JWT + license-plate/{plate}");

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("🌐 Kết nối WiFi");
  int tries = 0; while (WiFi.status() != WL_CONNECTED && tries < 30){ Serial.print("."); delay(500); tries++; }
  Serial.println(WiFi.status()==WL_CONNECTED ? "\n✅ WiFi OK" : "\n❌ WiFi FAIL");

  // DEV HTTPS: bỏ verify để chạy ngay
  g_tlsClient.setInsecure();
  g_tlsClient.setTimeout(20000);

  initHardware();

  if (WiFi.status()==WL_CONNECTED) { delay(500); testAPI(); }
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) { Serial.println("⚠️ Mất WiFi, reconnect..."); WiFi.reconnect(); delay(5000); return; }
  updateSlotStatus();
  printStatus();
  delay(5000);
}
