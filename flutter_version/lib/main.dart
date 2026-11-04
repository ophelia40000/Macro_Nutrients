import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'theme.dart';
import 'models.dart';
import 'database_helper.dart';
import 'nutrition_page.dart';
import 'exercise_page.dart';
import 'camera_page.dart';
import 'profile_page.dart';
import 'notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final notificationService = NotificationService();
  await notificationService.initialize();
  await notificationService.scheduleDailyReminder();

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Macro Journey',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        scaffoldBackgroundColor: AppTokens.stoneCanvas,
        fontFamily: GoogleFonts.outfit().fontFamily,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppTokens.cyanSignal,
          surface: AppTokens.stoneCanvas,
          brightness: Brightness.light,
        ),
        useMaterial3: true,
      ),
      home: const DashboardPage(),
    );
  }
}

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  UserGoals _goals = UserGoals();
  List<FoodEntry> _entries = [];
  double _burnedCalories = 0;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    await _checkDailyReset();
    await _loadData();
  }

  Future<void> _checkDailyReset() async {
    final prefs = await SharedPreferences.getInstance();
    final String lastResetDate = prefs.getString('last_reset_date') ?? '';
    final String today = DateTime.now().toIso8601String().split('T')[0];

    if (lastResetDate != today && lastResetDate.isNotEmpty) {
      final entries = await DatabaseHelper.instance.getTodayEntries();
      double cal = 0, prot = 0, carb = 0, fat = 0;
      for (var e in entries) {
        cal += e.calories;
        prot += e.protein;
        carb += e.carbs;
        fat += e.fat;
      }
      final double burned = prefs.getDouble('burned_calories') ?? 0;

      if (cal > 0 || prot > 0 || carb > 0 || fat > 0 || burned > 0) {
        final summary = DailySummary(
          date: lastResetDate,
          calories: cal,
          protein: prot,
          carbs: carb,
          fat: fat,
          burnedCalories: burned,
        );
        await DatabaseHelper.instance.upsertSummary(summary);
      }

      await prefs.setDouble('burned_calories', 0);
      await DatabaseHelper.instance.clearEntries();
    }

    if (lastResetDate != today) {
      await prefs.setString('last_reset_date', today);
    }
  }

  Future<void> _loadData() async {
    final goals = await DatabaseHelper.instance.getGoals();
    final entries = await DatabaseHelper.instance.getTodayEntries();
    final prefs = await SharedPreferences.getInstance();
    final burned = prefs.getDouble('burned_calories') ?? 0;

    setState(() {
      _goals = goals;
      _entries = entries;
      _burnedCalories = burned;
      _isLoading = false;
    });
  }

  void _showAdjustGoalsDialog() {
    final calCtrl = TextEditingController(text: _goals.calories.toStringAsFixed(0));
    final carbCtrl = TextEditingController(text: _goals.carbs.toStringAsFixed(0));
    final protCtrl = TextEditingController(text: _goals.protein.toStringAsFixed(0));
    final fatCtrl = TextEditingController(text: _goals.fat.toStringAsFixed(0));

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: AppTokens.pureWhite,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: EdgeInsets.only(
          top: 20,
          left: 20,
          right: 20,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
        ),
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
            Text('Adjust Daily Goals', style: AppTokens.sectionTitle),
            Text('Set target macronutrients and daily energy threshold', style: AppTokens.sectionSubtitle),
            const SizedBox(height: 16),
            TextField(
              controller: calCtrl,
              keyboardType: TextInputType.number,
              decoration: AppTokens.inputDecoration(
                hintText: 'Calories (kcal)',
                prefixIcon: const Icon(Icons.local_fire_department, color: AppTokens.ashGray, size: 18),
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: carbCtrl,
                    keyboardType: TextInputType.number,
                    decoration: AppTokens.inputDecoration(
                      hintText: 'Carbs (g)',
                      prefixIcon: const Icon(Icons.bakery_dining, color: AppTokens.ashGray, size: 18),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: protCtrl,
                    keyboardType: TextInputType.number,
                    decoration: AppTokens.inputDecoration(
                      hintText: 'Protein (g)',
                      prefixIcon: const Icon(Icons.lunch_dining, color: AppTokens.ashGray, size: 18),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            TextField(
              controller: fatCtrl,
              keyboardType: TextInputType.number,
              decoration: AppTokens.inputDecoration(
                hintText: 'Fat (g)',
                prefixIcon: const Icon(Icons.water_drop, color: AppTokens.ashGray, size: 18),
              ),
            ),
            const SizedBox(height: 18),
            SizedBox(
              width: double.infinity,
              height: 46,
              child: ElevatedButton(
                onPressed: () async {
                  final updated = UserGoals(
                    calories: double.tryParse(calCtrl.text) ?? _goals.calories,
                    carbs: double.tryParse(carbCtrl.text) ?? _goals.carbs,
                    protein: double.tryParse(protCtrl.text) ?? _goals.protein,
                    fat: double.tryParse(fatCtrl.text) ?? _goals.fat,
                    weight: _goals.weight,
                    height: _goals.height,
                    gender: _goals.gender,
                    neck: _goals.neck,
                    waist: _goals.waist,
                    hip: _goals.hip,
                  );
                  await DatabaseHelper.instance.saveGoals(updated);
                  if (!ctx.mounted) return;
                  Navigator.of(ctx).pop();
                  _loadData();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTokens.cyanSignal,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTokens.radiusInput)),
                ),
                child: Text('Save Goals', style: AppTokens.buttonText),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showBurnDialog() {
    final burnCtrl = TextEditingController(text: _burnedCalories > 0 ? _burnedCalories.toStringAsFixed(0) : '');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: AppTokens.pureWhite,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: EdgeInsets.only(
          top: 20,
          left: 20,
          right: 20,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
        ),
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
            Text('Active Expenditure', style: AppTokens.sectionTitle),
            Text('Log calories burned from cardio or training', style: AppTokens.sectionSubtitle),
            const SizedBox(height: 16),
            TextField(
              controller: burnCtrl,
              keyboardType: TextInputType.number,
              decoration: AppTokens.inputDecoration(
                hintText: 'Calories Burned (kcal)',
                prefixIcon: const Icon(Icons.directions_run, color: AppTokens.ashGray, size: 18),
                suffixIcon: const Padding(padding: EdgeInsets.all(12), child: Text('kcal')),
              ),
            ),
            const SizedBox(height: 18),
            SizedBox(
              width: double.infinity,
              height: 46,
              child: ElevatedButton(
                onPressed: () async {
                  final b = double.tryParse(burnCtrl.text) ?? 0;
                  final prefs = await SharedPreferences.getInstance();
                  await prefs.setDouble('burned_calories', b);
                  if (!ctx.mounted) return;
                  Navigator.of(ctx).pop();
                  _loadData();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTokens.cyanSignal,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTokens.radiusInput)),
                ),
                child: Text('Credit to Budget', style: AppTokens.buttonText),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _navigateToDiary() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => NutritionPage(
          calGoal: _goals.calories,
          protGoal: _goals.protein,
          carbGoal: _goals.carbs,
          fatGoal: _goals.fat,
          burnedCalories: _burnedCalories,
        ),
      ),
    ).then((_) => _loadData());
  }

  void _navigateToProfile() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const ProfilePage()),
    ).then((_) => _loadData());
  }

  void _navigateToExercise() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const ExercisePage()),
    ).then((_) => _loadData());
  }

  void _navigateToCamera() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const CameraPage()),
    ).then((_) => _loadData());
  }

  void _showQuickNavSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: AppTokens.pureWhite,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
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
            Text('Quick Navigation', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700, color: AppTokens.inkBlack)),
            const SizedBox(height: 12),
            ListTile(
              leading: const Icon(Icons.camera_alt_outlined, color: AppTokens.cyanSignal),
              title: Text('Physique Timeline (Camera)', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, color: AppTokens.inkBlack)),
              subtitle: Text('Visual progress photos', style: AppTokens.bodyMuted),
              onTap: () {
                Navigator.pop(ctx);
                _navigateToCamera();
              },
            ),
            ListTile(
              leading: const Icon(Icons.fitness_center_outlined, color: AppTokens.cyanSignal),
              title: Text('Exercise Tracker', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, color: AppTokens.inkBlack)),
              subtitle: Text('Routines & progressive overload', style: AppTokens.bodyMuted),
              onTap: () {
                Navigator.pop(ctx);
                _navigateToExercise();
              },
            ),
            ListTile(
              leading: const Icon(Icons.restaurant_outlined, color: AppTokens.cyanSignal),
              title: Text('Nutrition Diary', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, color: AppTokens.inkBlack)),
              subtitle: Text('Calorie and macro log', style: AppTokens.bodyMuted),
              onTap: () {
                Navigator.pop(ctx);
                _navigateToDiary();
              },
            ),
            ListTile(
              leading: const Icon(Icons.person_outline, color: AppTokens.cyanSignal),
              title: Text('Biometric Profile', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, color: AppTokens.inkBlack)),
              subtitle: Text('Body metrics & composition', style: AppTokens.bodyMuted),
              onTap: () {
                Navigator.pop(ctx);
                _navigateToProfile();
              },
            ),
            const SizedBox(height: 10),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: AppTokens.stoneCanvas,
        body: Center(child: CircularProgressIndicator(color: AppTokens.cyanSignal)),
      );
    }

    double consumedCal = 0, consumedProt = 0, consumedCarb = 0, consumedFat = 0;
    for (final e in _entries) {
      consumedCal += e.calories;
      consumedProt += e.protein;
      consumedCarb += e.carbs;
      consumedFat += e.fat;
    }

    final totalBudget = _goals.calories + _burnedCalories;
    final remainingCal = totalBudget - consumedCal;
    final isSurplus = remainingCal < 0;

    final calProg = totalBudget > 0 ? (consumedCal / totalBudget).clamp(0.0, 1.0) : 0.0;
    final carbProg = _goals.carbs > 0 ? (consumedCarb / _goals.carbs).clamp(0.0, 1.0) : 0.0;
    final protProg = _goals.protein > 0 ? (consumedProt / _goals.protein).clamp(0.0, 1.0) : 0.0;
    final fatProg = _goals.fat > 0 ? (consumedFat / _goals.fat).clamp(0.0, 1.0) : 0.0;

    final proteinKcal = (consumedProt * 4).round();
    final carbsKcal = (consumedCarb * 4).round();
    final fatKcal = (consumedFat * 9).round();
    final totalMacroKcal = proteinKcal + carbsKcal + fatKcal;

    final double proteinShare = totalMacroKcal > 0 ? (proteinKcal / totalMacroKcal) * 100 : 28.0;
    final double carbsShare = totalMacroKcal > 0 ? (carbsKcal / totalMacroKcal) * 100 : 41.0;
    final double fatShare = totalMacroKcal > 0 ? (100 - proteinShare - carbsShare).clamp(0.0, 100.0) : 31.0;

    return Scaffold(
      backgroundColor: AppTokens.stoneCanvas,
      appBar: AppBar(
        backgroundColor: AppTokens.stoneCanvas,
        elevation: 0,
        toolbarHeight: 68,
        centerTitle: false,
        title: Row(
          children: [
            // Exact ECG Activity Pulse box from screenshot - tap navigates to Exercise Tracker
            GestureDetector(
              onTap: _navigateToExercise,
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppTokens.pureWhite,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTokens.stoneBorder, width: 1),
                ),
                child: const Icon(Icons.show_chart_rounded, color: AppTokens.cyanSignal, size: 22),
              ),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Macro Journey',
                  style: GoogleFonts.outfit(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: AppTokens.inkBlack,
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(height: 2),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 1.5),
                  decoration: BoxDecoration(
                    color: AppTokens.pureWhite,
                    borderRadius: BorderRadius.circular(AppTokens.radiusPill),
                    border: Border.all(color: AppTokens.stoneBorder, width: 1),
                  ),
                  child: Text(
                    'Today · 29 Oct',
                    style: GoogleFonts.outfit(color: AppTokens.warmGray, fontSize: 11, fontWeight: FontWeight.w500),
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: GestureDetector(
              onTap: _navigateToProfile,
              onLongPress: _showQuickNavSheet,
              child: Container(
                width: 40,
                height: 40,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: AppTokens.pureWhite,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppTokens.stoneBorder, width: 1),
                ),
                child: Text(
                  'R',
                  style: GoogleFonts.outfit(color: AppTokens.cyanSignal, fontWeight: FontWeight.w700, fontSize: 16),
                ),
              ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Column(
          children: [
            // 1. HERO CALORIE CARD (Energy Budget)
            GestureDetector(
              onTap: _navigateToDiary,
              child: Container(
                decoration: AppTokens.cardDecoration(radius: AppTokens.radiusFeatureCard),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Energy Budget',
                              style: GoogleFonts.outfit(
                                fontSize: 17,
                                fontWeight: FontWeight.w700,
                                color: AppTokens.inkBlack,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: const Color(0x1F3BA6F1),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                isSurplus ? 'surplus detected' : 'simple & actionable',
                                style: GoogleFonts.outfit(
                                  color: AppTokens.cyanEdge,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: const Color(0x1F3BA6F1),
                            borderRadius: BorderRadius.circular(AppTokens.radiusPill),
                            border: Border.all(color: AppTokens.cyanEdge, width: 1),
                          ),
                          child: Text(
                            isSurplus
                                ? '+${remainingCal.abs().toStringAsFixed(0)} kcal surplus'
                                : '${remainingCal.toStringAsFixed(0)} kcal deficit',
                            style: GoogleFonts.outfit(
                              color: AppTokens.cyanEdge,
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Text(
                          remainingCal.abs().toStringAsFixed(0),
                          style: GoogleFonts.outfit(
                            fontSize: 48,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -1,
                            color: AppTokens.inkBlack,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'kcal',
                          style: GoogleFonts.outfit(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            color: AppTokens.warmGray,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    // Hairline progress bar
                    ClipRRect(
                      borderRadius: BorderRadius.circular(2),
                      child: LinearProgressIndicator(
                        value: calProg,
                        minHeight: 3.5,
                        backgroundColor: AppTokens.stoneBorder,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          isSurplus ? AppTokens.surplusAlert : AppTokens.cyanSignal,
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),
                    // Formula Dock
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 14),
                      decoration: BoxDecoration(
                        color: AppTokens.stoneCanvas,
                        borderRadius: BorderRadius.circular(AppTokens.radiusCard),
                        border: Border.all(color: AppTokens.stoneBorder),
                      ),
                      child: Row(
                        children: [
                          Expanded(child: _buildFormulaCol('target', _goals.calories.toStringAsFixed(0), AppTokens.inkBlack)),
                          Container(width: 1, height: 26, color: AppTokens.stoneBorder),
                          Expanded(child: _buildFormulaCol('consumed', consumedCal.toStringAsFixed(0), AppTokens.inkBlack)),
                          Container(width: 1, height: 26, color: AppTokens.stoneBorder),
                          Expanded(child: _buildFormulaCol('workout', '+${_burnedCalories.toStringAsFixed(0)}', AppTokens.cyanEdge)),
                          Container(width: 1, height: 26, color: AppTokens.stoneBorder),
                          Expanded(child: _buildFormulaCol('budget', totalBudget.toStringAsFixed(0), AppTokens.inkBlack)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 14),

            // 2. MACRONUTRIENTS CARD
            GestureDetector(
              onTap: _navigateToDiary,
              child: Container(
                decoration: AppTokens.cardDecoration(radius: AppTokens.radiusFeatureCard),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Macronutrients',
                              style: GoogleFonts.outfit(
                                fontSize: 17,
                                fontWeight: FontWeight.w700,
                                color: AppTokens.inkBlack,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              totalMacroKcal > 0 ? '$totalMacroKcal kcal logged' : '2199 kcal logged',
                              style: AppTokens.sectionSubtitle.copyWith(fontSize: 13),
                            ),
                          ],
                        ),
                        Text(
                          'tap to log',
                          style: GoogleFonts.outfit(
                            color: AppTokens.cyanEdge,
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Segmented Ratio Bar
                    ClipRRect(
                      borderRadius: BorderRadius.circular(3),
                      child: SizedBox(
                        height: 5,
                        child: Row(
                          children: [
                            Expanded(flex: (proteinShare * 10).toInt().clamp(1, 1000), child: Container(color: AppTokens.cyanSignal)),
                            Expanded(flex: (carbsShare * 10).toInt().clamp(1, 1000), child: Container(color: AppTokens.warmGray)),
                            Expanded(flex: (fatShare * 10).toInt().clamp(1, 1000), child: Container(color: AppTokens.stoneMuted)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    // Legend
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildLegendItem('Protein ${proteinShare.toStringAsFixed(0)}%', AppTokens.cyanSignal),
                        _buildLegendItem('Carbs ${carbsShare.toStringAsFixed(0)}%', AppTokens.warmGray),
                        _buildLegendItem('Fats ${fatShare.toStringAsFixed(0)}%', AppTokens.stoneMuted),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Protein Row
                    _buildMacroRow(
                      name: 'Protein',
                      icon: Icons.lunch_dining,
                      iconColor: AppTokens.cyanEdge,
                      consumed: consumedProt,
                      target: _goals.protein,
                      kcal: proteinKcal,
                      progress: protProg,
                      progressColor: AppTokens.cyanSignal,
                    ),
                    const Divider(height: 28, color: AppTokens.stoneBorder),

                    // Carbs Row
                    _buildMacroRow(
                      name: 'Carbohydrates',
                      icon: Icons.bakery_dining,
                      iconColor: AppTokens.warmGray,
                      consumed: consumedCarb,
                      target: _goals.carbs,
                      kcal: carbsKcal,
                      progress: carbProg,
                      progressColor: AppTokens.warmGray,
                    ),
                    const Divider(height: 28, color: AppTokens.stoneBorder),

                    // Fats Row
                    _buildMacroRow(
                      name: 'Healthy Fats',
                      icon: Icons.water_drop,
                      iconColor: AppTokens.ashGray,
                      consumed: consumedFat,
                      target: _goals.fat,
                      kcal: fatKcal,
                      progress: fatProg,
                      progressColor: AppTokens.stoneMuted,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 14),

            // 3. ACTIVE EXPENDITURE CARD
            GestureDetector(
              onTap: _showBurnDialog,
              child: Container(
                decoration: AppTokens.cardDecoration(radius: AppTokens.radiusFeatureCard),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Active Expenditure',
                              style: GoogleFonts.outfit(
                                fontSize: 17,
                                fontWeight: FontWeight.w700,
                                color: AppTokens.inkBlack,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text('Cardio & strength training', style: AppTokens.sectionSubtitle),
                          ],
                        ),
                        GestureDetector(
                          onTap: _navigateToExercise,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                            decoration: BoxDecoration(
                              color: AppTokens.stoneCanvas,
                              borderRadius: BorderRadius.circular(AppTokens.radiusPill),
                              border: Border.all(color: AppTokens.stoneBorder),
                            ),
                            child: Text(
                              'Log Workout',
                              style: GoogleFonts.outfit(
                                color: AppTokens.inkBlack,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Text(
                          '+${_burnedCalories.toStringAsFixed(0)}',
                          style: GoogleFonts.outfit(fontSize: 28, fontWeight: FontWeight.w800, color: AppTokens.cyanEdge),
                        ),
                        const SizedBox(width: 8),
                        Text('kcal credited to budget', style: AppTokens.bodyMuted),
                      ],
                    ),
                    const SizedBox(height: 10),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(2),
                      child: LinearProgressIndicator(
                        value: (_burnedCalories / 500).clamp(0.0, 1.0),
                        minHeight: 3.5,
                        backgroundColor: AppTokens.stoneBorder,
                        valueColor: const AlwaysStoppedAnimation<Color>(AppTokens.cyanEdge),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 90),
          ],
        ),
      ),
      floatingActionButton: GestureDetector(
        onLongPress: _showQuickNavSheet,
        child: FloatingActionButton.extended(
          onPressed: _showAdjustGoalsDialog,
          backgroundColor: AppTokens.cyanSignal,
          elevation: 4,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTokens.radiusPill)),
          icon: const Icon(Icons.tune_rounded, color: Colors.white, size: 20),
          label: Text(
            'Adjust Goals',
            style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white),
          ),
        ),
      ),
    );
  }

  Widget _buildFormulaCol(String label, String value, Color color) {
    return Column(
      children: [
        Text(label, style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w500, color: AppTokens.warmGray)),
        const SizedBox(height: 3),
        Text(value, style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 14, color: color)),
      ],
    );
  }

  Widget _buildLegendItem(String label, Color color) {
    return Row(
      children: [
        Container(width: 6, height: 6, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 5),
        Text(label, style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w500, color: AppTokens.warmGray)),
      ],
    );
  }

  Widget _buildMacroRow({
    required String name,
    required IconData icon,
    required Color iconColor,
    required double consumed,
    required double target,
    required int kcal,
    required double progress,
    required Color progressColor,
  }) {
    final double remaining = target - consumed;
    final bool isSurplus = remaining < 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Icon(icon, size: 18, color: iconColor),
                const SizedBox(width: 8),
                Text(
                  name,
                  style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 15, color: AppTokens.inkBlack),
                ),
              ],
            ),
            Text(
              '${remaining.abs().toStringAsFixed(0)}g ${isSurplus ? "surplus" : "left"}',
              style: GoogleFonts.outfit(
                color: isSurplus ? AppTokens.cyanEdge : iconColor,
                fontWeight: FontWeight.w700,
                fontSize: 13,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(2),
          child: LinearProgressIndicator(
            value: progress,
            minHeight: 3.5,
            backgroundColor: AppTokens.stoneBorder,
            valueColor: AlwaysStoppedAnimation<Color>(progressColor),
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              '${consumed.toStringAsFixed(0)}g of ${target.toStringAsFixed(0)}g',
              style: GoogleFonts.outfit(fontSize: 13, color: AppTokens.warmGray),
            ),
            Text(
              '$kcal kcal',
              style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 13, color: AppTokens.warmGray),
            ),
          ],
        ),
      ],
    );
  }
}
