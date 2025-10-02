import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_config.dart';
import 'token_service.dart';

/// Service xử lý users và roles
class UsersService {
  static const String _basePath = '/users';

  /// Lấy tất cả users
  static Future<Map<String, dynamic>> getAllUsers({
    int? page,
    int? limit,
  }) async {
    try {
      var url = '${ApiConfig.baseApi}$_basePath';

      // Thêm query parameters nếu có
      List<String> queryParams = [];
      if (page != null) queryParams.add('page=$page');
      if (limit != null) queryParams.add('limit=$limit');

      if (queryParams.isNotEmpty) {
        url += '?${queryParams.join('&')}';
      }

      final headers = await TokenService.getAuthHeaders();
      final response = await http.get(Uri.parse(url), headers: headers);
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200 && responseData['success'] == true) {
        return {
          'success': true,
          'data': responseData['data'],
          'message': responseData['message'],
        };
      } else {
        if (response.statusCode == 401) {
          await TokenService.clearTokenData();
        }

        return {
          'success': false,
          'message': responseData['message'] ?? 'Lấy danh sách user thất bại',
          'error': responseData['error'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy thông tin user theo ID
  static Future<Map<String, dynamic>> getUserById(String userId) async {
    try {
      final url = Uri.parse('${ApiConfig.baseApi}$_basePath/$userId');
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
        if (response.statusCode == 401) {
          await TokenService.clearTokenData();
        }

        return {
          'success': false,
          'message': responseData['message'] ?? 'Lấy thông tin user thất bại',
          'error': responseData['error'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Cập nhật thông tin của tôi
  static Future<Map<String, dynamic>> updateMe({
    String? fullName,
    String? licensePlate,
    String? email,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseApi}$_basePath/me');
      final headers = await TokenService.getAuthHeaders();

      Map<String, dynamic> body = {};
      if (fullName != null) body['full_name'] = fullName;
      if (licensePlate != null) body['license_plate'] = licensePlate;
      if (email != null) body['email'] = email;

      final response = await http.put(
        url,
        headers: headers,
        body: jsonEncode(body),
      );

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200 && responseData['success'] == true) {
        return {
          'success': true,
          'data': responseData['data'],
          'message': responseData['message'],
        };
      } else {
        if (response.statusCode == 401) {
          await TokenService.clearTokenData();
        }

        return {
          'success': false,
          'message': responseData['message'] ?? 'Cập nhật thông tin thất bại',
          'error': responseData['error'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Admin: Tạo user mới
  static Future<Map<String, dynamic>> createUser({
    required String email,
    required String password,
    required String fullName,
    String? licensePlate,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseApi}$_basePath');
      final headers = await TokenService.getAuthHeaders();

      final response = await http.post(
        url,
        headers: headers,
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
        if (response.statusCode == 401) {
          await TokenService.clearTokenData();
        }

        return {
          'success': false,
          'message': responseData['message'] ?? 'Tạo user thất bại',
          'error': responseData['error'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Admin: Cập nhật user
  static Future<Map<String, dynamic>> updateUserByAdmin({
    required String userId,
    String? fullName,
    String? licensePlate,
    String? email,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseApi}$_basePath/$userId');
      final headers = await TokenService.getAuthHeaders();

      Map<String, dynamic> body = {};
      if (fullName != null) body['full_name'] = fullName;
      if (licensePlate != null) body['license_plate'] = licensePlate;
      if (email != null) body['email'] = email;

      final response = await http.put(
        url,
        headers: headers,
        body: jsonEncode(body),
      );

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200 && responseData['success'] == true) {
        return {
          'success': true,
          'data': responseData['data'],
          'message': responseData['message'],
        };
      } else {
        if (response.statusCode == 401) {
          await TokenService.clearTokenData();
        }

        return {
          'success': false,
          'message': responseData['message'] ?? 'Cập nhật user thất bại',
          'error': responseData['error'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Admin: Xóa user
  static Future<Map<String, dynamic>> deleteUserByAdmin(String userId) async {
    try {
      final url = Uri.parse('${ApiConfig.baseApi}$_basePath/$userId');
      final headers = await TokenService.getAuthHeaders();

      final response = await http.delete(url, headers: headers);
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200 && responseData['success'] == true) {
        return {
          'success': true,
          'data': responseData['data'],
          'message': responseData['message'],
        };
      } else {
        if (response.statusCode == 401) {
          await TokenService.clearTokenData();
        }

        return {
          'success': false,
          'message': responseData['message'] ?? 'Xóa user thất bại',
          'error': responseData['error'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Admin: Gán role cho user
  static Future<Map<String, dynamic>> setUserRole({
    required String userId,
    required String roleId,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseApi}$_basePath/$userId/role');
      final headers = await TokenService.getAuthHeaders();

      final response = await http.post(
        url,
        headers: headers,
        body: jsonEncode({'role_id': roleId}),
      );

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200 && responseData['success'] == true) {
        return {
          'success': true,
          'data': responseData['data'],
          'message': responseData['message'],
        };
      } else {
        if (response.statusCode == 401) {
          await TokenService.clearTokenData();
        }

        return {
          'success': false,
          'message': responseData['message'] ?? 'Gán role thất bại',
          'error': responseData['error'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Admin: Lấy danh sách roles
  static Future<Map<String, dynamic>> listRoles() async {
    try {
      final url = Uri.parse('${ApiConfig.baseApi}$_basePath/admin/roles');
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
        if (response.statusCode == 401) {
          await TokenService.clearTokenData();
        }

        return {
          'success': false,
          'message': responseData['message'] ?? 'Lấy danh sách role thất bại',
          'error': responseData['error'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Admin: Tạo role mới
  static Future<Map<String, dynamic>> createRole({
    required String roleName,
    String? description,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseApi}$_basePath/admin/roles');
      final headers = await TokenService.getAuthHeaders();

      final response = await http.post(
        url,
        headers: headers,
        body: jsonEncode({
          'role_name': roleName,
          if (description != null) 'description': description,
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
        if (response.statusCode == 401) {
          await TokenService.clearTokenData();
        }

        return {
          'success': false,
          'message': responseData['message'] ?? 'Tạo role thất bại',
          'error': responseData['error'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Admin: Xóa role
  static Future<Map<String, dynamic>> deleteRole(String roleId) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.baseApi}$_basePath/admin/roles/$roleId',
      );
      final headers = await TokenService.getAuthHeaders();

      final response = await http.delete(url, headers: headers);
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200 && responseData['success'] == true) {
        return {
          'success': true,
          'data': responseData['data'],
          'message': responseData['message'],
        };
      } else {
        if (response.statusCode == 401) {
          await TokenService.clearTokenData();
        }

        return {
          'success': false,
          'message': responseData['message'] ?? 'Xóa role thất bại',
          'error': responseData['error'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }
}
