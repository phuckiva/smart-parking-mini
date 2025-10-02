import 'package:flutter/material.dart';

class HomeScreen extends StatelessWidget {
  final String token;
  final Map<String, dynamic> user;
  final String role;
  const HomeScreen({
    Key? key,
    required this.token,
    required this.user,
    required this.role,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(
        'Đây là trang chủ\nToken: $token\nUser: ${user['full_name'] ?? ''}\nRole: $role',
        style: TextStyle(fontSize: 18),
      ),
    );
  }
}
