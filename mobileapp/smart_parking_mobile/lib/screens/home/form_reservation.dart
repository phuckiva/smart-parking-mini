import 'package:flutter/material.dart';

class FormReservation extends StatelessWidget {
  final String token;
  final Map<String, dynamic> user;
  final String role;

  const FormReservation({
    Key? key,
    required this.token,
    required this.user,
    required this.role,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
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
                  Icons.add_box_outlined,
                  color: Colors.blue,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              const Text(
                'Form đặt chỗ',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text('Token: $token'),
          Text('User: ${user['full_name'] ?? ''}'),
          Text('Role: $role'),
          const SizedBox(height: 24),
          const Text('Nội dung form đặt chỗ sẽ được bổ sung sau.'),
        ],
      ),
    );
  }
}
