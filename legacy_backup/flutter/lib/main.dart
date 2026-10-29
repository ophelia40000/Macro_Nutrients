import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'nutrition_page.dart';
import 'profile_page.dart';
import 'models.dart';
import 'database_helper.dart';
import 'notification_service.dart';
import 'camera_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize notification service and schedule daily 10 PM reminder
  final notificationService = NotificationService();
  await notificationService.initialize();
  await notificationService.scheduleDailyReminder();

  // Add a small delay to make the branding splash screen visible
  await Future.delayed(const Duration(seconds: 1));

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Nutrition Tracker',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF2ECC71),
          brightness: Brightness.dark,
        ),
        scaffoldBackgroundColor: const Color(0xFF0F0F0F),
        useMaterial3: true,
        fontFamily: 'Roboto',
      ),
      home: const MyHomePage(),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key});

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  double _calories = 2000;
  double _carbs = 250;
  double _protein = 150;
  double _fat = 70;
  double _consumedCalories = 0;
  double _consumedProtein = 0;
  double _consumedCarbs = 0;
  double _consumedFat = 0;
  double _burnedCalories = 0;
  bool _isCameraMode = false;
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
        _isCameraMode = true;
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
        MaterialPageRoute(builder: (context) => const CameraPage()),
      );
    }
    setState(() {
      _isCameraMode = false;
      _isReadyToPortal = false;
    });
  }

  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    await _checkDailyReset();
    await _loadGoals();
  }

  Future<void> _checkDailyReset() async {
    final prefs = await SharedPreferences.getInstance();
    final String lastResetDate = prefs.getString('last_reset_date') ?? '';
    final String today = DateTime.now().toIso8601String().split('T')[0];

    if (lastResetDate != today && lastResetDate.isNotEmpty) {
      // Archive yesterday's data before resetting
      final double yestCal = prefs.getDouble('consumed_calories') ?? 0;
      final double yestProt = prefs.getDouble('consumed_protein') ?? 0;
      final double yestCarb = prefs.getDouble('consumed_carbs') ?? 0;
      final double yestFat = prefs.getDouble('consumed_fat') ?? 0;
      final double yestBurned = prefs.getDouble('burned_calories') ?? 0;

      if (yestCal > 0 ||
          yestProt > 0 ||
          yestCarb > 0 ||
          yestFat > 0 ||
          yestBurned > 0) {
        final summary = DailySummary(
          date: lastResetDate,
          calories: yestCal,
          protein: yestProt,
          carbs: yestCarb,
          fat: yestFat,
          burnedCalories: yestBurned,
        );
        await DatabaseHelper.instance.upsertSummary(summary);
      }

      // Reset counters in SharedPreferences (will be superseded by SQLite entries query later)
      await prefs.setDouble('consumed_calories', 0);
      await prefs.setDouble('consumed_protein', 0);
      await prefs.setDouble('consumed_carbs', 0);
      await prefs.setDouble('consumed_fat', 0);
      await prefs.setDouble('burned_calories', 0);

      // Clear today's food entries in SQLite
      await DatabaseHelper.instance.clearEntries();
    }

    if (lastResetDate != today) {
      await prefs.setString('last_reset_date', today);
    }
  }

  Future<void> _loadGoals() async {
    final prefs = await SharedPreferences.getInstance();
    final String today = DateTime.now().toIso8601String().split('T')[0];
    final entries = await DatabaseHelper.instance.getEntriesByDate(today);

    double totalCal = 0, totalProt = 0, totalCarb = 0, totalFat = 0;
    for (var entry in entries) {
      totalCal += entry.calories;
      totalProt += entry.protein;
      totalCarb += entry.carbs;
      totalFat += entry.fat;
    }

    setState(() {
      _calories = prefs.getDouble('calories') ?? 2000;
      _carbs = prefs.getDouble('carbs') ?? 250;
      _protein = prefs.getDouble('protein') ?? 150;
      _fat = prefs.getDouble('fat') ?? 70;
      _consumedCalories = totalCal;
      _consumedProtein = totalProt;
      _consumedCarbs = totalCarb;
      _consumedFat = totalFat;
      _burnedCalories = prefs.getDouble('burned_calories') ?? 0;
    });

    // Sync back to SharedPreferences for other potential uses
    await prefs.setDouble('consumed_calories', _consumedCalories);
    await prefs.setDouble('consumed_protein', _consumedProtein);
    await prefs.setDouble('consumed_carbs', _consumedCarbs);
    await prefs.setDouble('consumed_fat', _consumedFat);
  }

  Future<void> _saveGoals() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setDouble('calories', _calories);
    await prefs.setDouble('carbs', _carbs);
    await prefs.setDouble('protein', _protein);
    await prefs.setDouble('fat', _fat);
  }

  void _showEditDialog() {
    if (_tapConsumedByPortal) {
      _tapConsumedByPortal = false;
      return;
    }
    final calController = TextEditingController(
      text: _calories.toStringAsFixed(0),
    );
    final carbController = TextEditingController(
      text: _carbs.toStringAsFixed(0),
    );
    final proteinController = TextEditingController(
      text: _protein.toStringAsFixed(0),
    );
    final fatController = TextEditingController(text: _fat.toStringAsFixed(0));

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: const BoxDecoration(
          color: Color(0xFF1A1A1A),
          borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
        ),
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom + 20,
          left: 25,
          right: 25,
          top: 25,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Update Your Goals',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Color(0xFFBBF246),
              ),
            ),
            const SizedBox(height: 5),
            Text(
              'Set your daily targets to stay on track.',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.5),
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 25),
            _buildTextField(
              calController,
              'Calories (kcal)',
              Icons.local_fire_department,
              const Color(0xFF2ECC71),
            ),
            Row(
              children: [
                Expanded(
                  child: _buildTextField(
                    carbController,
                    'Carbs (g)',
                    Icons.bakery_dining,
                    const Color(0xFF2ECC71),
                  ),
                ),
                const SizedBox(width: 15),
                Expanded(
                  child: _buildTextField(
                    proteinController,
                    'Protein (g)',
                    Icons.kebab_dining,
                    const Color(0xFF2ECC71),
                  ),
                ),
              ],
            ),
            _buildTextField(
              fatController,
              'Fat (g)',
              Icons.opacity,
              const Color(0xFF2ECC71),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              height: 60,
              child: ElevatedButton(
                onPressed: () {
                  setState(() {
                    _calories =
                        double.tryParse(calController.text) ?? _calories;
                    _carbs = double.tryParse(carbController.text) ?? _carbs;
                    _protein =
                        double.tryParse(proteinController.text) ?? _protein;
                    _fat = double.tryParse(fatController.text) ?? _fat;
                  });
                  _saveGoals();
                  Navigator.pop(context);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFBBF246),
                  foregroundColor: Colors.black,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18),
                  ),
                ),
                child: const Text(
                  'Save Changes',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showBurnDialog() {
    final burnController = TextEditingController(
      text: _burnedCalories > 0 ? _burnedCalories.toStringAsFixed(0) : '',
    );
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: const BoxDecoration(
          color: Color(0xFF1A1A1A),
          borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
        ),
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom + 20,
          left: 25,
          right: 25,
          top: 25,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Log Exercise',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Color(0xFFBBF246),
              ),
            ),
            const SizedBox(height: 5),
            Text(
              'Enter total calories burned today.',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.5),
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 25),
            _buildTextField(
              burnController,
              'Calories Burned (kcal)',
              Icons.directions_run,
              const Color(0xFF2ECC71),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              height: 60,
              child: ElevatedButton(
                onPressed: () async {
                  final double burned =
                      double.tryParse(burnController.text) ?? 0;
                  final prefs = await SharedPreferences.getInstance();
                  setState(() {
                    _burnedCalories = burned;
                  });
                  await prefs.setDouble('burned_calories', _burnedCalories);
                  if (!mounted) return;
                  Navigator.of(context).pop();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFBBF246),
                  foregroundColor: Colors.black,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18),
                  ),
                ),
                child: const Text(
                  'Log Activity',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField(
    TextEditingController controller,
    String label,
    IconData icon,
    Color color,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 15),
      child: TextField(
        controller: controller,
        keyboardType: TextInputType.number,
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: Icon(icon, color: color),
          filled: true,
          fillColor: const Color(0xFF252525),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(15),
            borderSide: BorderSide.none,
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(15),
            borderSide: BorderSide(
              color: color.withValues(alpha: 0.5),
              width: 2,
            ),
          ),
        ),
      ),
    );
  }

  void _navigateToDiary() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => NutritionPage(
          calGoal: _calories,
          protGoal: _protein,
          carbGoal: _carbs,
          fatGoal: _fat,
          burnedCalories: _burnedCalories,
        ),
      ),
    ).then((_) => _loadGoals());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F0F),
      appBar: AppBar(
        toolbarHeight: 65,
        title: const Text(
          'Macro Nutrients',
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
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 15),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(15),
            ),
            child: IconButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const ProfilePage()),
                ).then((_) => _loadGoals());
              },
              icon: const Icon(
                Icons.account_circle_rounded,
                size: 28,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 25),
            _NutrientCard(
              title: 'Calories Remaining',
              value: _calories - _consumedCalories + _burnedCalories,
              goal: _calories,
              consumed: _consumedCalories,
              burned: _burnedCalories,
              unit: 'kcal',
              icon: Icons.local_fire_department,
              gradient: [const Color(0xFF2E7D32), const Color(0xFF1B5E20)],
              isFullWidth: true,
              onTap: () => _navigateToDiary(),
            ),
            const SizedBox(height: 15),
            Row(
              children: [
                Expanded(
                  child: _NutrientCard(
                    title: 'Carbs',
                    value: _carbs - _consumedCarbs,
                    goal: _carbs,
                    consumed: _consumedCarbs,
                    unit: 'g',
                    icon: Icons.bakery_dining,
                    gradient: [
                      const Color(0xFF263238),
                      const Color(0xFF101010),
                    ],
                    onTap: () => _navigateToDiary(),
                  ),
                ),
                const SizedBox(width: 15),
                Expanded(
                  child: _NutrientCard(
                    title: 'Protein',
                    value: _protein - _consumedProtein,
                    goal: _protein,
                    consumed: _consumedProtein,
                    unit: 'g',
                    icon: Icons.kebab_dining,
                    gradient: [
                      const Color(0xFF1B5E20),
                      const Color(0xFF0F2E14),
                    ],
                    onTap: () => _navigateToDiary(),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 15),
            _NutrientCard(
              title: 'Healthy Fats',
              value: _fat - _consumedFat,
              goal: _fat,
              consumed: _consumedFat,
              unit: 'g',
              icon: Icons.opacity,
              gradient: [const Color(0xFF37474F), const Color(0xFF1A1A1A)],
              isFullWidth: true,
              onTap: () => _navigateToDiary(),
            ),
            const SizedBox(height: 15),
            _NutrientCard(
              title: 'Exercise Burned',
              value: _burnedCalories,
              goal: 500,
              consumed: _burnedCalories,
              unit: 'kcal',
              icon: Icons.directions_run,
              gradient: [const Color(0xFFBBF246), const Color(0xFF8DB636)],
              isFullWidth: true,
              onTap: _showBurnDialog,
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
      floatingActionButton: GestureDetector(
        onTapDown: (_) => _startPortalTimer(),
        onTapUp: (_) => _handlePortalRelease(),
        onTapCancel: () => _handlePortalRelease(),
        onTap: _showEditDialog,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeInOutCubic,
          width: _isCameraMode ? 60 : 165,
          height: 60,
          alignment: Alignment.center, // Explicitly center content
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(
            color: _isCameraMode
                ? const Color(0xFF2ECC71)
                : const Color(0xFFBBF246),
            borderRadius: BorderRadius.circular(_isCameraMode ? 30 : 20),
            boxShadow: [
              BoxShadow(
                color:
                    (_isCameraMode
                            ? const Color(0xFF2ECC71)
                            : const Color(0xFFBBF246))
                        .withValues(alpha: 0.3),
                blurRadius: 15,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 300),
            child: _isCameraMode
                ? const Icon(
                    Icons.camera_alt_rounded,
                    key: ValueKey('camera'),
                    color: Colors.black,
                    size: 28,
                  )
                : OverflowBox(
                    key: const ValueKey('normal'),
                    minWidth: 0,
                    maxWidth: 165,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(Icons.tune_rounded, color: Colors.black),
                        SizedBox(width: 8),
                        Text(
                          'Adjust Goals',
                          maxLines: 1,
                          style: TextStyle(
                            color: Colors.black,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
          ),
        ),
      ),
    );
  }
}

class _NutrientCard extends StatelessWidget {
  final String title;
  final double value;
  final double goal;
  final double consumed;
  final double burned;
  final String unit;
  final IconData icon;
  final List<Color> gradient;
  final bool isFullWidth;
  final VoidCallback? onTap;

  const _NutrientCard({
    required this.title,
    required this.value,
    required this.goal,
    required this.consumed,
    this.burned = 0,
    required this.unit,
    required this.icon,
    required this.gradient,
    this.isFullWidth = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    bool isSurplus = value < 0 && title != 'Calories Burned';
    double displayValue = value.abs();

    double progress = title == 'Calories Burned'
        ? (value / 500).clamp(0.0, 1.0)
        : (consumed / goal).clamp(0.0, 1.0);

    // Use a warning red gradient if it's a calorie surplus
    final List<Color> effectiveGradient =
        isSurplus && title == 'Calories Remaining'
        ? [Colors.red.shade700, Colors.deepOrange.shade900]
        : gradient;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.fromLTRB(16, 24, 24, 24),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: effectiveGradient,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(28),
          boxShadow: [
            BoxShadow(
              color: effectiveGradient.last.withValues(alpha: 0.35),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: Colors.white, size: 20),
                ),
                Expanded(
                  child: Text(
                    isSurplus ? '$title (Surplus)' : title,
                    textAlign: TextAlign.end,
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.9),
                      fontSize: isSurplus ? 12 : 14,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 25),
            Row(
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: [
                Text(
                  displayValue.toStringAsFixed(0),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 38,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -1,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  unit,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.8),
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: LinearProgressIndicator(
                value: progress,
                backgroundColor: Colors.white.withValues(alpha: 0.12),
                valueColor: AlwaysStoppedAnimation<Color>(
                  isSurplus
                      ? Colors.white
                      : Colors.white.withValues(alpha: 0.9),
                ),
                minHeight: 8,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
