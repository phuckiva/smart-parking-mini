import 'package:shared_preferences/shared_preferences.dart';

/// Service để quản lý JWT token trong local storage
class TokenService {
  static const String _tokenKey = 'jwt_token';
  static const String _userKey = 'user_data';
  static const String _roleKey = 'user_role';

  /// Lưu token và thông tin user sau khi đăng nhập thành công
  static Future<void> saveTokenData({
    required String token,
    required Map<String, dynamic> user,
    required String role,
  }) async {
    final prefs = await SharedPreferences.getInstance();

    await prefs.setString(_tokenKey, token);
    await prefs.setString(_userKey, user.toString());
    await prefs.setString(_roleKey, role);
  }

  /// Lấy token hiện tại
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  /// Lấy thông tin user hiện tại
  static Future<String?> getUserData() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_userKey);
  }

  /// Lấy role của user hiện tại
  static Future<String?> getUserRole() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_roleKey);
  }

  /// Kiểm tra user đã đăng nhập chưa
  static Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  /// Xóa token và thông tin user (đăng xuất)
  static Future<void> clearTokenData() async {
    final prefs = await SharedPreferences.getInstance();

    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
    await prefs.remove(_roleKey);
  }

  /// Lấy headers có Authorization token để gọi API
  static Future<Map<String, String>> getAuthHeaders() async {
    final token = await getToken();

    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }
}
