import 'package:flutter/material.dart';
//import '../../services/auth_service.dart';
import '../../services/users_service.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({Key? key}) : super(key: key);

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  String email = '';
  String password = '';
  String fullName = '';
  String licensePlate = '';
  String errorMsg = '';
  bool isLoading = false;

  String? _validateEmail(String? value) {
    if (value == null || value.isEmpty) return 'Nhập email';
    final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    if (!emailRegex.hasMatch(value)) return 'Email không đúng định dạng';
    return null;
  }

  String? _validateLicensePlate(String? value) {
    if (value == null || value.isEmpty) return 'Nhập biển số xe';
    // Regex: 2 số đầu từ 11-99, 1 chữ, 1 số hoặc chữ, 5 số cuối
    final regex = RegExp(r'^(?:[1-9][1-9])([A-Z])([A-Z0-9])([0-9]{5})$');
    if (!regex.hasMatch(value)) return 'Biển số xe không đúng định dạng';
    // Kiểm tra 2 số đầu từ 11-99
    final province = int.tryParse(value.substring(0, 2));
    if (province == null || province < 11 || province > 99)
      return '2 số đầu phải từ 11-99';
    return null;
  }

  void _register() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      isLoading = true;
      errorMsg = '';
    });
    final result = await UsersService.createUser(
      email: email,
      password: password,
      fullName: fullName,
      licensePlate: licensePlate,
    );
    setState(() {
      isLoading = false;
    });
    if (result['success'] == true) {
      // In response ra terminal
      // ignore: avoid_print
      print('Đăng ký thành công, response từ server: $result');
      Navigator.pop(context);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Đăng ký thành công!')));
    } else {
      setState(() {
        errorMsg = result['message'] ?? 'Đăng ký thất bại';
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['message'] ?? 'Đăng ký thất bại')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              const SizedBox(height: 40),
              // Hình minh họa
              SizedBox(
                height: 180,
                child: Image.asset(
                  'assets/image/Login_screen.jpg',
                  fit: BoxFit.contain,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Đăng ký tài khoản',
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.bold,
                  color: Colors.blue[900],
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Tạo tài khoản Smart Parking',
                style: TextStyle(fontSize: 16, color: Colors.blue[700]),
              ),
              const SizedBox(height: 24),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      TextFormField(
                        decoration: InputDecoration(
                          labelText: 'Họ và tên',
                          prefixIcon: Icon(
                            Icons.person,
                            color: Colors.blue[700],
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        onChanged: (v) => fullName = v,
                        validator: (v) =>
                            v == null || v.isEmpty ? 'Nhập họ tên' : null,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        decoration: InputDecoration(
                          labelText: 'Email',
                          prefixIcon: Icon(
                            Icons.email,
                            color: Colors.blue[700],
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        onChanged: (v) => email = v,
                        validator: _validateEmail,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        decoration: InputDecoration(
                          labelText: 'Mật khẩu',
                          prefixIcon: Icon(Icons.lock, color: Colors.blue[700]),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        obscureText: true,
                        onChanged: (v) => password = v,
                        validator: (v) => v == null || v.length < 6
                            ? 'Mật khẩu >= 6 ký tự'
                            : null,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        decoration: InputDecoration(
                          labelText: 'Biển số xe',
                          prefixIcon: Icon(
                            Icons.directions_car,
                            color: Colors.blue[700],
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        onChanged: (v) => licensePlate = v,
                        validator: _validateLicensePlate,
                      ),
                      const SizedBox(height: 20),
                      if (errorMsg.isNotEmpty)
                        Text(
                          errorMsg,
                          style: const TextStyle(color: Colors.red),
                        ),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.blue[700],
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          onPressed: isLoading ? null : _register,
                          child: isLoading
                              ? const CircularProgressIndicator(
                                  color: Colors.white,
                                )
                              : const Text(
                                  'Đăng ký',
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: Colors.white,
                                  ),
                                ),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
