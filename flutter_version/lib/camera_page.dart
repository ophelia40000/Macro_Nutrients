import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'theme.dart';
import 'models.dart';
import 'database_helper.dart';

class CameraPage extends StatefulWidget {
  const CameraPage({super.key});

  @override
  State<CameraPage> createState() => _CameraPageState();
}

class _CameraPageState extends State<CameraPage> {
  List<ProgressPhoto> _photos = [];
  bool _isLoading = true;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _loadPhotos();
  }

  Future<void> _loadPhotos() async {
    final list = await DatabaseHelper.instance.getProgressPhotos();
    setState(() {
      _photos = list;
      _isLoading = false;
    });
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? file = await _picker.pickImage(source: source);
      if (file == null) return;

      if (!mounted) return;
      _showWeightDialog(file.path, isAsset: false);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to pick image: $e')),
      );
    }
  }

  void _showWeightDialog(String imagePath, {bool isAsset = false}) {
    final weightController = TextEditingController(text: '70.0');
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTokens.pureWhite,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTokens.radiusFeatureCard)),
        title: Text(
          'Body Weight at Capture',
          style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700, color: AppTokens.inkBlack),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Enter current scale reading for this progress photo:', style: AppTokens.bodyMuted),
            const SizedBox(height: 12),
            TextField(
              controller: weightController,
              keyboardType: TextInputType.number,
              decoration: AppTokens.inputDecoration(
                hintText: '70.0',
                suffixIcon: const Padding(padding: EdgeInsets.all(12), child: Text('kg')),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel', style: AppTokens.bodyMuted),
          ),
          ElevatedButton(
            onPressed: () async {
              final w = double.tryParse(weightController.text) ?? 70.0;
              final now = DateTime.now();
              final dateStr = '${now.day.toString().padLeft(2, '0')} ${_monthName(now.month)} ${now.year}';
              final newPhoto = ProgressPhoto(
                id: 'prog_${DateTime.now().millisecondsSinceEpoch}',
                imagePath: imagePath,
                date: dateStr,
                weight: w,
                isAsset: isAsset,
              );
              await DatabaseHelper.instance.addProgressPhoto(newPhoto);
              if (!ctx.mounted) return;
              Navigator.of(ctx).pop();
              _loadPhotos();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTokens.cyanSignal,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTokens.radiusInput)),
            ),
            child: Text('Save Photo', style: AppTokens.buttonText),
          ),
        ],
      ),
    );
  }

  void _showUrlPhotoDialog() {
    final urlController = TextEditingController();
    final weightController = TextEditingController(text: '70.0');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTokens.pureWhite,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTokens.radiusFeatureCard)),
        title: Text(
          'Add Progress Photo URL',
          style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700, color: AppTokens.inkBlack),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: urlController,
              decoration: AppTokens.inputDecoration(hintText: 'https://example.com/photo.jpg'),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: weightController,
              keyboardType: TextInputType.number,
              decoration: AppTokens.inputDecoration(hintText: 'Weight (kg)'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel', style: AppTokens.bodyMuted),
          ),
          ElevatedButton(
            onPressed: () async {
              final url = urlController.text.trim();
              if (url.isEmpty) return;
              final w = double.tryParse(weightController.text) ?? 70.0;
              final now = DateTime.now();
              final dateStr = '${now.day.toString().padLeft(2, '0')} ${_monthName(now.month)} ${now.year}';
              final newPhoto = ProgressPhoto(
                id: 'prog_${DateTime.now().millisecondsSinceEpoch}',
                imagePath: url,
                date: dateStr,
                weight: w,
                isAsset: false,
              );
              await DatabaseHelper.instance.addProgressPhoto(newPhoto);
              if (!ctx.mounted) return;
              Navigator.of(ctx).pop();
              _loadPhotos();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTokens.cyanSignal,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTokens.radiusInput)),
            ),
            child: Text('Add Photo', style: AppTokens.buttonText),
          ),
        ],
      ),
    );
  }

  void _showCaptureOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: AppTokens.pureWhite,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(color: AppTokens.stoneMuted, borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Take Progress Photo',
              style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700, color: AppTokens.inkBlack),
            ),
            Text('Choose a method to record your physique milestone:', style: AppTokens.bodyMuted),
            const SizedBox(height: 18),
            ListTile(
              leading: const Icon(Icons.camera_alt_outlined, color: AppTokens.cyanSignal),
              title: Text('Camera', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, color: AppTokens.inkBlack)),
              onTap: () {
                Navigator.pop(ctx);
                _pickImage(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined, color: AppTokens.cyanSignal),
              title: Text('Gallery', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, color: AppTokens.inkBlack)),
              onTap: () {
                Navigator.pop(ctx);
                _pickImage(ImageSource.gallery);
              },
            ),
            ListTile(
              leading: const Icon(Icons.link, color: AppTokens.cyanSignal),
              title: Text('Enter Image URL', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, color: AppTokens.inkBlack)),
              onTap: () {
                Navigator.pop(ctx);
                _showUrlPhotoDialog();
              },
            ),
            const SizedBox(height: 10),
          ],
        ),
      ),
    );
  }

  void _openFullscreen(ProgressPhoto photo) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(16),
        child: Container(
          decoration: BoxDecoration(
            color: AppTokens.soot,
            borderRadius: BorderRadius.circular(AppTokens.radiusFeatureCard),
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Stack(
                children: [
                  AspectRatio(
                    aspectRatio: 3 / 4,
                    child: _buildPhotoWidget(photo, fit: BoxFit.cover),
                  ),
                  Positioned(
                    top: 10,
                    right: 10,
                    child: IconButton(
                      icon: const Icon(Icons.close, color: Colors.white, size: 22),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ),
                  Positioned(
                    top: 14,
                    left: 14,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.72),
                        borderRadius: BorderRadius.circular(AppTokens.radiusPill),
                      ),
                      child: Text('${photo.weight} kg', style: AppTokens.pillText.copyWith(color: Colors.white)),
                    ),
                  ),
                  Positioned(
                    bottom: 12,
                    left: 14,
                    child: Text(
                      photo.date,
                      style: GoogleFonts.outfit(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        shadows: const [Shadow(blurRadius: 4, color: Colors.black)],
                      ),
                    ),
                  ),
                ],
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Physique milestone log', style: AppTokens.bodyMuted.copyWith(color: AppTokens.ashGray)),
                    TextButton.icon(
                      icon: const Icon(Icons.delete_outline, size: 18, color: AppTokens.surplusAlert),
                      label: Text('Delete', style: AppTokens.body.copyWith(color: AppTokens.surplusAlert, fontWeight: FontWeight.w700)),
                      onPressed: () async {
                        await DatabaseHelper.instance.deleteProgressPhoto(photo.id);
                        if (!ctx.mounted) return;
                        Navigator.of(ctx).pop();
                        _loadPhotos();
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPhotoWidget(ProgressPhoto photo, {BoxFit fit = BoxFit.cover}) {
    if (photo.isAsset || photo.imagePath.startsWith('assets/')) {
      return Image.asset(photo.imagePath, fit: fit);
    } else if (photo.imagePath.startsWith('http://') || photo.imagePath.startsWith('https://')) {
      return Image.network(
        photo.imagePath,
        fit: fit,
        errorBuilder: (context, error, stackTrace) => const Center(child: Icon(Icons.broken_image, color: Colors.white24)),
      );
    } else if (kIsWeb) {
      return Image.network(
        photo.imagePath,
        fit: fit,
        errorBuilder: (context, error, stackTrace) => const Center(child: Icon(Icons.broken_image, color: Colors.white24)),
      );
    } else {
      return Image.file(
        File(photo.imagePath),
        fit: fit,
        errorBuilder: (context, error, stackTrace) => const Center(child: Icon(Icons.broken_image, color: Colors.white24)),
      );
    }
  }

  String _monthName(int month) {
    const m = ['Okt', 'Nov', 'Des', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep'];
    return m[(month - 1).clamp(0, 11)];
  }

  @override
  Widget build(BuildContext context) {
    final latestWeight = _photos.isNotEmpty ? _photos.last.weight : 70.2;

    return Scaffold(
      backgroundColor: AppTokens.stoneCanvas,
      appBar: AppBar(
        backgroundColor: AppTokens.stoneCanvas,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: Center(
          child: GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: AppTokens.pureWhite,
                shape: BoxShape.circle,
                border: Border.all(color: AppTokens.stoneBorder),
              ),
              child: const Icon(Icons.arrow_back, color: AppTokens.inkBlack, size: 18),
            ),
          ),
        ),
        centerTitle: false,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Progress Journey',
              style: GoogleFonts.outfit(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppTokens.inkBlack,
                letterSpacing: -0.3,
              ),
            ),
            Text(
              'Visual physique timeline',
              style: GoogleFonts.outfit(
                fontSize: 13,
                color: AppTokens.warmGray,
                letterSpacing: -0.1,
              ),
            ),
          ],
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: AppTokens.stoneBorder, height: 1),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTokens.cyanSignal))
          : SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Hero Telemetry Card (PHYSIQUE TIMELINE)
                  Container(
                    decoration: BoxDecoration(
                      color: AppTokens.pureWhite,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTokens.stoneBorder),
                    ),
                    padding: const EdgeInsets.all(18),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'PHYSIQUE TIMELINE',
                              style: GoogleFonts.outfit(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.8,
                                color: AppTokens.stoneMuted,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppTokens.pureWhite,
                                borderRadius: BorderRadius.circular(AppTokens.radiusPill),
                                border: Border.all(color: AppTokens.stoneBorder),
                              ),
                              child: Text(
                                '${latestWeight.toStringAsFixed(1)} kg terkini',
                                style: GoogleFonts.outfit(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color: AppTokens.warmGray,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 18),
                        Row(
                          children: [
                            Expanded(
                              child: Column(
                                children: [
                                  Text(
                                    '${_photos.length}',
                                    style: GoogleFonts.outfit(
                                      fontSize: 26,
                                      fontWeight: FontWeight.w800,
                                      color: AppTokens.inkBlack,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Photos',
                                    style: GoogleFonts.outfit(
                                      fontSize: 12,
                                      color: AppTokens.warmGray,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Container(width: 1, height: 32, color: AppTokens.stoneBorder),
                            Expanded(
                              child: Column(
                                children: [
                                  Text(
                                    '45',
                                    style: GoogleFonts.outfit(
                                      fontSize: 26,
                                      fontWeight: FontWeight.w800,
                                      color: AppTokens.inkBlack,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Milestone Days',
                                    style: GoogleFonts.outfit(
                                      fontSize: 12,
                                      color: AppTokens.warmGray,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Container(width: 1, height: 32, color: AppTokens.stoneBorder),
                            Expanded(
                              child: Column(
                                children: [
                                  RichText(
                                    text: TextSpan(
                                      children: [
                                        TextSpan(
                                          text: '70',
                                          style: GoogleFonts.outfit(
                                            fontSize: 26,
                                            fontWeight: FontWeight.w800,
                                            color: AppTokens.cyanSignal,
                                          ),
                                        ),
                                        TextSpan(
                                          text: 'kg',
                                          style: GoogleFonts.outfit(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w700,
                                            color: AppTokens.cyanSignal,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Active Target',
                                    style: GoogleFonts.outfit(
                                      fontSize: 12,
                                      color: AppTokens.warmGray,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 22),

                  // Section Header Row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Physique Gallery',
                        style: GoogleFonts.outfit(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppTokens.inkBlack,
                          letterSpacing: -0.2,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppTokens.pureWhite,
                          borderRadius: BorderRadius.circular(AppTokens.radiusPill),
                          border: Border.all(color: AppTokens.stoneBorder),
                        ),
                        child: Text(
                          '${_photos.length} ${_photos.length == 1 ? "photo" : "photos"}',
                          style: GoogleFonts.outfit(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: AppTokens.warmGray,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Photo Cards Row (matching 1:1 camera.png)
                  if (_photos.isEmpty)
                    Container(
                      width: double.infinity,
                      margin: const EdgeInsets.only(top: 8),
                      padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 20),
                      decoration: BoxDecoration(
                        color: AppTokens.pureWhite,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppTokens.stoneBorder),
                      ),
                      child: Column(
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: AppTokens.stoneCanvas,
                              shape: BoxShape.circle,
                              border: Border.all(color: AppTokens.stoneBorder),
                            ),
                            child: const Icon(Icons.camera_alt_outlined, color: AppTokens.ashGray, size: 20),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'No progress photos yet',
                            style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700, color: AppTokens.inkBlack),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Take front, side, or back photos to calibrate your body composition changes over time.',
                            textAlign: TextAlign.center,
                            style: AppTokens.bodyMuted,
                          ),
                          const SizedBox(height: 14),
                          ElevatedButton.icon(
                            onPressed: _showCaptureOptions,
                            icon: const Icon(Icons.add, size: 14, color: AppTokens.inkBlack),
                            label: Text('Capture First Photo', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, color: AppTokens.inkBlack)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTokens.stoneCanvas,
                              elevation: 0,
                              side: const BorderSide(color: AppTokens.stoneBorder),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTokens.radiusPill)),
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    Row(
                      children: _photos.map((photo) {
                        return Expanded(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: GestureDetector(
                              onTap: () => _openFullscreen(photo),
                              child: Container(
                                height: 135,
                                clipBehavior: Clip.antiAlias,
                                decoration: BoxDecoration(
                                  color: AppTokens.soot,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: AppTokens.stoneBorder),
                                ),
                                child: Stack(
                                  fit: StackFit.expand,
                                  children: [
                                    _buildPhotoWidget(photo, fit: BoxFit.cover),
                                    // Top-left weight badge
                                    Positioned(
                                      top: 6,
                                      left: 6,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2.5),
                                        decoration: BoxDecoration(
                                          color: Colors.black.withValues(alpha: 0.72),
                                          borderRadius: BorderRadius.circular(AppTokens.radiusPill),
                                        ),
                                        child: Text(
                                          '${photo.weight.toStringAsFixed(1)} kg',
                                          style: GoogleFonts.outfit(
                                            color: Colors.white,
                                            fontSize: 10,
                                            fontWeight: FontWeight.w700,
                                            letterSpacing: -0.2,
                                          ),
                                        ),
                                      ),
                                    ),
                                    // Bottom date text
                                    Positioned(
                                      bottom: 6,
                                      left: 6,
                                      right: 6,
                                      child: Text(
                                        photo.date,
                                        style: GoogleFonts.outfit(
                                          color: Colors.white,
                                          fontSize: 10.5,
                                          fontWeight: FontWeight.w700,
                                          letterSpacing: -0.1,
                                          shadows: const [
                                            Shadow(blurRadius: 3, color: Colors.black, offset: Offset(0, 1)),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  const SizedBox(height: 80),
                ],
              ),
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCaptureOptions,
        backgroundColor: AppTokens.cyanSignal,
        elevation: 3,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTokens.radiusPill)),
        icon: const Icon(Icons.camera_alt_outlined, color: Colors.white, size: 20),
        label: Text(
          'Capture Photo',
          style: GoogleFonts.outfit(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
        ),
      ),
    );
  }
}
