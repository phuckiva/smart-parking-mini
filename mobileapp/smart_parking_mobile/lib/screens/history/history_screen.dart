import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/parking_service.dart';
import '../../services/slots_service.dart';

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
  List<dynamic> filteredHistory = [];
  List<dynamic> slots = [];
  int page = 1;
  int limit = 10;
  int totalPages = 1;
  bool isLoading = false;
  String? errorMsg;
  // Filter state
  String? selectedSlotId;
  DateTime? filterStart;
  DateTime? filterEnd;


  @override
  void initState() {
    super.initState();
    fetchHistory();
    fetchSlots();
  }

  Future<void> fetchSlots() async {
    final res = await SlotsService.getAllSlots();
    if (res['success'] == true && res['data'] != null) {
      setState(() {
        slots = res['data']['slots'] ?? [];
      });
    }
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
      applyFilter();
    } else {
      setState(() {
        errorMsg = res['message'] ?? 'Lỗi khi lấy lịch sử';
        isLoading = false;
      });
    }
  }

  void applyFilter() {
    List<dynamic> result = List.from(history);
    // Filter by slot
    if (selectedSlotId != null && selectedSlotId!.isNotEmpty) {
      result = result.where((h) =>
        h['parking_slots'] != null &&
        (h['parking_slots']['id'].toString() == selectedSlotId)
      ).toList();
    }
    // Filter by time
    if (filterStart != null) {
      result = result.where((h) {
        final checkIn = h['check_in_time'];
        if (checkIn == null) return false;
        final dt = DateTime.tryParse(checkIn);
        if (dt == null) return false;
        return !dt.isBefore(filterStart!);
      }).toList();
    }
    if (filterEnd != null) {
      result = result.where((h) {
        final checkOut = h['check_out_time'];
        if (checkOut == null) return false;
        final dt = DateTime.tryParse(checkOut);
        if (dt == null) return false;
        return !dt.isAfter(filterEnd!);
      }).toList();
    }
    setState(() {
      filteredHistory = result;
    });
  }

  String formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('dd/MM/yyyy HH:mm').format(date);
    } catch (_) {
      return dateStr;
    }
  }

  int get activeCount => filteredHistory.where((h) => h['status'] == 'active').length;
  int get completedCount =>
    filteredHistory.where((h) => h['status'] != 'active').length;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        elevation: 0,
        title: const Text(
          'Lịch sử đỗ xe',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 22),
        ),
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Colors.blue[700]!, Colors.blue[500]!],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : errorMsg != null
          ? _buildErrorState()
          : history.isEmpty
          ? _buildEmptyState()
          : RefreshIndicator(
              onRefresh: () => fetchHistory(newPage: page),
              child: Column(
                children: [
                  // Statistics Header
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.blue[700]!, Colors.blue[500]!],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                      child: Row(
                        children: [
                          Expanded(
                            child: _buildStatCard(
                              icon: Icons.timer,
                              label: 'Đang đỗ',
                              value: '$activeCount',
                              color: Colors.orange,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _buildStatCard(
                              icon: Icons.check_circle,
                              label: 'Hoàn thành',
                              value: '$completedCount',
                              color: Colors.green,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _buildStatCard(
                              icon: Icons.history,
                              label: 'Tổng số',
                              value: '${filteredHistory.length}',
                              color: Colors.blue[300]!,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Search/Filter Section
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            // Slot Dropdown
                            Expanded(
                              child: DropdownButtonFormField<String>(
                                value: selectedSlotId,
                                isExpanded: true,
                                decoration: const InputDecoration(
                                  labelText: 'Chọn chỗ đỗ',
                                  border: OutlineInputBorder(),
                                  contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                ),
                                items: [
                                  const DropdownMenuItem<String>(
                                    value: null,
                                    child: Text('Tất cả chỗ đỗ'),
                                  ),
                                  ...slots.map<DropdownMenuItem<String>>((slot) => DropdownMenuItem<String>(
                                    value: slot['id'].toString(),
                                    child: Text(slot['slot_name'] ?? ''),
                                  ))
                                ],
                                onChanged: (val) {
                                  setState(() {
                                    selectedSlotId = val;
                                  });
                                  applyFilter();
                                },
                              ),
                            ),
                            const SizedBox(width: 12),
                            // Start Date
                            Expanded(
                              child: InkWell(
                                onTap: () async {
                                  final picked = await showDatePicker(
                                    context: context,
                                    initialDate: filterStart ?? DateTime.now(),
                                    firstDate: DateTime(2020),
                                    lastDate: DateTime(2100),
                                  );
                                  if (picked != null) {
                                    setState(() {
                                      filterStart = picked;
                                    });
                                    applyFilter();
                                  }
                                },
                                child: InputDecorator(
                                  decoration: const InputDecoration(
                                    labelText: 'Từ ngày',
                                    border: OutlineInputBorder(),
                                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  ),
                                  child: Text(
                                    filterStart != null ? DateFormat('dd/MM/yyyy').format(filterStart!) : 'Từ ngày',
                                    style: TextStyle(color: filterStart != null ? Colors.black : Colors.grey[600]),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            // End Date
                            Expanded(
                              child: InkWell(
                                onTap: () async {
                                  final picked = await showDatePicker(
                                    context: context,
                                    initialDate: filterEnd ?? DateTime.now(),
                                    firstDate: DateTime(2020),
                                    lastDate: DateTime(2100),
                                  );
                                  if (picked != null) {
                                    setState(() {
                                      filterEnd = picked;
                                    });
                                    applyFilter();
                                  }
                                },
                                child: InputDecorator(
                                  decoration: const InputDecoration(
                                    labelText: 'Đến ngày',
                                    border: OutlineInputBorder(),
                                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  ),
                                  child: Text(
                                    filterEnd != null ? DateFormat('dd/MM/yyyy').format(filterEnd!) : 'Đến ngày',
                                    style: TextStyle(color: filterEnd != null ? Colors.black : Colors.grey[600]),
                                  ),
                                ),
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.clear),
                              tooltip: 'Xóa bộ lọc',
                              onPressed: () {
                                setState(() {
                                  selectedSlotId = null;
                                  filterStart = null;
                                  filterEnd = null;
                                });
                                applyFilter();
                              },
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // History List
                  Expanded(
                    child: ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: filteredHistory.length,
                      itemBuilder: (context, idx) {
                        final item = filteredHistory[idx];
                        final slotName =
                            item['parking_slots']?['slot_name'] ?? '---';
                        final checkIn = item['check_in_time'] ?? '';
                        final checkOut = item['check_out_time'];
                        final duration = item['duration_minutes'];
                        final status = item['status'] ?? '';
                        final isActive = status == 'active';

                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isActive
                                  ? Colors.orange[200]!
                                  : Colors.green[200]!,
                              width: 1,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.05),
                                blurRadius: 10,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: isActive
                                            ? Colors.orange[50]
                                            : Colors.green[50],
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Icon(
                                        Icons.local_parking,
                                        color: isActive
                                            ? Colors.orange[700]
                                            : Colors.green[700],
                                        size: 20,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Text(
                                        slotName,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16,
                                        ),
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 12,
                                        vertical: 6,
                                      ),
                                      decoration: BoxDecoration(
                                        color: isActive
                                            ? Colors.orange[100]
                                            : Colors.green[100],
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        isActive ? 'Đang đỗ' : 'Hoàn thành',
                                        style: TextStyle(
                                          color: isActive
                                              ? Colors.orange[800]
                                              : Colors.green[800],
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.grey[50],
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Column(
                                    children: [
                                      Row(
                                        children: [
                                          Icon(
                                            Icons.login,
                                            size: 18,
                                            color: Colors.blue[600],
                                          ),
                                          const SizedBox(width: 8),
                                          const Text(
                                            'Check-in:',
                                            style: TextStyle(
                                              fontWeight: FontWeight.w600,
                                              color: Colors.black87,
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            formatDate(checkIn),
                                            style: TextStyle(
                                              color: Colors.grey[700],
                                            ),
                                          ),
                                        ],
                                      ),
                                      if (checkOut != null) ...[
                                        const SizedBox(height: 8),
                                        Row(
                                          children: [
                                            Icon(
                                              Icons.logout,
                                              size: 18,
                                              color: Colors.red[600],
                                            ),
                                            const SizedBox(width: 8),
                                            const Text(
                                              'Check-out:',
                                              style: TextStyle(
                                                fontWeight: FontWeight.w600,
                                                color: Colors.black87,
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                            Text(
                                              formatDate(checkOut),
                                              style: TextStyle(
                                                color: Colors.grey[700],
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                      if (duration != null) ...[
                                        const SizedBox(height: 8),
                                        Row(
                                          children: [
                                            Icon(
                                              Icons.timer_outlined,
                                              size: 18,
                                              color: Colors.purple[600],
                                            ),
                                            const SizedBox(width: 8),
                                            const Text(
                                              'Thời gian:',
                                              style: TextStyle(
                                                fontWeight: FontWeight.w600,
                                                color: Colors.black87,
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                            Text(
                                              '$duration phút',
                                              style: TextStyle(
                                                color: Colors.grey[700],
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),

                  // Pagination
                  if (totalPages > 1)
                    Container(
                      margin: const EdgeInsets.only(
                        left: 16,
                        right: 16,
                        bottom: 16,
                      ),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.05),
                            blurRadius: 10,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.chevron_left),
                            onPressed: page > 1
                                ? () => fetchHistory(newPage: page - 1)
                                : null,
                            color: Colors.blue[700],
                            disabledColor: Colors.grey[300],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.blue[50],
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              'Trang $page/$totalPages',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.blue[700],
                              ),
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.chevron_right),
                            onPressed: page < totalPages
                                ? () => fetchHistory(newPage: page + 1)
                                : null,
                            color: Colors.blue[700],
                            disabledColor: Colors.grey[300],
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.2),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.3), width: 1),
      ),
      child: Column(
        children: [
          Icon(icon, color: Colors.white, size: 28),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withOpacity(0.9),
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.history_outlined,
              size: 80,
              color: Colors.grey[400],
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Chưa có lịch sử đỗ xe',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.grey[700],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Lịch sử đỗ xe của bạn sẽ hiển thị ở đây',
            style: TextStyle(fontSize: 14, color: Colors.grey[500]),
          ),
          const SizedBox(height: 32),
          ElevatedButton.icon(
            onPressed: () => fetchHistory(),
            icon: const Icon(Icons.refresh),
            label: const Text('Làm mới'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue[700],
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Colors.red[50],
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.error_outline, size: 80, color: Colors.red[400]),
          ),
          const SizedBox(height: 24),
          Text(
            'Đã có lỗi xảy ra',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.grey[700],
            ),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Text(
              errorMsg!,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: Colors.red[700]),
            ),
          ),
          const SizedBox(height: 32),
          ElevatedButton.icon(
            onPressed: () => fetchHistory(),
            icon: const Icon(Icons.refresh),
            label: const Text('Thử lại'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue[700],
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
