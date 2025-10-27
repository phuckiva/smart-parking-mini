import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_config.dart';
import 'token_service.dart';

/// Service xử lý reservations (đặt chỗ)
class ReservationsService {
  static const String _basePath = '/reservations';

  /// Lấy danh sách reservations của tôi
  static Future<Map<String, dynamic>> listMine() async {
    try {
      final url = Uri.parse('${ApiConfig.baseApi}$_basePath');
      final headers = await TokenService.getAuthHeaders();

      final response = await http.get(url, headers: headers);
      final responseData = jsonDecode(response.body);

  if (response.statusCode >= 200 && response.statusCode < 300 && responseData['success'] == true) {
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
              responseData['message'] ?? 'Lấy danh sách đặt chỗ thất bại',
          'error': responseData['error'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Tạo reservation mới
  static Future<Map<String, dynamic>> create({
    required String slotId,
    required DateTime startTime,
    required DateTime endTime,
    String? notes,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseApi}$_basePath');
      final headers = await TokenService.getAuthHeaders();

      final response = await http.post(
        url,
        headers: headers,
        body: jsonEncode({
          'slot_id': slotId,
          'start_time': startTime.toIso8601String(),
          'end_time': endTime.toIso8601String(),
          if (notes != null) 'notes': notes,
        }),
      );

      final responseData = jsonDecode(response.body);

  if (response.statusCode >= 200 && response.statusCode < 300 && responseData['success'] == true) {
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
          'message': responseData['message'] ?? 'Tạo đặt chỗ thất bại',
          'error': responseData['error'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Hủy reservation
  static Future<Map<String, dynamic>> cancel(String reservationId) async {
    try {
      final url = Uri.parse('${ApiConfig.baseApi}$_basePath/$reservationId');
      final headers = await TokenService.getAuthHeaders();

      final response = await http.delete(url, headers: headers);
      final responseData = jsonDecode(response.body);

  if (response.statusCode >= 200 && response.statusCode < 300 && responseData['success'] == true) {
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
          'message': responseData['message'] ?? 'Hủy đặt chỗ thất bại',
          'error': responseData['error'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Admin: Lấy tất cả reservations
  static Future<Map<String, dynamic>> listAll({int? page, int? limit}) async {
    try {
      var url = '${ApiConfig.baseApi}$_basePath/admin/all';

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

  if (response.statusCode >= 200 && response.statusCode < 300 && responseData['success'] == true) {
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
          'message': responseData['message'] ?? 'Lấy tất cả đặt chỗ thất bại',
          'error': responseData['error'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }
}
