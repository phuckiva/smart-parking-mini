import 'package:flutter/material.dart';
import '../../services/slots_service.dart';
import '../../services/reservations_service.dart';
import 'package:intl/intl.dart';

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
    return _FormReservationBody(token: token, user: user, role: role);
  }
}

class _FormReservationBody extends StatefulWidget {
  final String token;
  final Map<String, dynamic> user;
  final String role;
  const _FormReservationBody({
    required this.token,
    required this.user,
    required this.role,
  });

  @override
  State<_FormReservationBody> createState() => _FormReservationBodyState();
}

class _FormReservationBodyState extends State<_FormReservationBody> {
  int? selectedSlotId;
  bool isBooking = false;
  DateTime? startDateTime;
  DateTime? endDateTime;
  bool isLoading = false;
  List<dynamic> slots = [];
  int currentPage = 1;
  int totalPages = 1;
  String? error;

  Future<void> pickDateTime({required bool isStart}) async {
    final now = DateTime.now();
    final pickedDate = await showDatePicker(
      context: context,
      initialDate: now,
      firstDate: now,
      lastDate: now.add(const Duration(days: 365)),
    );
    if (pickedDate == null) return;
    // Custom hour picker: chỉ cho chọn giờ, phút luôn là 00
    int? pickedHour = await showDialog<int>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Chọn giờ (phút mặc định 00)'),
          content: Container(
            width: double.maxFinite,
            constraints: BoxConstraints(maxHeight: 320),
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: 24,
              itemBuilder: (context, i) {
                return ListTile(
                  title: Text('${i.toString().padLeft(2, '0')}:00'),
                  onTap: () => Navigator.of(context).pop(i),
                );
              },
            ),
          ),
        );
      },
    );
    if (pickedHour == null) return;
    final dt = DateTime(
      pickedDate.year,
      pickedDate.month,
      pickedDate.day,
      pickedHour,
      0, // phút mặc định 00
    );
    setState(() {
      if (isStart) {
        startDateTime = dt;
      } else {
        endDateTime = dt;
      }
    });
  }

  Future<void> fetchAvailableSlots() async {
    if (startDateTime == null || endDateTime == null) return;
    if (startDateTime!.isAfter(endDateTime!)) {
      setState(() {
        error = 'Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc';
      });
      return;
    }
    setState(() {
      isLoading = true;
      error = null;
    });
    final startStr = startDateTime!.toIso8601String();
    final endStr = endDateTime!.toIso8601String();
    // final url =
    //     'http://localhost:8888/api/slots/available-by-time?start_time=$startStr&end_time=$endStr';
    // print('[DEBUG] API URL: $url');
    // print('[DEBUG] start_time: $startStr');
    // print('[DEBUG] end_time: $endStr');
    final res = await SlotsService.getAvailableSlotsByTimeRange(
      startTime: startStr,
      endTime: endStr,
    );
    if (res['success'] == true && res['data'] is List) {
      final allSlots = res['data'] as List;
      setState(() {
        slots = allSlots;
        totalPages = (slots.length / 5).ceil();
        currentPage = 1;
        isLoading = false;
      });
    } else {
      setState(() {
        error = res['message'] ?? 'Lỗi khi lấy slot';
        isLoading = false;
      });
    }
  }

  List<dynamic> get pagedSlots {
    final start = (currentPage - 1) * 5;
    final end = (start + 5).clamp(0, slots.length);
    return slots.sublist(start, end);
  }

  void selectSlot(int slotId) {
    setState(() {
      selectedSlotId = slotId;
    });
  }

  Future<void> bookSlot() async {
    if (selectedSlotId == null || startDateTime == null || endDateTime == null)
      return;
    final now = DateTime.now();
    if (startDateTime!.isBefore(now.add(const Duration(hours: 1)))) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text(
            'Thời gian bắt đầu phải lớn hơn hiện tại ít nhất 1 giờ!',
          ),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }
    if (endDateTime!.isBefore(startDateTime!.add(const Duration(hours: 1)))) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text(
            'Thời gian kết thúc phải lớn hơn thời gian bắt đầu ít nhất 1 giờ!',
          ),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }
    setState(() {
      isBooking = true;
    });
    final res = await ReservationsService.create(
      slotId: selectedSlotId.toString(),
      startTime: startDateTime!,
      endTime: endDateTime!,
    );
    setState(() {
      isBooking = false;
    });
    if (res['success'] == true) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Đặt chỗ thành công!'),
          backgroundColor: Colors.green,
        ),
      );
      Navigator.of(context).pop();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? 'Đặt chỗ thất bại!'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final isStartValid =
        startDateTime != null &&
        startDateTime!.isAfter(now.add(const Duration(hours: 1)));
    final isEndValid =
        endDateTime != null &&
        endDateTime!.isAfter(
          startDateTime != null
              ? startDateTime!.add(const Duration(hours: 1))
              : now,
        );
    final canSelectSlot = isStartValid && isEndValid;
    final isTimeInvalid =
        startDateTime != null &&
        endDateTime != null &&
        (!isStartValid || !isEndValid);
    return SingleChildScrollView(
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
                'Đặt chỗ theo thời gian',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: InkWell(
                  onTap: () => pickDateTime(isStart: true),
                  child: InputDecorator(
                    decoration: const InputDecoration(
                      labelText: 'Thời gian bắt đầu',
                      border: OutlineInputBorder(),
                    ),
                    child: Text(
                      startDateTime != null
                          ? DateFormat(
                              'dd/MM/yyyy HH:mm',
                            ).format(startDateTime!)
                          : 'Chọn thời gian bắt đầu',
                      style: const TextStyle(fontSize: 15),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: InkWell(
                  onTap: () => pickDateTime(isStart: false),
                  child: InputDecorator(
                    decoration: const InputDecoration(
                      labelText: 'Thời gian kết thúc',
                      border: OutlineInputBorder(),
                    ),
                    child: Text(
                      endDateTime != null
                          ? DateFormat('dd/MM/yyyy HH:mm').format(endDateTime!)
                          : 'Chọn thời gian kết thúc',
                      style: const TextStyle(fontSize: 15),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (isTimeInvalid)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Text(
                'Thời gian không hợp lệ',
                style: TextStyle(
                  color: Colors.red,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              icon: const Icon(Icons.search),
              label: const Text('Tìm slot trống'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue[600],
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              onPressed:
                  (startDateTime != null && endDateTime != null && !isLoading)
                  ? fetchAvailableSlots
                  : null,
            ),
          ),
          if (error != null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Text(error!, style: const TextStyle(color: Colors.red)),
            ),
          if (isLoading)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(32),
                child: CircularProgressIndicator(),
              ),
            ),
          if (!isLoading && slots.isNotEmpty)
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 16),
                const Text(
                  'Danh sách slot trống:',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(height: 8),
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: pagedSlots.length,
                  itemBuilder: (context, index) {
                    final slot = pagedSlots[index];
                    final slotId = slot['id'] as int?;
                    final isSelected = selectedSlotId == slotId;
                    return Opacity(
                      opacity: canSelectSlot ? 1.0 : 0.5,
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: isSelected ? Colors.blue[50] : Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: isSelected
                              ? Border.all(color: Colors.blue, width: 2)
                              : null,
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
                            onTap: canSelectSlot && slotId != null
                                ? () => selectSlot(slotId)
                                : null,
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: Colors.green[50],
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Icon(
                                      Icons.local_parking,
                                      color: Colors.green[700],
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
                                                color: Colors.green,
                                                shape: BoxShape.circle,
                                              ),
                                            ),
                                            const SizedBox(width: 6),
                                            const Text(
                                              'Còn trống',
                                              style: TextStyle(
                                                color: Colors.green,
                                                fontWeight: FontWeight.w600,
                                                fontSize: 13,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                  isSelected
                                      ? Icon(
                                          Icons.check_circle,
                                          color: Colors.blue,
                                          size: 22,
                                        )
                                      : Icon(
                                          Icons.radio_button_unchecked,
                                          color: Colors.grey[400],
                                          size: 22,
                                        ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed:
                        (selectedSlotId != null && !isBooking && canSelectSlot)
                        ? bookSlot
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
                    child: isBooking
                        ? const SizedBox(
                            height: 22,
                            width: 22,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text('Đặt chỗ', style: TextStyle(fontSize: 18)),
                  ),
                ),
                if (totalPages > 1)
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
              ],
            ),
        ],
      ),
    );
  }
}
