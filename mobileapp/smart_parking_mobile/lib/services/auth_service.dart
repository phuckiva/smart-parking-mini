import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_config.dart';
import 'token_service.dart';

/// Service xử lý authentication
class AuthService {
  static const String _basePath = '/auth';

  /// Đăng nhập
  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseApi}$_basePath/login');

      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200 && responseData['success'] == true) {
        // Lưu token và thông tin user
        final data = responseData['data'];
        await TokenService.saveTokenData(
          token: data['token'],
          user: data['user'],
          role: data['role'],
        );

        return {
          'success': true,
          'data': data,
          'message': responseData['message'],
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Đăng nhập thất bại',
          'error': responseData['error'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Đăng ký
  static Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String fullName,
    String? licensePlate,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseApi}$_basePath/register');

      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
          'full_name': fullName,
          if (licensePlate != null) 'license_plate': licensePlate,
        }),
      );

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200 && responseData['success'] == true) {
        return {
          'success': true,
          'data': responseData['data'],
          'message': responseData['message'],
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Đăng ký thất bại',
          'error': responseData['error'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy thông tin profile
  static Future<Map<String, dynamic>> getProfile() async {
    try {
      final url = Uri.parse('${ApiConfig.baseApi}$_basePath/profile');
      final headers = await TokenService.getAuthHeaders();

      final response = await http.get(url, headers: headers);
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200 && responseData['success'] == true) {
        return {
          'success': true,
          'data': responseData['data'],
          'message': responseData['message'],
        };
      } else {
        // Token có thể hết hạn
        if (response.statusCode == 401) {
          await TokenService.clearTokenData();
        }

        return {
          'success': false,
          'message': responseData['message'] ?? 'Lấy thông tin thất bại',
          'error': responseData['error'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Đăng xuất
  static Future<void> logout() async {
    await TokenService.clearTokenData();
  }

  /// Kiểm tra trạng thái đăng nhập
  static Future<bool> isLoggedIn() async {
    return await TokenService.isLoggedIn();
  }
}
