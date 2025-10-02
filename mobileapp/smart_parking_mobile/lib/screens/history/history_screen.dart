import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/parking_service.dart';

class HistoryScreen extends StatefulWidget {
  final String token;
  final Map<String, dynamic> user;
  final String role;
  const HistoryScreen({
    Key? key,
    required this.token,
    required this.user,
    required this.role,
  }) : super(key: key);

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  List<dynamic> history = [];
  int page = 1;
  int limit = 10;
  int totalPages = 1;
  bool isLoading = false;
  String? errorMsg;

  @override
  void initState() {
    super.initState();
    fetchHistory();
  }

  Future<void> fetchHistory({int? newPage}) async {
    setState(() {
      isLoading = true;
      errorMsg = null;
    });
    final res = await ParkingService.getMyHistory(
      page: newPage ?? page,
      limit: limit,
    );
    if (res['success'] == true && res['data'] != null) {
      setState(() {
        history = res['data']['history'] ?? [];
        page = res['data']['pagination']['page'] ?? 1;
        limit = res['data']['pagination']['limit'] ?? 10;
        totalPages = res['data']['pagination']['totalPages'] ?? 1;
        isLoading = false;
      });
    } else {
      setState(() {
        errorMsg = res['message'] ?? 'Lỗi khi lấy lịch sử';
        isLoading = false;
      });
    }
  }

  String formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('dd/MM/yyyy HH:mm').format(date);
    } catch (_) {
      return dateStr;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Lịch sử đỗ xe'),
        backgroundColor: Colors.blue[700],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : errorMsg != null
          ? Center(
              child: Text(errorMsg!, style: const TextStyle(color: Colors.red)),
            )
          : history.isEmpty
          ? const Center(child: Text('Không có lịch sử đỗ xe'))
          : Column(
              children: [
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: history.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, idx) {
                      final item = history[idx];
                      final slotName =
                          item['parking_slots']?['slot_name'] ?? '---';
                      final checkIn = item['check_in_time'] ?? '';
                      final checkOut = item['check_out_time'];
                      final duration = item['duration_minutes'];
                      final status = item['status'] ?? '';
                      return Card(
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 2,
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(
                                    Icons.local_parking,
                                    color: Colors.blue[700],
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    slotName,
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const Spacer(),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: status == 'active'
                                          ? Colors.orange[100]
                                          : Colors.green[100],
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      status == 'active'
                                          ? 'Đang đỗ'
                                          : 'Hoàn thành',
                                      style: TextStyle(
                                        color: status == 'active'
                                            ? Colors.orange[800]
                                            : Colors.green[800],
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Icon(
                                        Icons.login,
                                        size: 18,
                                        color: Colors.blue[400],
                                      ),
                                      const SizedBox(width: 4),
                                      Text('Vào: ${formatDate(checkIn)}'),
                                    ],
                                  ),
                                  if (checkOut != null) ...[
                                    const SizedBox(height: 4),
                                    Row(
                                      children: [
                                        Icon(
                                          Icons.logout,
                                          size: 18,
                                          color: Colors.red[400],
                                        ),
                                        const SizedBox(width: 4),
                                        Text('Ra: ${formatDate(checkOut)}'),
                                      ],
                                    ),
                                  ],
                                ],
                              ),
                              if (duration != null) ...[
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    Icon(
                                      Icons.timer,
                                      size: 18,
                                      color: Colors.grey[700],
                                    ),
                                    const SizedBox(width: 4),
                                    Text('Thời gian: $duration phút'),
                                  ],
                                ),
                              ],
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.chevron_left),
                        onPressed: page > 1
                            ? () => fetchHistory(newPage: page - 1)
                            : null,
                      ),
                      Text('Trang $page/$totalPages'),
                      IconButton(
                        icon: const Icon(Icons.chevron_right),
                        onPressed: page < totalPages
                            ? () => fetchHistory(newPage: page + 1)
                            : null,
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}
