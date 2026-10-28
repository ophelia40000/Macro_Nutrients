import 'dart:io';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:gal/gal.dart';
import 'main.dart'; // To navigate back to MyHomePage
import 'models.dart';
import 'database_helper.dart';

class CameraPage extends StatefulWidget {
  const CameraPage({super.key});

  @override
  State<CameraPage> createState() => _CameraPageState();
}

class _CameraPageState extends State<CameraPage> {
  bool _isMorphingBack = false;
  final ImagePicker _picker = ImagePicker();
  List<ProgressPhoto> _allPhotos = [];
  Map<String, List<ProgressPhoto>> _groupedPhotos = {};
  bool _isReadyToPortal = false;
  bool _tapConsumedByPortal = false;
  Timer? _portalTimer;

  void _startPortalTimer() {
    _portalTimer?.cancel();
    _isReadyToPortal = false;
    _tapConsumedByPortal = false;
    _portalTimer = Timer(const Duration(milliseconds: 300), () {
      HapticFeedback.heavyImpact();
      setState(() {
        _isMorphingBack = true;
        _isReadyToPortal = true;
        _tapConsumedByPortal = true;
      });
    });
  }

  void _handlePortalRelease() {
    _portalTimer?.cancel();
    if (_isReadyToPortal) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const MyHomePage()),
      );
    }
    setState(() {
      _isMorphingBack = false;
      _isReadyToPortal = false;
    });
  }

  @override
  void initState() {
    super.initState();
    _loadPhotos();
  }

  Future<void> _loadPhotos() async {
    final photos = await DatabaseHelper.instance.getAllProgressPhotos();
    setState(() {
      _allPhotos = photos;
      _groupPhotos();
    });
  }

  void _groupPhotos() {
    final Map<String, List<ProgressPhoto>> groups = {};
    for (var photo in _allPhotos) {
      // Format date for grouping (e.g., "Apr 21")
      final date = DateTime.parse(photo.date);
      final monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      final key = '${monthNames[date.month - 1]} ${date.day.toString().padLeft(2, '0')}';
      
      if (!groups.containsKey(key)) {
        groups[key] = [];
      }
      groups[key]!.add(photo);
    }
    setState(() {
      _groupedPhotos = groups;
    });
  }

  Future<void> _takePhoto() async {
    if (_tapConsumedByPortal) {
      _tapConsumedByPortal = false;
      return;
    }
    try {
      final XFile? photo = await _picker.pickImage(
        source: ImageSource.camera,
        maxWidth: 1080,
        maxHeight: 1920,
        imageQuality: 85,
      );
      
      if (photo != null) {
        // 1. Get current weight from Profile
        final prefs = await SharedPreferences.getInstance();
        final double weight = prefs.getDouble('user_weight') ?? 0;

        // 2. Save file permanently
        final directory = await getApplicationDocumentsDirectory();
        final String fileName = 'progress_${DateTime.now().millisecondsSinceEpoch}.jpg';
        final String savedPath = p.join(directory.path, fileName);
        
        await File(photo.path).copy(savedPath);

        // Save to Public Gallery for permanence (Anti-Uninstall)
        try {
          final hasAccess = await Gal.hasAccess();
          if (!hasAccess) {
            await Gal.requestAccess();
          }
          await Gal.putImage(savedPath, album: 'Macro Journey');
        } catch (e) {
          debugPrint('Failed to save to public gallery: $e');
        }

        // 3. Save to Database
        final newEntry = ProgressPhoto(
          imagePath: savedPath,
          date: DateTime.now().toIso8601String(),
          weight: weight,
        );
        
        await DatabaseHelper.instance.insertProgressPhoto(newEntry);
        
        // 4. Refresh UI
        _loadPhotos();
      }
    } catch (e) {
      debugPrint('Error taking photo: $e');
    }
  }

  // Real data grouped by date logic is handled inside _groupPhotos()


  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F0F),
      appBar: AppBar(
        toolbarHeight: 65,
        automaticallyImplyLeading: false,
        title: const Text(
          'Progress Journey',
          style: TextStyle(
            fontWeight: FontWeight.w900,
            letterSpacing: -0.5,
            color: Colors.white,
            fontSize: 24,
          ),
        ),
        centerTitle: false,
        backgroundColor: Colors.transparent,
        elevation: 0,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(bottom: Radius.circular(32)),
        ),
        flexibleSpace: Container(
          decoration: BoxDecoration(
            borderRadius: const BorderRadius.vertical(
              bottom: Radius.circular(32),
            ),
            gradient: const LinearGradient(
              colors: [Color(0xFF1A1A1A), Color(0xFF0F0F0F)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            border: Border(
              bottom: BorderSide(
                color: const Color(0xFF2ECC71).withValues(alpha: 0.1),
                width: 1,
              ),
            ),
          ),
        ),
      ),
      body: _groupedPhotos.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.photo_library_outlined,
                    size: 64,
                    color: Colors.white.withValues(alpha: 0.1),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No progress photos yet.\nTap the camera to start!',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.3),
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.only(top: 20, bottom: 100),
              itemCount: _groupedPhotos.keys.length,
              itemBuilder: (context, index) {
                final date = _groupedPhotos.keys.elementAt(index);
                final photos = _groupedPhotos[date]!;
                return _buildDateGroup(date, photos);
              },
            ),
      floatingActionButton: GestureDetector(
        onTapDown: (_) => _startPortalTimer(),
        onTapUp: (_) => _handlePortalRelease(),
        onTapCancel: () => _handlePortalRelease(),
        onTap: _takePhoto,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeInOutCubic,
          width: _isMorphingBack ? 165 : 60,
          height: 60,
          alignment: Alignment.center,
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(
            color: _isMorphingBack
                ? const Color(0xFFBBF246)
                : const Color(0xFF2ECC71),
            borderRadius: BorderRadius.circular(_isMorphingBack ? 20 : 30),
            boxShadow: [
              BoxShadow(
                color:
                    (_isMorphingBack
                            ? const Color(0xFFBBF246)
                            : const Color(0xFF2ECC71))
                        .withValues(alpha: 0.3),
                blurRadius: 15,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 300),
            child: _isMorphingBack
                ? OverflowBox(
                    key: const ValueKey('normal'),
                    minWidth: 0,
                    maxWidth: 165,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(Icons.home_rounded, color: Colors.black),
                        SizedBox(width: 8),
                        Text(
                          'Go Home',
                          maxLines: 1,
                          style: TextStyle(
                            color: Colors.black,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  )
                : const Icon(
                    Icons.camera_alt_rounded,
                    key: ValueKey('camera'),
                    color: Colors.black,
                    size: 28,
                  ),
          ),
        ),
      ),
    );
  }

  Widget _buildDateGroup(String date, List<ProgressPhoto> photos) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildDateHeader(date, '${photos.first.weight} kg'),
        const SizedBox(height: 5),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1,
          ),
          itemCount: photos.length,
          itemBuilder: (context, index) {
            return _buildPhotoCard(photos[index]);
          },
        ),
        const SizedBox(height: 25),
      ],
    );
  }

  Widget _buildDateHeader(String date, String weight) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 25, vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: const Color(0xFFBBF246).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(
              Icons.calendar_today_rounded,
              size: 14,
              color: Color(0xFFBBF246),
            ),
          ),
          const SizedBox(width: 12),
          Text(
            date.toUpperCase(),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
            ),
          ),
          const Spacer(),
          Text(
            weight,
            style: const TextStyle(
              color: Color(0xFFBBF246),
              fontSize: 14,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(width: 8),
          Icon(
            Icons.auto_awesome,
            size: 14,
            color: Colors.white.withValues(alpha: 0.2),
          ),
        ],
      ),
    );
  }

  Widget _buildPhotoCard(ProgressPhoto photo) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A1A),
        borderRadius: BorderRadius.circular(25),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.05),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.4),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(25),
        child: Stack(
          fit: StackFit.expand,
          children: [
            Hero(
              tag: photo.id.toString(),
              child: Image.file(
                File(photo.imagePath),
                fit: BoxFit.cover,
              ),
            ),
            Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () {
                  final index = _allPhotos.indexOf(photo);
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => FullScreenImagePage(
                        allPhotos: _allPhotos,
                        initialIndex: index,
                      ),
                    ),
                  );
                },
                onLongPress: () async {
            // Option to delete photo
            final confirmed = await showDialog<bool>(
              context: context,
              builder: (context) => AlertDialog(
                backgroundColor: const Color(0xFF1A1A1A),
                title: const Text('Delete Photo?', style: TextStyle(color: Colors.white)),
                content: const Text('This action cannot be undone.', style: TextStyle(color: Colors.white70)),
                actions: [
                  TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
                  TextButton(
                    onPressed: () => Navigator.pop(context, true),
                    child: const Text('Delete', style: TextStyle(color: Colors.red)),
                  ),
                ],
              ),
            );

            if (confirmed == true && photo.id != null) {
              await DatabaseHelper.instance.deleteProgressPhoto(photo.id!);
              try {
                final file = File(photo.imagePath);
                if (await file.exists()) await file.delete();
              } catch (e) {
                debugPrint('Error deleting file: $e');
              }
              _loadPhotos();
            }
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class FullScreenImagePage extends StatefulWidget {
  final List<ProgressPhoto> allPhotos;
  final int initialIndex;

  const FullScreenImagePage({
    super.key,
    required this.allPhotos,
    required this.initialIndex,
  });

  @override
  State<FullScreenImagePage> createState() => _FullScreenImagePageState();
}

class _FullScreenImagePageState extends State<FullScreenImagePage> {
  late PageController _pageController;
  late int _currentIndex;
  String _fileSize = '... MB';

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: widget.initialIndex);
    _calculateFileSize();
  }

  Future<void> _calculateFileSize() async {
    try {
      final file = File(widget.allPhotos[_currentIndex].imagePath);
      final bytes = await file.length();
      setState(() {
        _fileSize = '${(bytes / (1024 * 1024)).toStringAsFixed(2)} MB';
      });
    } catch (e) {
      setState(() {
        _fileSize = '0.00 MB';
      });
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          PageView.builder(
            controller: _pageController,
            itemCount: widget.allPhotos.length,
            onPageChanged: (index) {
              setState(() {
                _currentIndex = index;
                _fileSize = '... MB';
              });
              _calculateFileSize();
            },
            itemBuilder: (context, index) {
              final photo = widget.allPhotos[index];
              return Center(
                child: InteractiveViewer(
                  minScale: 0.5,
                  maxScale: 3.0,
                  child: HeroMode(
                    enabled: index == _currentIndex,
                    child: Hero(
                      tag: photo.id.toString(),
                      child: Image.file(
                        File(photo.imagePath),
                        fit: BoxFit.contain,
                        width: double.infinity,
                        height: double.infinity,
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
          Positioned(
            top: 50,
            left: 20,
            child: CircleAvatar(
              backgroundColor: Colors.black.withValues(alpha: 0.5),
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white),
                onPressed: () => Navigator.pop(context),
              ),
            ),
          ),
          Positioned(
            bottom: 20,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 10),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.bottomCenter,
                    end: Alignment.topCenter,
                    colors: [
                      Colors.black.withValues(alpha: 0.9),
                      Colors.black.withValues(alpha: 0.5),
                      Colors.transparent,
                    ],
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      widget.allPhotos[_currentIndex].date.split('T')[0],
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.fitness_center_rounded,
                            color: Color(0xFFBBF246), size: 16),
                        const SizedBox(width: 8),
                        Text(
                          '${widget.allPhotos[_currentIndex].weight} kg',
                          style: const TextStyle(
                            color: Color(0xFFBBF246),
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        const Spacer(),
                        Text(
                          '${_currentIndex + 1} / ${widget.allPhotos.length}',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.3),
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 15),
                    Row(
                      children: [
                        _buildInfoChip(
                          icon: Icons.access_time_rounded,
                          label: _formatTime(widget.allPhotos[_currentIndex].date),
                        ),
                        const SizedBox(width: 10),
                        _buildInfoChip(
                          icon: Icons.sd_storage_rounded,
                          label: _fileSize,
                        ),
                        const SizedBox(width: 10),
                        _buildInfoChip(
                          icon: Icons.photo_size_select_actual_rounded,
                          label: '1080p',
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoChip({required IconData icon, required String label}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.white.withValues(alpha: 0.03)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: Colors.white54),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 11,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  String _formatTime(String isoDate) {
    try {
      final date = DateTime.parse(isoDate);
      return '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return '--:--';
    }
  }
}
