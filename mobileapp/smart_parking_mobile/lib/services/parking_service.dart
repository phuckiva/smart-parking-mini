import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_config.dart';
import 'token_service.dart';

/// Service xử lý parking history
class ParkingService {
  static const String _basePath = '/parking';

  /// Check in vào bãi đỗ xe
  static Future<Map<String, dynamic>> checkIn({required String slotId}) async {
    try {
      final url = Uri.parse('${ApiConfig.baseApi}$_basePath/checkin');
      final headers = await TokenService.getAuthHeaders();

      final response = await http.post(
        url,
        headers: headers,
        body: jsonEncode({'slot_id': slotId}),
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
          'message': responseData['message'] ?? 'Check in thất bại',
          'error': responseData['error'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Check out khỏi bãi đỗ xe
  static Future<Map<String, dynamic>> checkOut() async {
    try {
      final url = Uri.parse('${ApiConfig.baseApi}$_basePath/checkout');
      final headers = await TokenService.getAuthHeaders();

      final response = await http.post(url, headers: headers);
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
          'message': responseData['message'] ?? 'Check out thất bại',
          'error': responseData['error'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy lịch sử đỗ xe của tôi
  static Future<Map<String, dynamic>> getMyHistory({
    int? page,
    int? limit,
  }) async {
    try {
      var url = '${ApiConfig.baseApi}$_basePath/history';

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
          'message': responseData['message'] ?? 'Lấy lịch sử thất bại',
          'error': responseData['error'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy phiên đỗ xe hiện tại
  static Future<Map<String, dynamic>> getCurrentSession() async {
    try {
      final url = Uri.parse('${ApiConfig.baseApi}$_basePath/current');
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
          'message': responseData['message'] ?? 'Lấy phiên hiện tại thất bại',
          'error': responseData['error'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Admin: Lấy tất cả lịch sử đỗ xe
  static Future<Map<String, dynamic>> adminListHistory({
    int? page,
    int? limit,
  }) async {
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
          'message': responseData['message'] ?? 'Lấy lịch sử admin thất bại',
          'error': responseData['error'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }
}
