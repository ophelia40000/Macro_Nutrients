import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'theme.dart';
import 'models.dart';
import 'database_helper.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  final TextEditingController _heightController = TextEditingController();
  final TextEditingController _weightController = TextEditingController();
  final TextEditingController _neckController = TextEditingController();
  final TextEditingController _waistController = TextEditingController();
  final TextEditingController _hipController = TextEditingController();
  String _gender = 'male';
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final goals = await DatabaseHelper.instance.getGoals();
    setState(() {
      _heightController.text = goals.height.toStringAsFixed(0);
      _weightController.text = goals.weight.toStringAsFixed(0);
      _gender = goals.gender.toLowerCase() == 'female' ? 'female' : 'male';
      _neckController.text = goals.neck.toStringAsFixed(0);
      _waistController.text = goals.waist.toStringAsFixed(0);
      _hipController.text = goals.hip.toStringAsFixed(0);
      _isLoading = false;
    });
  }

  String _calculateBodyFat() {
    final double h = double.tryParse(_heightController.text) ?? 170;
    final double n = double.tryParse(_neckController.text) ?? 38;
    final double wst = double.tryParse(_waistController.text) ?? 80;
    final double hp = double.tryParse(_hipController.text) ?? 90;

    if (h <= 0 || n <= 0 || wst <= 0) return '13.7%';

    double bf = 0;
    if (_gender == 'male') {
      if (wst <= n) return '13.7%';
      final logWstNeck = math.log(wst - n) / math.ln10;
      final logH = math.log(h) / math.ln10;
      bf = 495 / (1.0324 - 0.19077 * logWstNeck + 0.15456 * logH) - 450;
    } else {
      if (wst + hp <= n) return '21.5%';
      final logWstHpHip = math.log(wst + hp - n) / math.ln10;
      final logH = math.log(h) / math.ln10;
      bf = 495 / (1.29579 - 0.35004 * logWstHpHip + 0.22100 * logH) - 450;
    }

    if (bf < 2 || bf > 60 || bf.isNaN) {
      return '13.7%';
    }
    return '${bf.toStringAsFixed(1)}%';
  }

  Future<void> _handleSave() async {
    final currentGoals = await DatabaseHelper.instance.getGoals();
    final updatedGoals = UserGoals(
      calories: currentGoals.calories,
      carbs: currentGoals.carbs,
      protein: currentGoals.protein,
      fat: currentGoals.fat,
      height: double.tryParse(_heightController.text) ?? currentGoals.height,
      weight: double.tryParse(_weightController.text) ?? currentGoals.weight,
      gender: _gender,
      neck: double.tryParse(_neckController.text) ?? currentGoals.neck,
      waist: double.tryParse(_waistController.text) ?? currentGoals.waist,
      hip: double.tryParse(_hipController.text) ?? currentGoals.hip,
    );
    await DatabaseHelper.instance.saveGoals(updatedGoals);
    if (!mounted) return;
    Navigator.pop(context, true);
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: AppTokens.stoneCanvas,
        body: Center(child: CircularProgressIndicator(color: AppTokens.cyanSignal)),
      );
    }

    final bodyFatStr = _calculateBodyFat();

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
        centerTitle: true,
        title: Text(
          'Biometric Profile',
          style: GoogleFonts.outfit(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppTokens.inkBlack,
            letterSpacing: -0.2,
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: AppTokens.stoneBorder, height: 1),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Column(
          children: [
            // Card 1: Avatar & Body Metrics Header Card
            Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: AppTokens.pureWhite,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTokens.stoneBorder),
              ),
              padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
              child: Column(
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: AppTokens.pureWhite,
                      shape: BoxShape.circle,
                      border: Border.all(color: AppTokens.stoneBorder),
                    ),
                    child: const Icon(Icons.person_outline, size: 30, color: AppTokens.cyanSignal),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Body Metrics',
                    style: GoogleFonts.outfit(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppTokens.inkBlack,
                      letterSpacing: -0.2,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    'Physical statistics & body composition',
                    style: GoogleFonts.outfit(
                      fontSize: 13,
                      color: AppTokens.warmGray,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Card 2: Core Dimensions
            Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: AppTokens.pureWhite,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTokens.stoneBorder),
              ),
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Core Dimensions',
                    style: GoogleFonts.outfit(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppTokens.inkBlack,
                      letterSpacing: -0.2,
                    ),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Height',
                              style: GoogleFonts.outfit(fontSize: 13, color: AppTokens.warmGray),
                            ),
                            const SizedBox(height: 6),
                            Container(
                              height: 48,
                              decoration: BoxDecoration(
                                color: AppTokens.stoneCanvas,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: AppTokens.stoneBorder),
                              ),
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                              child: Row(
                                children: [
                                  const Icon(Icons.straighten, size: 18, color: AppTokens.ashGray),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: TextField(
                                      controller: _heightController,
                                      keyboardType: TextInputType.number,
                                      onChanged: (_) => setState(() {}),
                                      style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: AppTokens.inkBlack),
                                      decoration: const InputDecoration(
                                        isDense: true,
                                        border: InputBorder.none,
                                        contentPadding: EdgeInsets.zero,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Weight',
                              style: GoogleFonts.outfit(fontSize: 13, color: AppTokens.warmGray),
                            ),
                            const SizedBox(height: 6),
                            Container(
                              height: 48,
                              decoration: BoxDecoration(
                                color: AppTokens.stoneCanvas,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: AppTokens.stoneBorder),
                              ),
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                              child: Row(
                                children: [
                                  const Icon(Icons.scale_outlined, size: 18, color: AppTokens.ashGray),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: TextField(
                                      controller: _weightController,
                                      keyboardType: TextInputType.number,
                                      onChanged: (_) => setState(() {}),
                                      style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: AppTokens.inkBlack),
                                      decoration: const InputDecoration(
                                        isDense: true,
                                        border: InputBorder.none,
                                        contentPadding: EdgeInsets.zero,
                                      ),
                                    ),
                                  ),
                                ],
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
            const SizedBox(height: 14),

            // Card 3: Body Fat & Circumferences
            Container(
              width: double.infinity,
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
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Body Fat',
                            style: GoogleFonts.outfit(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: AppTokens.inkBlack,
                              letterSpacing: -0.2,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFFE0F2FE),
                              borderRadius: BorderRadius.circular(AppTokens.radiusPill),
                            ),
                            child: Text(
                              'US Navy Formula',
                              style: GoogleFonts.outfit(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF0284C7),
                              ),
                            ),
                          ),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            bodyFatStr,
                            style: GoogleFonts.outfit(
                              fontSize: 28,
                              fontWeight: FontWeight.w800,
                              color: AppTokens.cyanSignal,
                            ),
                          ),
                          Text('estimated', style: GoogleFonts.outfit(fontSize: 11, color: AppTokens.warmGray)),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Container(height: 1, color: AppTokens.stoneBorder),
                  const SizedBox(height: 16),

                  // Biological Sex Toggle
                  Text('Biological Sex', style: GoogleFonts.outfit(fontSize: 13, color: AppTokens.warmGray)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _gender = 'male'),
                          child: Container(
                            height: 42,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: _gender == 'male' ? const Color(0xFF1C1917) : AppTokens.pureWhite,
                              borderRadius: BorderRadius.circular(AppTokens.radiusPill),
                              border: Border.all(
                                color: _gender == 'male' ? const Color(0xFF1C1917) : AppTokens.stoneBorder,
                              ),
                            ),
                            child: Text(
                              'Male',
                              style: GoogleFonts.outfit(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: _gender == 'male' ? Colors.white : AppTokens.inkBlack,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _gender = 'female'),
                          child: Container(
                            height: 42,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: _gender == 'female' ? const Color(0xFF1C1917) : AppTokens.pureWhite,
                              borderRadius: BorderRadius.circular(AppTokens.radiusPill),
                              border: Border.all(
                                color: _gender == 'female' ? const Color(0xFF1C1917) : AppTokens.stoneBorder,
                              ),
                            ),
                            child: Text(
                              'Female',
                              style: GoogleFonts.outfit(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: _gender == 'female' ? Colors.white : AppTokens.inkBlack,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Circumferences
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Neck Circumference', style: GoogleFonts.outfit(fontSize: 13, color: AppTokens.warmGray)),
                            const SizedBox(height: 6),
                            Container(
                              height: 48,
                              decoration: BoxDecoration(
                                color: AppTokens.stoneCanvas,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: AppTokens.stoneBorder),
                              ),
                              padding: const EdgeInsets.symmetric(horizontal: 14),
                              alignment: Alignment.centerLeft,
                              child: TextField(
                                controller: _neckController,
                                keyboardType: TextInputType.number,
                                onChanged: (_) => setState(() {}),
                                style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: AppTokens.inkBlack),
                                decoration: const InputDecoration(
                                  isDense: true,
                                  border: InputBorder.none,
                                  contentPadding: EdgeInsets.zero,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Waist Circumference', style: GoogleFonts.outfit(fontSize: 13, color: AppTokens.warmGray)),
                            const SizedBox(height: 6),
                            Container(
                              height: 48,
                              decoration: BoxDecoration(
                                color: AppTokens.stoneCanvas,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: AppTokens.stoneBorder),
                              ),
                              padding: const EdgeInsets.symmetric(horizontal: 14),
                              alignment: Alignment.centerLeft,
                              child: TextField(
                                controller: _waistController,
                                keyboardType: TextInputType.number,
                                onChanged: (_) => setState(() {}),
                                style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: AppTokens.inkBlack),
                                decoration: const InputDecoration(
                                  isDense: true,
                                  border: InputBorder.none,
                                  contentPadding: EdgeInsets.zero,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  if (_gender == 'female') ...[
                    const SizedBox(height: 14),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Hip Circumference', style: GoogleFonts.outfit(fontSize: 13, color: AppTokens.warmGray)),
                        const SizedBox(height: 6),
                        Container(
                          height: 48,
                          decoration: BoxDecoration(
                            color: AppTokens.stoneCanvas,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: AppTokens.stoneBorder),
                          ),
                          padding: const EdgeInsets.symmetric(horizontal: 14),
                          alignment: Alignment.centerLeft,
                          child: TextField(
                            controller: _hipController,
                            keyboardType: TextInputType.number,
                            onChanged: (_) => setState(() {}),
                            style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: AppTokens.inkBlack),
                            decoration: const InputDecoration(
                              isDense: true,
                              border: InputBorder.none,
                              contentPadding: EdgeInsets.zero,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Full Width Save Profile Changes Pill Button
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _handleSave,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTokens.cyanSignal,
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AppTokens.radiusPill),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.check, size: 20, color: Colors.white),
                    const SizedBox(width: 8),
                    Text(
                      'Save Profile Changes',
                      style: GoogleFonts.outfit(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }
}
