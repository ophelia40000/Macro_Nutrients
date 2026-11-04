import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'theme.dart';
import 'models.dart';
import 'database_helper.dart';

class ExercisePage extends StatefulWidget {
  const ExercisePage({super.key});

  @override
  State<ExercisePage> createState() => _ExercisePageState();
}

class _ExercisePageState extends State<ExercisePage> {
  List<WorkoutRoutine> _workouts = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadWorkouts();
  }

  Future<void> _loadWorkouts() async {
    final list = await DatabaseHelper.instance.getWorkouts();
    setState(() {
      _workouts = list;
      _isLoading = false;
    });
  }

  void _showAddWorkoutDialog() {
    final nameController = TextEditingController();
    String selectedRegion = 'Chest';
    final regions = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: AppTokens.pureWhite,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTokens.radiusFeatureCard)),
          title: Text(
            'Add New Routine',
            style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700, color: AppTokens.inkBlack),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Exercise name', style: AppTokens.bodyMuted),
              const SizedBox(height: 6),
              TextField(
                controller: nameController,
                decoration: AppTokens.inputDecoration(hintText: 'e.g. Incline Dumbbell Press'),
              ),
              const SizedBox(height: 14),
              Text('Target muscle region', style: AppTokens.bodyMuted),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: regions.map((r) {
                  final isSelected = r == selectedRegion;
                  return GestureDetector(
                    onTap: () => setDialogState(() => selectedRegion = r),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: isSelected ? AppTokens.inkBlack : AppTokens.stoneCanvas,
                        borderRadius: BorderRadius.circular(AppTokens.radiusPill),
                        border: Border.all(color: isSelected ? AppTokens.inkBlack : AppTokens.stoneBorder),
                      ),
                      child: Text(
                        r,
                        style: AppTokens.pillText.copyWith(
                          color: isSelected ? Colors.white : AppTokens.warmGray,
                        ),
                      ),
                    ),
                  );
                }).toList(),
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
                final name = nameController.text.trim();
                if (name.isEmpty) return;
                final newRoutine = WorkoutRoutine(
                  id: 'ex_${DateTime.now().millisecondsSinceEpoch}',
                  name: name,
                  region: selectedRegion,
                  history: [],
                );
                final updated = [..._workouts, newRoutine];
                await DatabaseHelper.instance.saveWorkouts(updated);
                if (!ctx.mounted) return;
                Navigator.of(ctx).pop();
                _loadWorkouts();
                _openSetsModal(newRoutine);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTokens.cyanSignal,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTokens.radiusInput)),
              ),
              child: Text('Add Routine', style: AppTokens.buttonText),
            ),
          ],
        ),
      ),
    );
  }

  void _openSetsModal(WorkoutRoutine routine) {
    final today = DateTime.now().toIso8601String().split('T')[0];
    final existingSession = routine.history.firstWhere(
      (h) => h.date == today,
      orElse: () => WorkoutSession(date: today, sets: []),
    );

    List<WorkoutSet> currentSets = List.from(existingSession.sets);
    if (currentSets.isEmpty) {
      currentSets = [
        WorkoutSet(weight: 20, reps: 10),
        WorkoutSet(weight: 20, reps: 10),
        WorkoutSet(weight: 20, reps: 8),
      ];
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Container(
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
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(routine.name, style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700, color: AppTokens.inkBlack)),
                      Text('${routine.region} · Record Today\'s Sets', style: AppTokens.sectionSubtitle),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete_outline, color: AppTokens.surplusAlert, size: 20),
                    onPressed: () async {
                      final updated = _workouts.where((w) => w.id != routine.id).toList();
                      await DatabaseHelper.instance.saveWorkouts(updated);
                      if (!ctx.mounted) return;
                      Navigator.of(ctx).pop();
                      _loadWorkouts();
                    },
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Flexible(
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: currentSets.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 8),
                  itemBuilder: (ctx, index) {
                    final s = currentSets[index];
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: AppTokens.stoneCanvas,
                        borderRadius: BorderRadius.circular(AppTokens.radiusInput),
                        border: Border.all(color: AppTokens.stoneBorder),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 24,
                            height: 24,
                            alignment: Alignment.center,
                            decoration: const BoxDecoration(color: AppTokens.stoneBorder, shape: BoxShape.circle),
                            child: Text('${index + 1}', style: AppTokens.kicker.copyWith(fontSize: 10)),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text('${s.weight.toStringAsFixed(0)} kg × ${s.reps} reps', style: AppTokens.body.copyWith(fontWeight: FontWeight.w700)),
                          ),
                          IconButton(
                            icon: const Icon(Icons.remove_circle_outline, color: AppTokens.ashGray, size: 18),
                            onPressed: () {
                              setSheetState(() => currentSets.removeAt(index));
                            },
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 12),
              // Add Set Row
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        setSheetState(() {
                          final lastWeight = currentSets.isNotEmpty ? currentSets.last.weight : 20.0;
                          final lastReps = currentSets.isNotEmpty ? currentSets.last.reps : 10;
                          currentSets.add(WorkoutSet(weight: lastWeight, reps: lastReps));
                        });
                      },
                      icon: const Icon(Icons.add, size: 16, color: AppTokens.inkBlack),
                      label: Text('Add Set', style: AppTokens.body.copyWith(fontWeight: FontWeight.w700)),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppTokens.stoneBorder),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTokens.radiusInput)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () async {
                        final updatedHistory = List<WorkoutSession>.from(routine.history);
                        final exIdx = updatedHistory.findIndex((h) => h.date == today);
                        if (exIdx >= 0) {
                          updatedHistory[exIdx] = WorkoutSession(date: today, sets: currentSets);
                        } else {
                          updatedHistory.insert(0, WorkoutSession(date: today, sets: currentSets));
                        }
                        final updatedRoutine = WorkoutRoutine(
                          id: routine.id,
                          name: routine.name,
                          region: routine.region,
                          history: updatedHistory,
                        );
                        final updatedList = _workouts.map((w) => w.id == routine.id ? updatedRoutine : w).toList();
                        await DatabaseHelper.instance.saveWorkouts(updatedList);
                        if (!ctx.mounted) return;
                        Navigator.of(ctx).pop();
                        _loadWorkouts();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTokens.cyanSignal,
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTokens.radiusInput)),
                      ),
                      child: Text('Save Session', style: AppTokens.buttonText),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    int totalLoggedSets = 0;
    for (final w in _workouts) {
      if (w.history.isNotEmpty) {
        totalLoggedSets += w.history.first.sets.length;
      }
    }

    // Get distinct regions preserving order
    final List<String> distinctRegions = [];
    for (final w in _workouts) {
      final reg = w.region.trim();
      if (!distinctRegions.contains(reg)) {
        distinctRegions.add(reg);
      }
    }

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
              'Exercise Tracker',
              style: GoogleFonts.outfit(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppTokens.inkBlack,
                letterSpacing: -0.3,
              ),
            ),
            Text(
              'Progressive overload ledger',
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
                  // Hero Volume Card (TRAINING TELEMETRY)
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
                              'TRAINING TELEMETRY',
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
                                '${distinctRegions.length} Regions',
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
                                    '${_workouts.length}',
                                    style: GoogleFonts.outfit(
                                      fontSize: 26,
                                      fontWeight: FontWeight.w800,
                                      color: AppTokens.inkBlack,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Exercises',
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
                                    '$totalLoggedSets',
                                    style: GoogleFonts.outfit(
                                      fontSize: 26,
                                      fontWeight: FontWeight.w800,
                                      color: AppTokens.inkBlack,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Active Sets',
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
                                    '${distinctRegions.length}',
                                    style: GoogleFonts.outfit(
                                      fontSize: 26,
                                      fontWeight: FontWeight.w800,
                                      color: AppTokens.cyanSignal,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Muscle Splits',
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

                  // Section Title: Exercise Routine
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Exercise Routine',
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
                          '${_workouts.length} items',
                          style: GoogleFonts.outfit(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: AppTokens.warmGray,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Workouts grouped by region
                  if (_workouts.isEmpty)
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
                          const Icon(Icons.fitness_center, color: AppTokens.ashGray, size: 28),
                          const SizedBox(height: 12),
                          Text('No routines added yet', style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700, color: AppTokens.inkBlack)),
                          const SizedBox(height: 4),
                          Text(
                            'Create workout routines to log weight, reps, and volume progression.',
                            textAlign: TextAlign.center,
                            style: AppTokens.bodyMuted,
                          ),
                          const SizedBox(height: 14),
                          ElevatedButton.icon(
                            onPressed: _showAddWorkoutDialog,
                            icon: const Icon(Icons.add, size: 14, color: AppTokens.inkBlack),
                            label: Text('Add First Routine', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, color: AppTokens.inkBlack)),
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
                    ...distinctRegions.map((region) {
                      final regionRoutines = _workouts.where((w) => w.region.trim().toLowerCase() == region.toLowerCase()).toList();
                      final count = regionRoutines.length;

                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 14),
                          // Region Category Bar
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppTokens.pureWhite,
                                  borderRadius: BorderRadius.circular(AppTokens.radiusPill),
                                  border: Border.all(color: AppTokens.stoneBorder),
                                ),
                                child: Text(
                                  region.toUpperCase(),
                                  style: GoogleFonts.outfit(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 0.5,
                                    color: AppTokens.inkBlack,
                                  ),
                                ),
                              ),
                              Text(
                                '$count exercise${count > 1 ? 's' : ''}',
                                style: GoogleFonts.outfit(
                                  fontSize: 13,
                                  color: AppTokens.warmGray,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),

                          // Routine cards for this region
                          ...regionRoutines.map((routine) {
                            final latestSession = routine.history.isNotEmpty ? routine.history.first : null;
                            final setsCount = latestSession?.sets.length ?? 0;
                            final maxWeight = latestSession != null && latestSession.sets.isNotEmpty
                                ? latestSession.sets.map((s) => s.weight).reduce((a, b) => a > b ? a : b)
                                : 0.0;
                            final totalReps = latestSession != null
                                ? latestSession.sets.fold<int>(0, (sum, s) => sum + s.reps)
                                : 0;

                            return Padding(
                              padding: const EdgeInsets.only(bottom: 10),
                              child: GestureDetector(
                                onTap: () => _openSetsModal(routine),
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: AppTokens.pureWhite,
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(color: AppTokens.stoneBorder),
                                  ),
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Expanded(
                                            child: Text(
                                              routine.name,
                                              style: GoogleFonts.outfit(
                                                fontSize: 16,
                                                fontWeight: FontWeight.w700,
                                                color: AppTokens.inkBlack,
                                                letterSpacing: -0.2,
                                              ),
                                            ),
                                          ),
                                          Text(
                                            setsCount > 0 ? '$setsCount Sets · ${maxWeight.toStringAsFixed(0)}kg' : '0 Sets',
                                            style: GoogleFonts.outfit(
                                              fontSize: 15,
                                              fontWeight: FontWeight.w700,
                                              color: AppTokens.inkBlack,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 6),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            latestSession != null ? 'Recorded Today' : 'No records yet',
                                            style: GoogleFonts.outfit(
                                              fontSize: 13,
                                              color: AppTokens.warmGray,
                                            ),
                                          ),
                                          Text(
                                            '$totalReps Total Reps',
                                            style: GoogleFonts.outfit(
                                              fontSize: 13,
                                              color: AppTokens.warmGray,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          }),
                        ],
                      );
                    }),
                  const SizedBox(height: 80),
                ],
              ),
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddWorkoutDialog,
        backgroundColor: AppTokens.cyanSignal,
        elevation: 3,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTokens.radiusPill)),
        icon: const Icon(Icons.add, color: Colors.white, size: 20),
        label: Text(
          'Add Workout',
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

extension _ListFindIndex<T> on List<T> {
  int findIndex(bool Function(T) test) {
    for (int i = 0; i < length; i++) {
      if (test(this[i])) return i;
    }
    return -1;
  }
}
