import 'package:flutter/material.dart';
import '../../services/slots_service.dart';
import '../../services/reservations_service.dart';
import 'package:intl/intl.dart';
import 'form_reservation.dart';

class HomeScreen extends StatefulWidget {
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
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int currentPage = 1;
  int totalPages = 1;
  int currentReservationPage = 1;
  int totalReservationPages = 1;
  List<dynamic> slots = [];
  bool isLoading = false;

  List<dynamic> reservations = [];
  bool isLoadingReservations = false;
  String? errorReservations;

  @override
  void initState() {
    super.initState();
    fetchSlots();
    fetchReservations();
  }

  Future<void> fetchSlots() async {
    setState(() => isLoading = true);
    final result = await SlotsService.getAllSlots();
    if (result['success'] == true) {
      final allSlots = result['data']['slots'] as List<dynamic>;
      setState(() {
        slots = allSlots;
        totalPages = (slots.length / 5).ceil();
        currentPage = 1;
        isLoading = false;
      });
    } else {
      setState(() => isLoading = false);
    }
  }

  Future<void> fetchReservations() async {
    setState(() {
      isLoadingReservations = true;
      errorReservations = null;
    });
    final res = await ReservationsService.listMine();
    if (res['success'] == true && res['data'] != null) {
      final allReservations = res['data']['reservations'] ?? [];
      setState(() {
        reservations = allReservations;
        totalReservationPages = (reservations.length / 5).ceil();
        currentReservationPage = 1;
        isLoadingReservations = false;
      });
    } else {
      setState(() {
        errorReservations = res['message'] ?? 'Lỗi khi lấy lịch sử đặt chỗ';
        isLoadingReservations = false;
      });
    }
  }

  List<dynamic> get pagedSlots {
    final start = (currentPage - 1) * 5;
    final end = (start + 5).clamp(0, slots.length);
    return slots.sublist(start, end);
  }

  List<dynamic> get pagedReservations {
    final start = (currentReservationPage - 1) * 5;
    final end = (start + 5).clamp(0, reservations.length);
    return reservations.sublist(start, end);
  }

