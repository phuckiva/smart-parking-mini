import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/reservations_service.dart';
import '../../services/slots_service.dart';

class HistoryReservationsScreen extends StatefulWidget {
  final String token;
  final Map<String, dynamic> user;
  final String role;
  const HistoryReservationsScreen({
    Key? key,
    required this.token,
    required this.user,
    required this.role,
  }) : super(key: key);

  @override
  State<HistoryReservationsScreen> createState() => _HistoryReservationsScreenState();
}

class _HistoryReservationsScreenState extends State<HistoryReservationsScreen> {
  List<dynamic> reservations = [];
  List<dynamic> filteredReservations = [];
  List<dynamic> slots = [];
  bool isLoading = false;
  String? errorMsg;
  // Pagination
  int page = 1;
  int limit = 10;
  int totalPages = 1;
  // Filter state
  String? selectedSlotId;
  DateTime? filterStart;
  DateTime? filterEnd;
  String? selectedStatus;

  @override
  void initState() {
    super.initState();
    fetchData();
  }

  Future<void> fetchData({int? newPage}) async {
    setState(() {
      isLoading = true;
      errorMsg = null;
    });
    final res = await ReservationsService.listMine();
    final slotRes = await SlotsService.getAllSlots();
    if (res['success'] == true && res['data'] != null) {
      final allReservations = res['data']['reservations'] ?? [];
      setState(() {
        reservations = allReservations;
        slots = slotRes['success'] == true && slotRes['data'] != null ? slotRes['data']['slots'] ?? [] : [];
        page = newPage ?? 1;
        totalPages = (allReservations.length / limit).ceil().clamp(1, 9999);
        isLoading = false;
      });
      applyFilter();
    } else {
      setState(() {
        errorMsg = res['message'] ?? 'Lỗi khi lấy lịch sử đặt chỗ';
        isLoading = false;
      });
    }
  }

  void applyFilter() {
    List<dynamic> result = List.from(reservations);
    // Filter by slot
    if (selectedSlotId != null && selectedSlotId!.isNotEmpty) {
      result = result.where((r) => r['slot_id'].toString() == selectedSlotId).toList();
    }
    // Filter by status
    if (selectedStatus != null && selectedStatus!.isNotEmpty) {
      result = result.where((r) => r['status'] == selectedStatus).toList();
    }
    // Filter by time
    if (filterStart != null) {
      result = result.where((r) {
        final start = r['start_time'];
        if (start == null) return false;
        final dt = DateTime.tryParse(start);
        if (dt == null) return false;
        return !dt.isBefore(filterStart!);
      }).toList();
    }
    if (filterEnd != null) {
      result = result.where((r) {
        final end = r['end_time'];
        if (end == null) return false;
        final dt = DateTime.tryParse(end);
        if (dt == null) return false;
        return !dt.isAfter(filterEnd!);
      }).toList();
    }
    int newTotalPages = (result.length / limit).ceil().clamp(1, 9999);
    setState(() {
      filteredReservations = result;
      // Reset page if out of range or after filter
      if (page > newTotalPages) {
        page = 1;
      }
    });
  }

  List<dynamic> get pagedReservations {
  if (filteredReservations.isEmpty) return [];
  final start = (page - 1) * limit;
  final end = (start + limit).clamp(0, filteredReservations.length);
  if (start >= filteredReservations.length) return [];
  return filteredReservations.sublist(start, end);
  }

