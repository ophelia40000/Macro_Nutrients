import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'theme.dart';
import 'models.dart';
import 'database_helper.dart';

class NutritionPage extends StatefulWidget {
  final double calGoal;
  final double protGoal;
  final double carbGoal;
  final double fatGoal;
  final double burnedCalories;

  const NutritionPage({
    super.key,
    required this.calGoal,
    required this.protGoal,
    required this.carbGoal,
    required this.fatGoal,
    required this.burnedCalories,
  });

  @override
  State<NutritionPage> createState() => _NutritionPageState();
}

class _NutritionPageState extends State<NutritionPage> {
  List<FoodEntry> _entries = [];
  List<FoodPreset> _presets = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final entries = await DatabaseHelper.instance.getTodayEntries();
    final presets = await DatabaseHelper.instance.getPresets();
    setState(() {
      _entries = entries;
      _presets = presets;
      _isLoading = false;
    });
  }

  void _showAddEntryModal() {
    showDialog(
      context: context,
      barrierColor: Colors.black.withValues(alpha: 0.45),
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        child: _AddEntryDialog(
          presets: _presets,
          onAdd: (newEntry) async {
            await DatabaseHelper.instance.addEntry(newEntry);
            if (!mounted) return;
            _loadData();
          },
        ),
      ),
    );
  }

  void _showPresetsModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _PresetsSheet(
        presets: _presets,
        onRefresh: _loadData,
      ),
    );
  }

  void _deleteEntry(FoodEntry entry) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTokens.pureWhite,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTokens.radiusFeatureCard)),
        title: Text('Remove Entry', style: AppTokens.sectionTitle),
        content: Text('Delete "${entry.name}" from today\'s ledger?', style: AppTokens.bodyMuted),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel', style: AppTokens.bodyMuted),
          ),
          ElevatedButton(
            onPressed: () async {
              await DatabaseHelper.instance.deleteEntry(entry.id);
              if (!ctx.mounted) return;
              Navigator.of(ctx).pop();
              _loadData();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTokens.surplusAlert,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTokens.radiusInput)),
            ),
            child: Text('Delete', style: AppTokens.buttonText),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    double totalCal = 0, totalProt = 0, totalCarb = 0, totalFat = 0;
    for (final e in _entries) {
      totalCal += e.calories;
      totalProt += e.protein;
      totalCarb += e.carbs;
      totalFat += e.fat;
    }

    final totalBudget = widget.calGoal + widget.burnedCalories;
    final remainingCal = totalBudget - totalCal;
    final isSurplus = remainingCal < 0;

    return Scaffold(
      backgroundColor: AppTokens.stoneCanvas,
      appBar: AppBar(
        backgroundColor: AppTokens.stoneCanvas,
        elevation: 0,
        toolbarHeight: 68,
        leadingWidth: 64,
        leading: Padding(
          padding: const EdgeInsets.only(left: 16),
          child: Center(
            child: GestureDetector(
              onTap: () => Navigator.pop(context),
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppTokens.pureWhite,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppTokens.stoneBorder, width: 1),
                ),
                child: const Icon(Icons.arrow_back, color: AppTokens.inkBlack, size: 20),
              ),
            ),
          ),
        ),
        centerTitle: false,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Nutrition Diary',
              style: GoogleFonts.outfit(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppTokens.inkBlack,
                letterSpacing: -0.3,
              ),
            ),
            Text(
              'Daily intake ledger',
              style: GoogleFonts.outfit(
                fontSize: 12,
                color: AppTokens.warmGray,
                fontWeight: FontWeight.w400,
              ),
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: GestureDetector(
              onTap: _showPresetsModal,
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppTokens.pureWhite,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppTokens.stoneBorder, width: 1),
                ),
                child: const Icon(Icons.bookmark_border, color: AppTokens.inkBlack, size: 20),
              ),
            ),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTokens.cyanSignal))
          : SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Hero Caloric Budget Card (Match diary.png)
                  Container(
                    decoration: AppTokens.cardDecoration(radius: AppTokens.radiusFeatureCard),
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'CALORIC BUDGET',
                              style: GoogleFonts.outfit(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: AppTokens.warmGray,
                                letterSpacing: 0.8,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppTokens.stoneCanvas,
                                borderRadius: BorderRadius.circular(AppTokens.radiusPill),
                                border: Border.all(color: AppTokens.stoneBorder),
                              ),
                              child: Text(
                                isSurplus
                                    ? '+${remainingCal.abs().toStringAsFixed(0)} kcal surplus'
                                    : 'Remaining: ${remainingCal.toStringAsFixed(0)} kcal',
                                style: GoogleFonts.outfit(
                                  color: isSurplus ? AppTokens.surplusAlert : AppTokens.warmGray,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.baseline,
                          textBaseline: TextBaseline.alphabetic,
                          children: [
                            Text(
                              totalCal.toStringAsFixed(0),
                              style: GoogleFonts.outfit(
                                fontSize: 40,
                                fontWeight: FontWeight.w900,
                                color: AppTokens.inkBlack,
                                letterSpacing: -1,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '/ ${totalBudget.toStringAsFixed(0)} kcal',
                              style: GoogleFonts.outfit(
                                fontSize: 15,
                                color: AppTokens.warmGray,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        // Black solid bar
                        Container(
                          width: double.infinity,
                          height: 3.5,
                          decoration: BoxDecoration(
                            color: AppTokens.inkBlack,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        const SizedBox(height: 18),
                        const Divider(height: 1, color: AppTokens.stoneBorder),
                        const SizedBox(height: 16),
                        // 3 Macro Columns
                        Row(
                          children: [
                            Expanded(
                              child: _buildDiaryMacroCol(
                                name: 'Protein',
                                dotColor: AppTokens.cyanSignal,
                                consumed: totalProt.toStringAsFixed(0),
                                target: '${widget.protGoal.toStringAsFixed(0)}g',
                                barColor: AppTokens.cyanSignal,
                                kcal: '${(totalProt * 4).round()} kcal',
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: _buildDiaryMacroCol(
                                name: 'Carbs',
                                dotColor: AppTokens.warmGray,
                                consumed: totalCarb.toStringAsFixed(0),
                                target: '${widget.carbGoal.toStringAsFixed(0)}g',
                                barColor: AppTokens.warmGray,
                                kcal: '${(totalCarb * 4).round()} kcal',
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: _buildDiaryMacroCol(
                                name: 'Fats',
                                dotColor: AppTokens.stoneMuted,
                                consumed: totalFat.toStringAsFixed(0),
                                target: '${widget.fatGoal.toStringAsFixed(0)}g',
                                barColor: AppTokens.stoneMuted,
                                kcal: '${(totalFat * 9).round()} kcal',
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Recorded Meals Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Recorded Meals',
                        style: GoogleFonts.outfit(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppTokens.inkBlack,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3.5),
                        decoration: BoxDecoration(
                          color: AppTokens.pureWhite,
                          borderRadius: BorderRadius.circular(AppTokens.radiusPill),
                          border: Border.all(color: AppTokens.stoneBorder),
                        ),
                        child: Text(
                          '${_entries.length} items',
                          style: GoogleFonts.outfit(
                            color: AppTokens.warmGray,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Meal Cards
                  if (_entries.isEmpty)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 20),
                      decoration: AppTokens.cardDecoration(),
                      child: Column(
                        children: [
                          const Icon(Icons.restaurant_outlined, color: AppTokens.ashGray, size: 28),
                          const SizedBox(height: 12),
                          Text('No meals logged today', style: AppTokens.sectionTitle.copyWith(fontSize: 14)),
                          const SizedBox(height: 4),
                          Text('Log your food intake to maintain macro calibrations.', textAlign: TextAlign.center, style: AppTokens.bodyMuted),
                          const SizedBox(height: 14),
                          ElevatedButton.icon(
                            onPressed: _showAddEntryModal,
                            icon: const Icon(Icons.add, size: 14, color: AppTokens.inkBlack),
                            label: Text('Log First Meal', style: AppTokens.body.copyWith(fontWeight: FontWeight.w700)),
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
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _entries.length,
                      separatorBuilder: (context, index) => const SizedBox(height: 10),
                      itemBuilder: (ctx, index) {
                        final entry = _entries[index];
                        return Container(
                          decoration: AppTokens.cardDecoration(radius: 12),
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      entry.name,
                                      style: GoogleFonts.outfit(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 15,
                                        color: AppTokens.inkBlack,
                                      ),
                                    ),
                                    const SizedBox(height: 5),
                                    Row(
                                      children: [
                                        Text('P ', style: GoogleFonts.outfit(color: AppTokens.warmGray, fontSize: 13, fontWeight: FontWeight.w500)),
                                        Text('${entry.protein.toStringAsFixed(0)}g', style: GoogleFonts.outfit(color: AppTokens.inkBlack, fontSize: 13, fontWeight: FontWeight.w700)),
                                        Text('  ·  C ', style: GoogleFonts.outfit(color: AppTokens.warmGray, fontSize: 13, fontWeight: FontWeight.w500)),
                                        Text('${entry.carbs.toStringAsFixed(0)}g', style: GoogleFonts.outfit(color: AppTokens.inkBlack, fontSize: 13, fontWeight: FontWeight.w700)),
                                        Text('  ·  F ', style: GoogleFonts.outfit(color: AppTokens.warmGray, fontSize: 13, fontWeight: FontWeight.w500)),
                                        Text('${entry.fat.toStringAsFixed(0)}g', style: GoogleFonts.outfit(color: AppTokens.inkBlack, fontSize: 13, fontWeight: FontWeight.w700)),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              Row(
                                children: [
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                        entry.calories.toStringAsFixed(0),
                                        style: GoogleFonts.outfit(
                                          fontWeight: FontWeight.w800,
                                          fontSize: 16,
                                          color: AppTokens.inkBlack,
                                        ),
                                      ),
                                      Text(
                                        'kcal',
                                        style: GoogleFonts.outfit(
                                          fontSize: 11,
                                          color: AppTokens.warmGray,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(width: 12),
                                  GestureDetector(
                                    onTap: () => _deleteEntry(entry),
                                    child: Container(
                                      width: 36,
                                      height: 36,
                                      decoration: BoxDecoration(
                                        color: AppTokens.stoneCanvas,
                                        shape: BoxShape.circle,
                                        border: Border.all(color: AppTokens.stoneBorder, width: 1),
                                      ),
                                      child: const Icon(Icons.delete_outline, size: 18, color: AppTokens.ashGray),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  const SizedBox(height: 85),
                ],
              ),
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddEntryModal,
        backgroundColor: AppTokens.cyanSignal,
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTokens.radiusPill)),
        icon: const Icon(Icons.add, color: Colors.white, size: 20),
        label: Text(
          'Log Food',
          style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white),
        ),
      ),
    );
  }

  Widget _buildDiaryMacroCol({
    required String name,
    required Color dotColor,
    required String consumed,
    required String target,
    required Color barColor,
    required String kcal,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(width: 6, height: 6, decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle)),
            const SizedBox(width: 5),
            Text(name, style: GoogleFonts.outfit(fontSize: 12, color: AppTokens.warmGray, fontWeight: FontWeight.w500)),
          ],
        ),
        const SizedBox(height: 6),
        Row(
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          children: [
            Text(consumed, style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 16, color: AppTokens.inkBlack)),
            const SizedBox(width: 3),
            Text('/ $target', style: GoogleFonts.outfit(fontSize: 12, color: AppTokens.warmGray, fontWeight: FontWeight.w500)),
          ],
        ),
        const SizedBox(height: 6),
        Container(
          width: double.infinity,
          height: 2.5,
          decoration: BoxDecoration(color: barColor, borderRadius: BorderRadius.circular(1.5)),
        ),
        const SizedBox(height: 6),
        Text(kcal, style: GoogleFonts.outfit(fontSize: 12, color: AppTokens.warmGray, fontWeight: FontWeight.w500)),
      ],
    );
  }
}

// --- ADD FOOD ENTRY DIALOG (Matching add_entry.png 1:1) ---
class _AddEntryDialog extends StatefulWidget {
  final List<FoodPreset> presets;
  final Function(FoodEntry) onAdd;

  const _AddEntryDialog({required this.presets, required this.onAdd});

  @override
  State<_AddEntryDialog> createState() => _AddEntryDialogState();
}

class _AddEntryDialogState extends State<_AddEntryDialog> {
  int _tab = 0; // 0 = Preset, 1 = Manual
  FoodPreset? _selectedPreset;
  final TextEditingController _searchCtrl = TextEditingController(text: 'Nasi Putih (100g)');
  final TextEditingController _weightCtrl = TextEditingController();

  // Manual inputs
  final TextEditingController _nameCtrl = TextEditingController();
  final TextEditingController _calCtrl = TextEditingController();
  final TextEditingController _protCtrl = TextEditingController();
  final TextEditingController _carbCtrl = TextEditingController();
  final TextEditingController _fatCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (widget.presets.isNotEmpty) {
      _selectedPreset = widget.presets.first;
    }
  }

  @override
  Widget build(BuildContext context) {
    double previewCal = 0, previewProt = 0, previewCarb = 0, previewFat = 0;
    if (_selectedPreset != null) {
      final double weight = double.tryParse(_weightCtrl.text) ?? 0.0;
      final double ratio = weight / 100.0;
      previewCal = _selectedPreset!.calories * ratio;
      previewProt = _selectedPreset!.protein * ratio;
      previewCarb = _selectedPreset!.carbs * ratio;
      previewFat = _selectedPreset!.fat * ratio;
    }

    return Container(
      decoration: BoxDecoration(
        color: AppTokens.pureWhite,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.12),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      padding: const EdgeInsets.all(22),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Add Food Entry',
              style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700, color: AppTokens.inkBlack),
            ),
            const SizedBox(height: 2),
            Text(
              'Preset selection or custom macronutrient log',
              style: GoogleFonts.outfit(fontSize: 12, color: AppTokens.warmGray, fontWeight: FontWeight.w400),
            ),
            const SizedBox(height: 16),

            // Tab switch (Preset / Manual)
            Container(
              height: 42,
              decoration: BoxDecoration(
                color: AppTokens.pureWhite,
                borderRadius: BorderRadius.circular(AppTokens.radiusPill),
                border: Border.all(color: AppTokens.stoneBorder, width: 1),
              ),
              padding: const EdgeInsets.all(3),
              child: Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _tab = 0),
                      child: Container(
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: _tab == 0 ? AppTokens.pureWhite : Colors.transparent,
                          borderRadius: BorderRadius.circular(AppTokens.radiusPill),
                          border: _tab == 0 ? Border.all(color: AppTokens.stoneBorder, width: 1) : null,
                          boxShadow: _tab == 0 ? [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 4)] : [],
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.format_list_bulleted, size: 16, color: _tab == 0 ? AppTokens.inkBlack : AppTokens.warmGray),
                            const SizedBox(width: 6),
                            Text('Preset', style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w700, color: _tab == 0 ? AppTokens.inkBlack : AppTokens.warmGray)),
                          ],
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _tab = 1),
                      child: Container(
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: _tab == 1 ? AppTokens.pureWhite : Colors.transparent,
                          borderRadius: BorderRadius.circular(AppTokens.radiusPill),
                          border: _tab == 1 ? Border.all(color: AppTokens.stoneBorder, width: 1) : null,
                          boxShadow: _tab == 1 ? [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 4)] : [],
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.edit_outlined, size: 16, color: _tab == 1 ? AppTokens.inkBlack : AppTokens.warmGray),
                            const SizedBox(width: 6),
                            Text('Manual', style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w700, color: _tab == 1 ? AppTokens.inkBlack : AppTokens.warmGray)),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            if (_tab == 0) ...[
              // Preset Tab
              TextField(
                controller: _searchCtrl,
                onChanged: (_) => setState(() {}),
                style: GoogleFonts.outfit(fontSize: 14, color: AppTokens.inkBlack, fontWeight: FontWeight.w500),
                decoration: InputDecoration(
                  hintText: 'Search food presets',
                  prefixIcon: const Icon(Icons.search, color: AppTokens.ashGray, size: 18),
                  filled: true,
                  fillColor: AppTokens.pureWhite,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: AppTokens.stoneBorder, width: 1),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: AppTokens.cyanSignal, width: 1.5),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _weightCtrl,
                keyboardType: TextInputType.number,
                onChanged: (_) => setState(() {}),
                style: GoogleFonts.outfit(fontSize: 14, color: AppTokens.inkBlack, fontWeight: FontWeight.w500),
                decoration: InputDecoration(
                  hintText: 'Portion weight',
                  prefixIcon: const Icon(Icons.scale_outlined, color: AppTokens.ashGray, size: 18),
                  suffixIcon: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Text('g', style: GoogleFonts.outfit(color: AppTokens.warmGray, fontSize: 13)),
                  ),
                  filled: true,
                  fillColor: AppTokens.pureWhite,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: AppTokens.stoneBorder, width: 1),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: AppTokens.cyanSignal, width: 1.5),
                  ),
                ),
              ),
              const SizedBox(height: 14),

              // Portion Telemetry Card
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppTokens.pureWhite,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppTokens.stoneBorder, width: 1),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.pie_chart_outline, size: 16, color: AppTokens.cyanEdge),
                        const SizedBox(width: 6),
                        Text(
                          'Portion Telemetry',
                          style: GoogleFonts.outfit(color: AppTokens.cyanEdge, fontWeight: FontWeight.w700, fontSize: 13),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Energy', style: GoogleFonts.outfit(color: AppTokens.warmGray, fontSize: 13)),
                        Text('${previewCal.toStringAsFixed(1)} kcal', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 14, color: AppTokens.inkBlack)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Macro Split', style: GoogleFonts.outfit(color: AppTokens.warmGray, fontSize: 13)),
                        Text(
                          'P: ${previewProt.toStringAsFixed(1)}g · C: ${previewCarb.toStringAsFixed(1)}g · F: ${previewFat.toStringAsFixed(1)}g',
                          style: GoogleFonts.outfit(color: AppTokens.inkBlack, fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ] else ...[
              // Manual Tab
              TextField(controller: _nameCtrl, decoration: AppTokens.inputDecoration(hintText: 'Food Name (e.g. Dada Ayam)')),
              const SizedBox(height: 10),
              TextField(controller: _calCtrl, keyboardType: TextInputType.number, decoration: AppTokens.inputDecoration(hintText: 'Calories (kcal)')),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(child: TextField(controller: _protCtrl, keyboardType: TextInputType.number, decoration: AppTokens.inputDecoration(hintText: 'Protein (g)'))),
                  const SizedBox(width: 8),
                  Expanded(child: TextField(controller: _carbCtrl, keyboardType: TextInputType.number, decoration: AppTokens.inputDecoration(hintText: 'Carbs (g)'))),
                  const SizedBox(width: 8),
                  Expanded(child: TextField(controller: _fatCtrl, keyboardType: TextInputType.number, decoration: AppTokens.inputDecoration(hintText: 'Fat (g)'))),
                ],
              ),
            ],
            const SizedBox(height: 20),

            // Action Buttons (Cancel / Add Entry)
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 11),
                    decoration: BoxDecoration(
                      color: AppTokens.pureWhite,
                      borderRadius: BorderRadius.circular(AppTokens.radiusPill),
                      border: Border.all(color: AppTokens.stoneBorder, width: 1),
                    ),
                    child: Text(
                      'Cancel',
                      style: GoogleFonts.outfit(color: AppTokens.inkBlack, fontWeight: FontWeight.w600, fontSize: 14),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                GestureDetector(
                  onTap: () {
                    final today = DateTime.now().toIso8601String().split('T')[0];
                    if (_tab == 0) {
                      if (_selectedPreset == null) return;
                      final double w = double.tryParse(_weightCtrl.text) ?? 100.0;
                      final double ratio = w / 100.0;
                      final entry = FoodEntry(
                        id: DateTime.now().millisecondsSinceEpoch.toString(),
                        name: '${_selectedPreset!.name} (${w.toStringAsFixed(0)}g)',
                        calories: _selectedPreset!.calories * ratio,
                        protein: _selectedPreset!.protein * ratio,
                        carbs: _selectedPreset!.carbs * ratio,
                        fat: _selectedPreset!.fat * ratio,
                        date: today,
                      );
                      widget.onAdd(entry);
                    } else {
                      final name = _nameCtrl.text.trim();
                      if (name.isEmpty) return;
                      final entry = FoodEntry(
                        id: DateTime.now().millisecondsSinceEpoch.toString(),
                        name: name,
                        calories: double.tryParse(_calCtrl.text) ?? 0,
                        protein: double.tryParse(_protCtrl.text) ?? 0,
                        carbs: double.tryParse(_carbCtrl.text) ?? 0,
                        fat: double.tryParse(_fatCtrl.text) ?? 0,
                        date: today,
                      );
                      widget.onAdd(entry);
                    }
                    Navigator.pop(context);
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 11),
                    decoration: BoxDecoration(
                      color: AppTokens.cyanSignal,
                      borderRadius: BorderRadius.circular(AppTokens.radiusPill),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.add, color: Colors.white, size: 18),
                        const SizedBox(width: 4),
                        Text(
                          'Add Entry',
                          style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// --- PRESETS MANAGEMENT SHEET ---
class _PresetsSheet extends StatefulWidget {
  final List<FoodPreset> presets;
  final VoidCallback onRefresh;

  const _PresetsSheet({required this.presets, required this.onRefresh});

  @override
  State<_PresetsSheet> createState() => _PresetsSheetState();
}

class _PresetsSheetState extends State<_PresetsSheet> {
  final TextEditingController _nameCtrl = TextEditingController();
  final TextEditingController _calCtrl = TextEditingController();
  final TextEditingController _protCtrl = TextEditingController();
  final TextEditingController _carbCtrl = TextEditingController();
  final TextEditingController _fatCtrl = TextEditingController();
  bool _isAdding = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppTokens.pureWhite,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: SingleChildScrollView(
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
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Food Presets', style: AppTokens.sectionTitle),
                    Text('Saved 100g nutritional benchmarks', style: AppTokens.sectionSubtitle),
                  ],
                ),
                TextButton.icon(
                  icon: Icon(_isAdding ? Icons.close : Icons.add, size: 16, color: AppTokens.cyanEdge),
                  label: Text(_isAdding ? 'Cancel' : 'New', style: AppTokens.body.copyWith(fontWeight: FontWeight.w700, color: AppTokens.cyanEdge)),
                  onPressed: () => setState(() => _isAdding = !_isAdding),
                ),
              ],
            ),
            const SizedBox(height: 14),

            if (_isAdding) ...[
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppTokens.stoneCanvas,
                  borderRadius: BorderRadius.circular(AppTokens.radiusInput),
                  border: Border.all(color: AppTokens.stoneBorder),
                ),
                child: Column(
                  children: [
                    TextField(controller: _nameCtrl, decoration: AppTokens.inputDecoration(hintText: 'Preset name (e.g. Oatmeal)')),
                    const SizedBox(height: 8),
                    TextField(controller: _calCtrl, keyboardType: TextInputType.number, decoration: AppTokens.inputDecoration(hintText: 'Calories per 100g')),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(child: TextField(controller: _protCtrl, keyboardType: TextInputType.number, decoration: AppTokens.inputDecoration(hintText: 'P (g)'))),
                        const SizedBox(width: 6),
                        Expanded(child: TextField(controller: _carbCtrl, keyboardType: TextInputType.number, decoration: AppTokens.inputDecoration(hintText: 'C (g)'))),
                        const SizedBox(width: 6),
                        Expanded(child: TextField(controller: _fatCtrl, keyboardType: TextInputType.number, decoration: AppTokens.inputDecoration(hintText: 'F (g)'))),
                      ],
                    ),
                    const SizedBox(height: 10),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () async {
                          final name = _nameCtrl.text.trim();
                          if (name.isEmpty) return;
                          final p = FoodPreset(
                            id: 'p_${DateTime.now().millisecondsSinceEpoch}',
                            name: name,
                            calories: double.tryParse(_calCtrl.text) ?? 0,
                            protein: double.tryParse(_protCtrl.text) ?? 0,
                            carbs: double.tryParse(_carbCtrl.text) ?? 0,
                            fat: double.tryParse(_fatCtrl.text) ?? 0,
                          );
                          await DatabaseHelper.instance.addPreset(p);
                          setState(() => _isAdding = false);
                          widget.onRefresh();
                        },
                        style: ElevatedButton.styleFrom(backgroundColor: AppTokens.cyanSignal),
                        child: Text('Save Preset', style: AppTokens.buttonText),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
            ],

            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: widget.presets.length,
              separatorBuilder: (context, index) => const SizedBox(height: 8),
              itemBuilder: (ctx, idx) {
                final preset = widget.presets[idx];
                return Container(
                  decoration: AppTokens.cardDecoration(),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(preset.name, style: AppTokens.body.copyWith(fontWeight: FontWeight.w700)),
                            Text('${preset.calories.toStringAsFixed(0)} kcal · P: ${preset.protein}g · C: ${preset.carbs}g · F: ${preset.fat}g', style: AppTokens.bodyMuted),
                          ],
                        ),
                      ),
                      if (preset.id != null)
                        IconButton(
                          icon: const Icon(Icons.delete_outline, size: 18, color: AppTokens.ashGray),
                          onPressed: () async {
                            await DatabaseHelper.instance.deletePreset(preset.id!);
                            widget.onRefresh();
                            if (mounted) setState(() {});
                          },
                        ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