  int get availableCount =>
      slots.where((s) => s['status'] == 'available').length;
  int get occupiedCount => slots.where((s) => s['status'] == 'occupied').length;
  int get reservedCount => slots.where((s) => s['status'] == 'reserved').length;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        elevation: 0,
        title: const Text(
          'Quản lý chỗ đỗ xe',
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
          : RefreshIndicator(
              onRefresh: () async {
                await Future.wait([fetchSlots(), fetchReservations()]);
              },
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header Statistics
                    Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Colors.blue[700]!, Colors.blue[500]!],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 20, 16, 28),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Xin chào, ${widget.user['full_name'] ?? 'User'}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildStatCard(
                                    icon: Icons.check_circle_outline,
                                    label: 'Trống',
                                    value: '$availableCount',
                                    color: Colors.green,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _buildStatCard(
                                    icon: Icons.cancel_outlined,
                                    label: 'Đã đỗ',
                                    value: '$occupiedCount',
                                    color: Colors.red,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _buildStatCard(
                                    icon: Icons.bookmark,
                                    label: 'Giữ chỗ',
                                    value: '$reservedCount',
                                    color: Colors.orange,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _buildStatCard(
                                    icon: Icons.local_parking,
                                    label: 'Tổng số',
                                    value: '${slots.length}',
                                    color: Colors.blue[300]!,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),

                    // Danh sách chỗ đỗ
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Icon(
                            Icons.grid_view,
                            color: Colors.blue[700],
                            size: 22,
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'Danh sách chỗ đỗ',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),

                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: pagedSlots.length,
                      itemBuilder: (context, index) {
                        final slot = pagedSlots[index];
                        final status = slot['status'] ?? '';
                        final isAvailable = status == 'available';
                        final isOccupied = status == 'occupied';
                        final isReserved = status == 'reserved';
                        Color bgColor;
                        Color iconColor;
                        Color dotColor;
                        String statusText;
                        if (isAvailable) {
                          bgColor = Colors.green[50]!;
                          iconColor = Colors.green[700]!;
                          dotColor = Colors.green;
                          statusText = 'Còn trống';
                        } else if (isOccupied) {
                          bgColor = Colors.red[50]!;
                          iconColor = Colors.red[700]!;
                          dotColor = Colors.red;
                          statusText = 'Đã có xe';
                        } else if (isReserved) {
                          bgColor = Colors.orange[50]!;
                          iconColor = Colors.orange[700]!;
                          dotColor = Colors.orange;
                          statusText = 'Đã được giữ chỗ';
                        } else {
                          bgColor = Colors.grey[50]!;
                          iconColor = Colors.grey[700]!;
                          dotColor = Colors.grey;
                          statusText = status;
                        }
                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.05),
                                blurRadius: 10,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Material(
                            color: Colors.transparent,
                            child: InkWell(
                              borderRadius: BorderRadius.circular(16),
                              onTap: () {},
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: bgColor,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Icon(
                                        Icons.local_parking,
                                        color: iconColor,
                                        size: 28,
                                      ),
                                    ),
                                    const SizedBox(width: 16),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            slot['slot_name'] ?? '',
                                            style: const TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 16,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Row(
                                            children: [
                                              Container(
                                                width: 8,
                                                height: 8,
                                                decoration: BoxDecoration(
                                                  color: dotColor,
                                                  shape: BoxShape.circle,
                                                ),
                                              ),
                                              const SizedBox(width: 6),
                                              Text(
                                                statusText,
                                                style: TextStyle(
                                                  color: iconColor,
                                                  fontWeight: FontWeight.w600,
                                                  fontSize: 13,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                    Icon(
                                      Icons.arrow_forward_ios,
                                      size: 16,
                                      color: Colors.grey[400],
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        );
                      },
                    ),

                    // Pagination
                    if (totalPages > 1)
                      Container(
                        margin: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 16,
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
                              onPressed: currentPage > 1
                                  ? () {
                                      setState(() {
                                        currentPage--;
                                      });
                                    }
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
                                'Trang $currentPage/$totalPages',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.blue[700],
                                ),
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.chevron_right),
                              onPressed: currentPage < totalPages
                                  ? () {
                                      setState(() {
                                        currentPage++;
                                      });
                                    }
                                  : null,
                              color: Colors.blue[700],
                              disabledColor: Colors.grey[300],
                            ),
                          ],
                        ),
                      ),

                    const SizedBox(height: 8),

                    // Lịch sử đặt chỗ
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Icon(
                            Icons.history,
                            color: Colors.blue[700],
                            size: 22,
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'Lịch sử đặt chỗ',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),

                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: isLoadingReservations
                          ? const Center(
                              child: Padding(
                                padding: EdgeInsets.all(32),
                                child: CircularProgressIndicator(),
                              ),
                            )
                          : errorReservations != null
                          ? Center(
                              child: Padding(
                                padding: const EdgeInsets.all(32),
                                child: Text(
                                  errorReservations!,
                                  style: const TextStyle(color: Colors.red),
                                ),
                              ),
                            )
                          : reservations.isEmpty
                          ? Center(
                              child: Padding(
                                padding: const EdgeInsets.all(32),
                                child: Column(
                                  children: [
                                    Icon(
                                      Icons.inbox_outlined,
                                      size: 64,
                                      color: Colors.grey[300],
                                    ),
                                    const SizedBox(height: 16),
                                    Text(
                                      'Chưa có lịch sử đặt chỗ',
                                      style: TextStyle(
                                        color: Colors.grey[600],
                                        fontSize: 16,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            )
                          : Column(
                              children: [
                                ListView.builder(
                                  shrinkWrap: true,
                                  physics: const NeverScrollableScrollPhysics(),
                                  itemCount: pagedReservations.length,
                                  itemBuilder: (context, idx) {
                                    final item = pagedReservations[idx];
                                    final slotName =
                                        item['parking_slots']?['slot_name'] ??
                                        '---';
                                    final startTime = item['start_time'] ?? '';
                                    final endTime = item['end_time'] ?? '';
                                    final status = item['status'] ?? '';
                                    final isActive = status == 'active';
                                    final isCancelled = status == 'cancelled';
                                    final isCompleted = status == 'completed';
                                    Color borderColor;
                                    Color bgColor;
                                    Color textColor;
                                    String statusText;
                                    if (isActive) {
                                      borderColor = Colors.green[300]!;
                                      bgColor = Colors.green[50]!;
                                      textColor = Colors.green[800]!;
                                      statusText = 'Đang đặt';
                                    } else if (isCancelled) {
                                      borderColor = Colors.red[300]!;
                                      bgColor = Colors.red[50]!;
                                      textColor = Colors.red[800]!;
                                      statusText = 'Đã hủy';
                                    } else if (isCompleted) {
                                      borderColor = Colors.blue[300]!;
                                      bgColor = Colors.blue[50]!;
                                      textColor = Colors.blue[800]!;
                                      statusText = 'Hoàn thành';
                                    } else {
                                      borderColor = Colors.grey[300]!;
                                      bgColor = Colors.grey[50]!;
                                      textColor = Colors.grey[800]!;
                                      statusText = status;
                                    }
                                    return Container(
                                      margin: const EdgeInsets.only(bottom: 12),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(16),
                                        border: Border.all(
                                          color: borderColor,
                                          width: 1,
                                        ),
                                        boxShadow: [
                                          BoxShadow(
                                            color: Colors.black.withOpacity(
                                              0.05,
                                            ),
                                            blurRadius: 10,
                                            offset: const Offset(0, 2),
                                          ),
                                        ],
                                      ),
                                      child: Padding(
                                        padding: const EdgeInsets.all(16),
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              children: [
                                                Container(
                                                  padding: const EdgeInsets.all(
                                                    8,
                                                  ),
                                                  decoration: BoxDecoration(
                                                    color: bgColor,
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                          10,
                                                        ),
                                                  ),
                                                  child: Icon(
                                                    Icons.local_parking,
                                                    color: textColor,
                                                    size: 20,
                                                  ),
                                                ),
                                                const SizedBox(width: 12),
                                                Expanded(
                                                  child: Text(
                                                    slotName,
                                                    style: const TextStyle(
                                                      fontWeight:
                                                          FontWeight.bold,
                                                      fontSize: 16,
                                                    ),
                                                  ),
                                                ),
                                                Container(
                                                  padding:
                                                      const EdgeInsets.symmetric(
                                                        horizontal: 12,
                                                        vertical: 6,
                                                      ),
                                                  decoration: BoxDecoration(
                                                    color: bgColor,
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                          12,
                                                        ),
                                                  ),
                                                  child: Text(
                                                    statusText,
                                                    style: TextStyle(
                                                      color: textColor,
                                                      fontWeight:
                                                          FontWeight.bold,
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
                                                borderRadius:
                                                    BorderRadius.circular(10),
                                              ),
                                              child: Column(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.start,
                                                children: [
                                                  Row(
                                                    children: [
                                                      Icon(
                                                        Icons.login,
                                                        size: 16,
                                                        color: Colors.blue[400],
                                                      ),
                                                      const SizedBox(width: 4),
                                                      Text(
                                                        'Từ: ${_formatDate(startTime)}',
                                                        style: const TextStyle(
                                                          fontSize: 12,
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                  const SizedBox(height: 2),
                                                  Row(
                                                    children: [
                                                      Icon(
                                                        Icons.logout,
                                                        size: 16,
                                                        color: Colors.red[400],
                                                      ),
                                                      const SizedBox(width: 4),
                                                      Text(
                                                        'Đến: ${_formatDate(endTime)}',
                                                        style: const TextStyle(
                                                          fontSize: 12,
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
                                if (totalReservationPages > 1)
                                  Container(
                                    margin: const EdgeInsets.symmetric(
                                      horizontal: 0,
                                      vertical: 16,
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
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        IconButton(
                                          icon: const Icon(Icons.chevron_left),
                                          onPressed: currentReservationPage > 1
                                              ? () {
                                                  setState(() {
                                                    currentReservationPage--;
                                                  });
                                                }
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
                                            borderRadius: BorderRadius.circular(
                                              8,
                                            ),
                                          ),
                                          child: Text(
                                            'Trang $currentReservationPage/$totalReservationPages',
                                            style: TextStyle(
                                              fontWeight: FontWeight.bold,
                                              color: Colors.blue[700],
                                            ),
                                          ),
                                        ),
                                        IconButton(
                                          icon: const Icon(Icons.chevron_right),
                                          onPressed:
                                              currentReservationPage <
                                                  totalReservationPages
                                              ? () {
                                                  setState(() {
                                                    currentReservationPage++;
                                                  });
                                                }
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

                    const SizedBox(height: 24),

                    // Nút Đặt chỗ
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 12,
                      ),
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.blue.withOpacity(0.3),
                              blurRadius: 12,
                              offset: const Offset(0, 6),
                            ),
                          ],
                        ),
                        child: ElevatedButton(
                          onPressed: () {
                            showGeneralDialog(
                              context: context,
                              barrierDismissible: true,
                              barrierLabel: 'Đặt chỗ',
                              pageBuilder:
                                  (context, animation, secondaryAnimation) {
                                    return SafeArea(
                                      child: Scaffold(
                                        appBar: AppBar(
                                          title: const Text(
                                            'Đặt chỗ theo thời gian',
                                          ),
                                          backgroundColor: Colors.blue[700],
                                          leading: IconButton(
                                            icon: const Icon(Icons.close),
                                            onPressed: () =>
                                                Navigator.of(context).pop(),
                                          ),
                                        ),
                                        body: FormReservation(
                                          token: widget.token,
                                          user: widget.user,
                                          role: widget.role,
                                        ),
                                      ),
                                    );
                                  },
                              transitionBuilder:
                                  (
                                    context,
                                    animation,
                                    secondaryAnimation,
                                    child,
                                  ) {
                                    return SlideTransition(
                                      position: Tween<Offset>(
                                        begin: const Offset(0, 1),
                                        end: Offset.zero,
                                      ).animate(animation),
                                      child: child,
                                    );
                                  },
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.blue[600],
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
                              const Icon(Icons.add_box_outlined, size: 22),
                              const SizedBox(width: 8),
                              const Text(
                                'Đặt chỗ',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
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

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('dd/MM/yyyy HH:mm').format(date);
    } catch (_) {
      return dateStr;
    }
  }
}
