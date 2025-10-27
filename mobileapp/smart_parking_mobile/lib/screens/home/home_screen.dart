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
  Map<String, dynamic>? effectiveStats;
  int currentPage = 1;
  int totalPages = 1;
  List<dynamic> slots = [];
  bool isLoading = false;

  // Removed reservation history state variables

  @override
  void initState() {
    super.initState();
    fetchSlots();
    fetchEffectiveStats();
  }

  Future<void> fetchEffectiveStats() async {
    final result = await SlotsService.getEffectiveSlotStats();
    print('[DEBUG] getEffectiveSlotStats response: $result');
    if (result['success'] == true && result['data'] is List && result['data'].isNotEmpty) {
      setState(() {
        effectiveStats = result['data'][0];
      });
    } else {
      setState(() {
        effectiveStats = null;
      });
    }
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


  List<dynamic> get pagedSlots {
    final start = (currentPage - 1) * 5;
    final end = (start + 5).clamp(0, slots.length);
    return slots.sublist(start, end);
  }

  // Đã bỏ getter pagedReservations

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
                await fetchSlots();
                await fetchEffectiveStats();
              },
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ...existing code...
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

                    // Đã bỏ lịch sử đặt chỗ và phân trang liên quan
                    const SizedBox(height: 24),

                    // Thông báo số slot còn có thể đặt (effective) - chuyển xuống trên nút Đặt chỗ
                    if (effectiveStats != null)
                      Padding(
                        padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 18),
                          decoration: BoxDecoration(
                            color: (effectiveStats!['available_effective'] ?? 0) <= 0
                                ? Colors.red[50]
                                : Colors.blue[50],
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: (effectiveStats!['available_effective'] ?? 0) <= 0
                                  ? Colors.red[200]!
                                  : Colors.blue[200]!,
                            ),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                (effectiveStats!['available_effective'] ?? 0) <= 0
                                    ? Icons.warning_amber_rounded
                                    : Icons.info_outline,
                                color: (effectiveStats!['available_effective'] ?? 0) <= 0
                                    ? Colors.red[700]
                                    : Colors.blue[700],
                                size: 26,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  (effectiveStats!['available_effective'] ?? 0) <= 0
                                      ? 'Đã hết chỗ để đặt'
                                      : 'Số chỗ còn có thể đặt: ${effectiveStats!['available_effective']}',
                                  style: TextStyle(
                                    color: (effectiveStats!['available_effective'] ?? 0) <= 0
                                        ? Colors.red[900]
                                        : Colors.blue[900],
                                    fontWeight: FontWeight.bold,
                                    fontSize: 17,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

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
                          onPressed: (effectiveStats != null && (effectiveStats!['available_effective'] ?? 0) > 0)
                              ? () {
                                  final parentContext = context;
                                  showGeneralDialog(
                                            context: parentContext,
                                    barrierDismissible: true,
                                    barrierLabel: 'Đặt chỗ',
                                    pageBuilder:
                                                (dialogContext, animation, secondaryAnimation) {
                                                  return SafeArea(
                                                    child: Scaffold(
                                                      appBar: AppBar(
                                                        title: const Text(
                                                          'Đặt chỗ theo thời gian',
                                                        ),
                                                        backgroundColor: Colors.blue[700],
                                                        leading: IconButton(
                                                          icon: const Icon(Icons.close),
                                                          onPressed: () => Navigator.of(dialogContext).pop(),
                                                        ),
                                                      ),
                                                      body: FormReservation(
                                                        token: widget.token,
                                                        user: widget.user,
                                                        role: widget.role,
                                                        onReservationSuccess: () async {
                                                          await fetchSlots();
                                                          await fetchEffectiveStats();
                                                          // show success snackbar from parentContext after refresh so user can see it
                                                          Future.delayed(const Duration(milliseconds: 300), () {
                                                            ScaffoldMessenger.of(parentContext).showSnackBar(
                                                              SnackBar(
                                                                content: const Text('Đặt chỗ thành công!'),
                                                                backgroundColor: Colors.green,
                                                                behavior: SnackBarBehavior.floating,
                                                              ),
                                                            );
                                                          });
                                                        },
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
                                }
                              : null,
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

  void _showCancelDialog(String reservationId) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          backgroundColor: Colors.white,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.warning_amber_rounded,
                  color: Colors.red[400],
                  size: 48,
                ),
                const SizedBox(height: 16),
                Text(
                  'Xác nhận hủy đặt chỗ',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 20,
                    color: Colors.red[700],
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                Text(
                  'Bạn có chắc chắn muốn hủy đặt chỗ này không? Hành động này không thể hoàn tác.',
                  style: TextStyle(fontSize: 15, color: Colors.grey[800]),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 28),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Expanded(
                      child: TextButton(
                        onPressed: () {
                          Navigator.of(context).pop();
                        },
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: Text(
                          'Không',
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey[700],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.of(context).pop();
                          _cancelReservation(reservationId);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red[600],
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          'Đồng ý',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _cancelReservation(String reservationId) async {
    // Hiển thị loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final result = await ReservationsService.cancel(reservationId);

      // Đóng dialog loading
      Navigator.of(context).pop();

      if (result['success'] == true) {
        // Hiển thị thông báo thành công
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Hủy đặt chỗ thành công'),
            backgroundColor: Colors.green,
          ),
        );

        // Refresh danh sách
        await fetchSlots();
      } else {
        // Hiển thị thông báo lỗi
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Hủy đặt chỗ thất bại'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      // Đóng dialog loading
      Navigator.of(context).pop();

      // Hiển thị thông báo lỗi
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi kết nối: $e'), backgroundColor: Colors.red),
      );
    }
  }
}
