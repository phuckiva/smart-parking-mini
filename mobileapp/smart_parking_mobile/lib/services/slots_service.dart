import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_config.dart';
import 'token_service.dart';

/// Service xử lý parking slots (chỗ đỗ xe)
class SlotsService {
  static const String _basePath = '/slots';

  /// Lấy thống kê slot hiệu dụng thực tế (API /slots/effective-stats)
  static Future<Map<String, dynamic>> getEffectiveSlotStats() async {
    try {
      final url = Uri.parse('${ApiConfig.baseApi}$_basePath/effective-stats');
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
          'message': responseData['message'] ?? 'Lấy thống kê slot thất bại',
          'error': responseData['error'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }
  
  /// Lấy danh sách chỗ đỗ xe còn trống
  static Future<Map<String, dynamic>> getAvailableSlots() async {
    try {
      final url = Uri.parse('${ApiConfig.baseApi}$_basePath/available');
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
          'message': responseData['message'] ?? 'Lấy chỗ trống thất bại',
          'error': responseData['error'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy danh sách chỗ đỗ xe có thể đặt trong khoảng thời gian
  static Future<Map<String, dynamic>> getAvailableSlotsByTimeRange({
    required String startTime,
    required String endTime,
  }) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.baseApi}$_basePath/available-by-time?start_time=$startTime&end_time=$endTime',
      );
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
          'message':
              responseData['message'] ?? 'Lấy chỗ đỗ theo thời gian thất bại',
          'error': responseData['error'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy tất cả chỗ đỗ xe
  static Future<Map<String, dynamic>> getAllSlots() async {
    try {
      final url = Uri.parse('${ApiConfig.baseApi}$_basePath');
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
          'message': responseData['message'] ?? 'Lấy danh sách chỗ đỗ thất bại',
          'error': responseData['error'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy thông tin chỗ đỗ xe theo ID
  static Future<Map<String, dynamic>> getSlotById(String slotId) async {
    try {
      final url = Uri.parse('${ApiConfig.baseApi}$_basePath/$slotId');
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
          'message': responseData['message'] ?? 'Lấy thông tin chỗ đỗ thất bại',
          'error': responseData['error'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Cập nhật trạng thái chỗ đỗ xe (cần quyền driver)
  static Future<Map<String, dynamic>> updateSlotStatus({
    required String slotId,
    required String status,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseApi}$_basePath/$slotId/status');
      final headers = await TokenService.getAuthHeaders();

      final response = await http.put(
        url,
        headers: headers,
        body: jsonEncode({'status': status}),
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
          'message': responseData['message'] ?? 'Cập nhật trạng thái thất bại',
          'error': responseData['error'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Admin: Tạo chỗ đỗ xe mới
  static Future<Map<String, dynamic>> createSlot({
    required String slotNumber,
    required String location,
    String? description,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseApi}$_basePath');
      final headers = await TokenService.getAuthHeaders();

      final response = await http.post(
        url,
        headers: headers,
        body: jsonEncode({
          'slot_number': slotNumber,
          'location': location,
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
          'message': responseData['message'] ?? 'Tạo chỗ đỗ thất bại',
          'error': responseData['error'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Admin: Xóa chỗ đỗ xe
  static Future<Map<String, dynamic>> deleteSlot(String slotId) async {
    try {
      final url = Uri.parse('${ApiConfig.baseApi}$_basePath/$slotId');
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
          'message': responseData['message'] ?? 'Xóa chỗ đỗ thất bại',
          'error': responseData['error'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }
}
