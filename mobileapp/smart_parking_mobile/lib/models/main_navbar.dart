import 'package:flutter/material.dart';
import '../screens/home/home_screen.dart';
import '../screens/history/history_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/history/history_reservations_screen.dart';

class MainNavbar extends StatefulWidget {
  final String token;
  final Map<String, dynamic> user;
  final String role;
  const MainNavbar({
    Key? key,
    required this.token,
    required this.user,
    required this.role,
  }) : super(key: key);

  @override
  State<MainNavbar> createState() => _MainNavbarState();
}

class _MainNavbarState extends State<MainNavbar> {
  int _selectedIndex = 0;

  late final List<Widget> _pages;

  @override
  void initState() {
    super.initState();
    _pages = [
      HomeScreen(token: widget.token, user: widget.user, role: widget.role),
      HistoryScreen(token: widget.token, user: widget.user, role: widget.role),
      HistoryReservationsScreen(token: widget.token, user: widget.user, role: widget.role),
      ProfileScreen(token: widget.token, user: widget.user, role: widget.role),
    ];
  }

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
        selectedItemColor: Colors.blue[700],
        unselectedItemColor: Colors.grey,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.history), label: 'Lịch sử đỗ xe'),
          BottomNavigationBarItem(icon: Icon(Icons.bookmark), label: 'Lịch sử đặt chỗ'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}