  int get activeCount => filteredReservations.where((r) => r['status'] == 'active').length;
  int get cancelledCount => filteredReservations.where((r) => r['status'] == 'cancelled').length;
  int get completedCount => filteredReservations.where((r) => r['status'] == 'completed').length;

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('dd/MM/yyyy HH:mm').format(date);
    } catch (_) {
      return dateStr;
    }
  }

  String _getSlotName(int slotId) {
    final slot = slots.firstWhere(
      (s) => s['id'] == slotId,
      orElse: () => null,
    );
    return slot != null ? slot['slot_name'] ?? '' : '---';
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'active':
        return Colors.blue[100]!;
      case 'cancelled':
        return Colors.red[100]!;
      case 'completed':
        return Colors.green[100]!;
      default:
        return Colors.grey[200]!;
    }
  }

  Color _statusTextColor(String status) {
    switch (status) {
      case 'active':
        return Colors.blue[700]!;
      case 'cancelled':
        return Colors.red[700]!;
      case 'completed':
        return Colors.green[700]!;
      default:
        return Colors.grey[700]!;
    }
  }

  String _statusText(String status) {
    switch (status) {
      case 'active':
        return 'Đang hoạt động';
      case 'cancelled':
        return 'Đã hủy';
      case 'completed':
        return 'Hoàn thành';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        elevation: 0,
        title: const Text(
          'Lịch sử đặt chỗ',
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
              ? Center(child: Text(errorMsg!))
              : reservations.isEmpty
                  ? Center(child: Text('Chưa có lịch sử đặt chỗ'))
                  : RefreshIndicator(
                      onRefresh: () => fetchData(),
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
                                      label: 'Đang hoạt động',
                                      value: '$activeCount',
                                      color: Colors.blue,
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
                                      icon: Icons.cancel,
                                      label: 'Đã hủy',
                                      value: '$cancelledCount',
                                      color: Colors.red,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),

                          // Filter Section
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
                                    const SizedBox(width: 12),
                                    // Status Dropdown
                                    Expanded(
                                      child: DropdownButtonFormField<String>(
                                        value: selectedStatus,
                                        isExpanded: true,
                                        decoration: const InputDecoration(
                                          labelText: 'Trạng thái',
                                          border: OutlineInputBorder(),
                                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                        ),
                                        items: const [
                                          DropdownMenuItem<String>(value: null, child: Text('Tất cả trạng thái')),
                                          DropdownMenuItem<String>(value: 'active', child: Text('Đang hoạt động')),
                                          DropdownMenuItem<String>(value: 'completed', child: Text('Hoàn thành')),
                                          DropdownMenuItem<String>(value: 'cancelled', child: Text('Đã hủy')),
                                        ],
                                        onChanged: (val) {
                                          setState(() {
                                            selectedStatus = val;
                                          });
                                          applyFilter();
                                        },
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
                                          selectedStatus = null;
                                        });
                                        applyFilter();
                                      },
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),

                          // Reservation List
                          Expanded(
                            child: ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: pagedReservations.length,
                              itemBuilder: (context, idx) {
                                final item = pagedReservations[idx];
                                final slotName = _getSlotName(item['slot_id']);
                                final startTime = item['start_time'] ?? '';
                                final endTime = item['end_time'] ?? '';
                                final status = item['status'] ?? '';
                                final isCancelled = status == 'cancelled';
                                final isActive = status == 'active';

                                return Container(
                                  margin: const EdgeInsets.only(bottom: 16),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                      color: isCancelled
                                          ? Colors.red[200]!
                                          : Colors.blue[200]!,
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
                                                color: isCancelled
                                                    ? Colors.red[50]
                                                    : Colors.blue[50],
                                                borderRadius: BorderRadius.circular(10),
                                              ),
                                              child: Icon(
                                                Icons.local_parking,
                                                color: isCancelled
                                                    ? Colors.red[700]
                                                    : Colors.blue[700],
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
                                                color: _statusColor(status),
                                                borderRadius: BorderRadius.circular(12),
                                              ),
                                              child: Text(
                                                _statusText(status),
                                                style: TextStyle(
                                                  color: _statusTextColor(status),
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
                                                    'Từ:',
                                                    style: TextStyle(
                                                      fontWeight: FontWeight.w600,
                                                      color: Colors.black87,
                                                    ),
                                                  ),
                                                  const SizedBox(width: 8),
                                                  Text(
                                                    _formatDate(startTime),
                                                    style: TextStyle(
                                                      color: Colors.grey[700],
                                                    ),
                                                  ),
                                                ],
                                              ),
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
                                                    'Đến:',
                                                    style: TextStyle(
                                                      fontWeight: FontWeight.w600,
                                                      color: Colors.black87,
                                                    ),
                                                  ),
                                                  const SizedBox(width: 8),
                                                  Text(
                                                    _formatDate(endTime),
                                                    style: TextStyle(
                                                      color: Colors.grey[700],
                                                    ),
                                                  ),
                                                ],
                                              ),
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
                                        ? () => setState(() { page -= 1; })
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
                                        ? () => setState(() { page += 1; })
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
}
