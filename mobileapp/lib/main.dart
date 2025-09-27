import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:async';

void main() {
  runApp(const SmartParkingApp());
}

class SmartParkingApp extends StatelessWidget {
  const SmartParkingApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Smart Parking',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      home: const ParkingHomePage(),
    );
  }
}

class ParkingHomePage extends StatefulWidget {
  const ParkingHomePage({super.key});

  @override
  State<ParkingHomePage> createState() => _ParkingHomePageState();
}

class _ParkingHomePageState extends State<ParkingHomePage> {
  List<dynamic> slots = [];
  int totalSlots = 0;
  int availableSlots = 0;
  int occupiedSlots = 0;
  bool isLoading = true;
  String? errorMessage;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _fetchParkingData();
    // Auto-refresh every 5 seconds
    _timer = Timer.periodic(const Duration(seconds: 5), (timer) {
      _fetchParkingData();
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _fetchParkingData() async {
    try {
      // Replace with your backend URL
      const String apiUrl = 'http://localhost:3001/api/slots';
      final response = await http.get(Uri.parse(apiUrl));

      if (response.statusCode == 200) {  
        final data = json.decode(response.body);
        setState(() {
          slots = data['data'];
          totalSlots = data['totalSlots'];
          availableSlots = data['availableSlots'];
          occupiedSlots = data['occupiedSlots'];
          isLoading = false;
          errorMessage = null;
        });
      } else {
        throw Exception('Failed to load parking data');
      }
    } catch (e) {
      setState(() {
        isLoading = false;
        errorMessage = 'Unable to connect to parking system. Please check your connection.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('🚗 Smart Parking'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        elevation: 0,
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : errorMessage != null
              ? _buildErrorWidget()
              : _buildParkingContent(),
      floatingActionButton: FloatingActionButton(
        onPressed: _fetchParkingData,
        tooltip: 'Refresh',
        child: const Icon(Icons.refresh),
      ),
    );
  }

  Widget _buildErrorWidget() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red,
            ),
            const SizedBox(height: 16),
            Text(
              errorMessage!,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 16),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _fetchParkingData,
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildParkingContent() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildStatsCard(),
          const SizedBox(height: 20),
          const Text(
            'Parking Slots',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 10),
          Expanded(
            child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 1,
              ),
              itemCount: slots.length,
              itemBuilder: (context, index) {
                final slot = slots[index];
                return _buildSlotCard(slot);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsCard() {
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildStatItem('Total', totalSlots.toString(), Colors.blue),
            _buildStatItem('Available', availableSlots.toString(), Colors.green),
            _buildStatItem('Occupied', occupiedSlots.toString(), Colors.red),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            color: Colors.grey,
          ),
        ),
      ],
    );
  }

  Widget _buildSlotCard(dynamic slot) {
    final bool isOccupied = slot['isOccupied'];
    final int slotId = slot['id'];

    return Card(
      elevation: 2,
      color: isOccupied ? Colors.red[50] : Colors.green[50],
      child: InkWell(
        onTap: () {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Slot $slotId is ${isOccupied ? 'occupied' : 'available'}',
              ),
              duration: const Duration(seconds: 2),
            ),
          );
        },
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isOccupied ? Icons.directions_car : Icons.local_parking,
              size: 40,
              color: isOccupied ? Colors.red : Colors.green,
            ),
            const SizedBox(height: 8),
            Text(
              'Slot $slotId',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
            Text(
              isOccupied ? 'Occupied' : 'Available',
              style: TextStyle(
                fontSize: 10,
                color: isOccupied ? Colors.red : Colors.green,
              ),
            ),
          ],
        ),
      ),
    );
  }
}