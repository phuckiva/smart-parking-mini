import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../login_screens/login_screen.dart';
import '../../services/users_service.dart';

class ProfileScreen extends StatefulWidget {
  final Map<String, dynamic> user;
  final String token;
  final String role;
  const ProfileScreen({
    Key? key,
    required this.user,
    required this.token,
    required this.role,
  }) : super(key: key);

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late Map<String, dynamic> user;

  @override
  void initState() {
    super.initState();
    user = Map<String, dynamic>.from(widget.user);
  }

  void _showUpdateDialog(BuildContext context) {
    String fullName = user['full_name'] ?? '';
    String email = user['email'] ?? '';
    String licensePlate = user['license_plate'] ?? '';
    String errorMsg = '';
    final _formKey = GlobalKey<FormState>();
    String? _validateEmail(String? value) {
      if (value == null || value.isEmpty) return 'Nhập email';
      final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
      if (!emailRegex.hasMatch(value)) return 'Email không đúng định dạng';
      return null;
    }

    String? _validateLicensePlate(String? value) {
      if (value == null || value.isEmpty) return 'Nhập biển số xe';
      final regex = RegExp(r'^(?:[1-9][1-9])([A-Z])([A-Z0-9])([0-9]{5})$');
      if (!regex.hasMatch(value)) return 'Biển số xe không đúng định dạng';
      final province = int.tryParse(value.substring(0, 2));
      if (province == null || province < 11 || province > 99)
        return '2 số đầu phải từ 11-99';
      return null;
    }

    showDialog(
      context: context,
      builder: (context) {
        return Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          insetPadding: const EdgeInsets.symmetric(
            horizontal: 12,
            vertical: 12,
          ),
          child: SafeArea(
            child: SingleChildScrollView(
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 24,
                ),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  color: Colors.white,
                ),
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.blue.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(
                              Icons.edit,
                              color: Colors.blue,
                              size: 24,
                            ),
                          ),
                          const SizedBox(width: 12),
                          const Text(
                            'Cập nhật thông tin',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      TextFormField(
                        initialValue: fullName,
                        decoration: InputDecoration(
                          labelText: 'Họ và tên',
                          prefixIcon: const Icon(Icons.person_outline),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          filled: true,
                          fillColor: Colors.blue[50],
                        ),
                        style: const TextStyle(fontSize: 16),
                        onChanged: (v) => fullName = v,
                        validator: (v) =>
                            v == null || v.isEmpty ? 'Nhập họ tên' : null,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        initialValue: email,
                        decoration: InputDecoration(
                          labelText: 'Email',
                          prefixIcon: const Icon(Icons.email_outlined),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          filled: true,
                          fillColor: Colors.orange[50],
                        ),
                        style: const TextStyle(fontSize: 16),
                        onChanged: (v) => email = v,
                        validator: _validateEmail,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        initialValue: licensePlate,
                        decoration: InputDecoration(
                          labelText: 'Biển số xe',
                          prefixIcon: const Icon(Icons.directions_car_outlined),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          filled: true,
                          fillColor: Colors.green[50],
                        ),
                        style: const TextStyle(fontSize: 16),
                        onChanged: (v) => licensePlate = v,
                        validator: _validateLicensePlate,
                      ),
                      const SizedBox(height: 24),
                      if (errorMsg.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Text(
                            errorMsg,
                            style: const TextStyle(color: Colors.red),
                          ),
                        ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          TextButton(
                            onPressed: () => Navigator.pop(context),
                            style: TextButton.styleFrom(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 24,
                                vertical: 12,
                              ),
                            ),
                            child: const Text(
                              'Hủy',
                              style: TextStyle(fontSize: 15),
                            ),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton.icon(
                            onPressed: () async {
                              if (!_formKey.currentState!.validate()) {
                                errorMsg = 'Vui lòng kiểm tra lại thông tin.';
                                (context as Element).markNeedsBuild();
                                return;
                              }
                              // Gọi API cập nhật thông tin user
                              Navigator.pop(context);
                              final result = await UsersService.updateMe(
                                fullName: fullName,
                                email: email,
                                licensePlate: licensePlate,
                              );
                              print('UpdateMe response: $result');
                              final isSuccess = result['success'] == true;
                              final message =
                                  result['message'] ??
                                  (isSuccess
                                      ? 'Cập nhật thành công!'
                                      : 'Cập nhật thất bại!');
                              if (!isSuccess && result['error'] != null) {
                                print('UpdateMe error: ${result['error']}');
                              }
                              if (isSuccess && user['id'] != null) {
                                // Refresh user data
                                final userRes = await UsersService.getUserById(
                                  user['id'].toString(),
                                );
                                print('GetUserById response: $userRes');
                                if (userRes['success'] == true &&
                                    userRes['data'] != null) {
                                  setState(() {
                                    user.clear();
                                    user.addAll(userRes['data']);
                                  });
                                }
                              }
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Row(
                                    children: [
                                      Icon(
                                        isSuccess
                                            ? Icons.check_circle
                                            : Icons.error,
                                        color: Colors.white,
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(child: Text(message)),
                                    ],
                                  ),
                                  backgroundColor: isSuccess
                                      ? Colors.green
                                      : Colors.red,
                                  behavior: SnackBarBehavior.floating,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                ),
                              );
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.blue,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 24,
                                vertical: 12,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                            icon: Icon(
                              Icons.save,
                              color: Colors.white,
                              size: 20,
                            ),
                            label: Text(
                              'Cập nhật',
                              style: TextStyle(
                                fontSize: 15,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  void _logout(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.logout, color: Colors.red, size: 28),
            SizedBox(width: 12),
            Text('Xác nhận đăng xuất'),
          ],
        ),
        content: const Text('Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (context) => LoginScreen()),
                (route) => false,
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: const Text(
              'Đăng xuất',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    String createdAt = user['created_at'] ?? '';
    String formattedDate = createdAt;
    try {
      if (createdAt.isNotEmpty) {
        final date = DateTime.parse(createdAt);
        formattedDate = DateFormat('dd/MM/yyyy HH:mm').format(date);
      }
    } catch (_) {}

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Colors.blue[700]!, Colors.blue[500]!, Colors.white],
          stops: const [0.0, 0.3, 0.3],
        ),
      ),
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: Column(
            children: [
              const SizedBox(height: 20),
              // Avatar với hiệu ứng đẹp
              Stack(
                alignment: Alignment.center,
                children: [
                  Container(
                    width: 130,
                    height: 130,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        colors: [Colors.blue[300]!, Colors.blue[700]!],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.blue.withOpacity(0.4),
                          blurRadius: 20,
                          spreadRadius: 5,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    width: 120,
                    height: 120,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white,
                    ),
                    child: Center(
                      child: Text(
                        (user['full_name'] ?? 'U')[0].toUpperCase(),
                        style: TextStyle(
                          fontSize: 48,
                          fontWeight: FontWeight.bold,
                          color: Colors.blue[700],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              // Tên người dùng
              Text(
                user['full_name'] ?? 'Người dùng',
                style: const TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 6),
              // Role badge
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.9),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.verified_user,
                      size: 16,
                      color: Colors.blue[700],
                    ),
                    const SizedBox(width: 6),
                    Text(
                      widget.role,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.blue[700],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              // Card thông tin
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.08),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'THÔNG TIN CÁ NHÂN',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.2,
                          color: Colors.grey,
                        ),
                      ),
                      const SizedBox(height: 20),
                      _buildInfoRow(
                        Icons.email_outlined,
                        'Email',
                        user['email'] ?? '',
                        Colors.orange,
                      ),
                      const Divider(height: 32),
                      _buildInfoRow(
                        Icons.directions_car_outlined,
                        'Biển số xe',
                        user['license_plate'] ?? 'Chưa cập nhật',
                        Colors.green,
                      ),
                      if (user['phone'] != null &&
                          user['phone'].toString().isNotEmpty) ...[
                        const Divider(height: 32),
                        _buildInfoRow(
                          Icons.phone_outlined,
                          'Số điện thoại',
                          user['phone'] ?? '',
                          Colors.purple,
                        ),
                      ],
                      if (user['address'] != null &&
                          user['address'].toString().isNotEmpty) ...[
                        const Divider(height: 32),
                        _buildInfoRow(
                          Icons.home_outlined,
                          'Địa chỉ',
                          user['address'] ?? '',
                          Colors.teal,
                        ),
                      ],
                      const Divider(height: 32),
                      _buildInfoRow(
                        Icons.calendar_today_outlined,
                        'Ngày tạo',
                        formattedDate,
                        Colors.blue,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 28),
              // Nút hành động
              Row(
                children: [
                  Expanded(
                    child: _buildActionButton(
                      icon: Icons.edit_outlined,
                      label: 'Cập nhật',
                      color: Colors.blue[600]!,
                      onPressed: () => _showUpdateDialog(context),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildActionButton(
                      icon: Icons.logout_outlined,
                      label: 'Đăng xuất',
                      color: Colors.red[400]!,
                      onPressed: () => _logout(context),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value, Color color) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: color, size: 22),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onPressed,
  }) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 18),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 22),
            const SizedBox(width: 8),
            Text(
              label,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }
}
