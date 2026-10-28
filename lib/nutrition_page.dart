import 'package:flutter/material.dart';
import 'models.dart';
import 'database_helper.dart';

final List<FoodPreset> defaultPresets = [
  FoodPreset(
    name: 'Nasi Putih (100g)',
    calories: 130,
    protein: 2.7,
    carbs: 28,
    fat: 0.3,
  ),
  FoodPreset(
    name: 'Roti Tawar (100g)',
    calories: 265,
    protein: 9,
    carbs: 49,
    fat: 3,
  ),
  FoodPreset(
    name: 'Mie Instan (Porsi)',
    calories: 380,
    protein: 8,
    carbs: 54,
    fat: 14,
  ),
];

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
    this.burnedCalories = 0,
  });

  @override
  State<NutritionPage> createState() => _NutritionPageState();
}

class _NutritionPageState extends State<NutritionPage> {
  List<FoodEntry> _entries = [];
  List<FoodPreset> _presets = [];
  double _totalCal = 0, _totalProt = 0, _totalCarb = 0, _totalFat = 0;

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  Future<void> _loadAll() async {
    await _loadEntries();
    await _loadPresets();
  }

  Future<void> _loadPresets() async {
    final list = await DatabaseHelper.instance.getAllPresets();
    if (list.isEmpty) {
      // Seed default presets if DB is empty
      for (var p in defaultPresets) {
        await DatabaseHelper.instance.insertPreset(p);
      }
      final seededList = await DatabaseHelper.instance.getAllPresets();
      setState(() {
        _presets = seededList;
      });
    } else {
      setState(() {
        _presets = list;
      });
    }
  }

  Future<void> _loadEntries() async {
    final String today = DateTime.now().toIso8601String().split('T')[0];
    final list = await DatabaseHelper.instance.getEntriesByDate(today);
    setState(() {
      _entries = list;
      _calculateTotals();
    });
  }

  void _calculateTotals() {
    _totalCal = _entries.fold(0.0, (sum, item) => sum + item.calories);
    _totalProt = _entries.fold(0.0, (sum, item) => sum + item.protein);
    _totalCarb = _entries.fold(0.0, (sum, item) => sum + item.carbs);
    _totalFat = _entries.fold(0.0, (sum, item) => sum + item.fat);
  }

  Future<void> _addEntry(FoodEntry entry) async {
    final String today = DateTime.now().toIso8601String().split('T')[0];
    final entryWithDate = FoodEntry(
      name: entry.name,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
      date: today,
    );
    await DatabaseHelper.instance.insertEntry(entryWithDate);
    await _loadEntries();
  }

  Future<void> _deleteEntry(int index) async {
    final entry = _entries[index];
    if (entry.id != null) {
      await DatabaseHelper.instance.deleteEntry(entry.id!);
      await _loadEntries();
    }
  }

  void _showAddDialog() {
    bool isManual = false;
    if (_presets.isEmpty) return;
    FoodPreset selectedPreset = _presets[0];
    final weightController = TextEditingController();
    final nameController = TextEditingController();
    final calController = TextEditingController();
    final protController = TextEditingController();
    final carbController = TextEditingController();
    final fatController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          return AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            title: const Text('Add Nutrition Entry'),
            content: SingleChildScrollView(
              child: SizedBox(
                width: MediaQuery.of(context).size.width,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SegmentedButton<bool>(
                      segments: const [
                        ButtonSegment(
                          value: false,
                          label: Text('Preset'),
                          icon: Icon(Icons.list),
                        ),
                        ButtonSegment(
                          value: true,
                          label: Text('Manual'),
                          icon: Icon(Icons.edit),
                        ),
                      ],
                      selected: {isManual},
                      onSelectionChanged: (val) =>
                          setModalState(() => isManual = val.first),
                    ),
                    const SizedBox(height: 16),
                    if (isManual) ...[
                      TextField(
                        controller: nameController,
                        decoration: const InputDecoration(labelText: 'Name'),
                      ),
                      TextField(
                        controller: calController,
                        decoration: const InputDecoration(
                          labelText: 'Calories (kcal)',
                        ),
                        keyboardType: TextInputType.number,
                      ),
                      TextField(
                        controller: protController,
                        decoration: const InputDecoration(
                          labelText: 'Protein (g)',
                        ),
                        keyboardType: TextInputType.number,
                      ),
                      TextField(
                        controller: carbController,
                        decoration: const InputDecoration(
                          labelText: 'Carbs (g)',
                        ),
                        keyboardType: TextInputType.number,
                      ),
                      TextField(
                        controller: fatController,
                        decoration: const InputDecoration(labelText: 'Fat (g)'),
                        keyboardType: TextInputType.number,
                      ),
                    ] else ...[
                      Autocomplete<FoodPreset>(
                        displayStringForOption: (FoodPreset option) =>
                            option.name,
                        optionsBuilder: (TextEditingValue textEditingValue) {
                          if (textEditingValue.text == '') {
                            return _presets;
                          }
                          return _presets.where(
                            (FoodPreset option) => option.name
                                .toLowerCase()
                                .contains(textEditingValue.text.toLowerCase()),
                          );
                        },
                        onSelected: (FoodPreset selection) {
                          setModalState(() => selectedPreset = selection);
                        },
                        fieldViewBuilder:
                            (context, controller, focusNode, onFieldSubmitted) {
                              return TextField(
                                controller: controller,
                                focusNode: focusNode,
                                decoration: InputDecoration(
                                  labelText: 'Search Food',
                                  prefixIcon: const Icon(
                                    Icons.search,
                                    color: Color(0xFF2ECC71),
                                  ),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 12,
                                  ),
                                ),
                              );
                            },
                        optionsViewBuilder: (context, onSelected, options) {
                          return Align(
                            alignment: Alignment.topLeft,
                            child: Material(
                              elevation: 8,
                              borderRadius: BorderRadius.circular(12),
                              child: Container(
                                width:
                                    MediaQuery.of(context).size.width *
                                    0.7, // Fit within dialog
                                constraints: const BoxConstraints(
                                  maxHeight: 200,
                                ),
                                child: ListView.builder(
                                  padding: EdgeInsets.zero,
                                  shrinkWrap: true,
                                  itemCount: options.length,
                                  itemBuilder: (BuildContext context, int index) {
                                    final FoodPreset option = options.elementAt(
                                      index,
                                    );
                                    return ListTile(
                                      title: Text(
                                        option.name,
                                        style: const TextStyle(fontSize: 14),
                                      ),
                                      subtitle: Text(
                                        '${option.calories.toStringAsFixed(0)} kcal | P: ${option.protein.toStringAsFixed(0)}g',
                                        style: const TextStyle(fontSize: 11),
                                      ),
                                      onTap: () => onSelected(option),
                                      dense: true,
                                    );
                                  },
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: weightController,
                        decoration: InputDecoration(
                          labelText: 'Weight (grams)',
                          suffixText: 'g',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        keyboardType: TextInputType.number,
                        onChanged: (val) => setModalState(() {}),
                      ),
                      const SizedBox(height: 16),
                      _buildPreview(
                        selectedPreset,
                        double.tryParse(weightController.text) ?? 0,
                      ),
                    ],
                  ],
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: () {
                  FoodEntry entry;
                  if (isManual) {
                    entry = FoodEntry(
                      name: nameController.text.isEmpty
                          ? 'Untitled'
                          : nameController.text,
                      calories: double.tryParse(calController.text) ?? 0,
                      protein: double.tryParse(protController.text) ?? 0,
                      carbs: double.tryParse(carbController.text) ?? 0,
                      fat: double.tryParse(fatController.text) ?? 0,
                    );
                  } else {
                    double weight = double.tryParse(weightController.text) ?? 0;
                    double factor = weight / 100;
                    entry = FoodEntry(
                      name: '${selectedPreset.name} (${weight}g)',
                      calories: selectedPreset.calories * factor,
                      protein: selectedPreset.protein * factor,
                      carbs: selectedPreset.carbs * factor,
                      fat: selectedPreset.fat * factor,
                    );
                  }
                  _addEntry(entry);
                  Navigator.pop(context);
                },
                child: const Text('Add Entry'),
              ),
            ],
          );
        },
      ),
    );
  }

  void _showManagePresets() {
    String searchQuery = '';
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          final filteredPresets = _presets
              .where(
                (p) => p.name.toLowerCase().contains(searchQuery.toLowerCase()),
              )
              .toList();

          return Container(
            decoration: const BoxDecoration(
              color: Color(0xFF1A1A1A),
              borderRadius: BorderRadius.vertical(top: Radius.circular(25)),
            ),
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).viewInsets.bottom,
              left: 20,
              right: 20,
              top: 20,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Manage Presets',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    IconButton(
                      onPressed: () => _showEditPresetDialog(
                        null,
                      ).then((_) => setModalState(() {})),
                      icon: const Icon(
                        Icons.add_circle,
                        color: Color(0xFFBBF246),
                        size: 30,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Padding(
                  padding: const EdgeInsets.only(bottom: 15),
                  child: TextField(
                    onChanged: (val) => setModalState(() => searchQuery = val),
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'Search presets...',
                      hintStyle: TextStyle(
                        color: Colors.white.withValues(alpha: 0.3),
                      ),
                      prefixIcon: const Icon(
                        Icons.search,
                        color: Color(0xFF2ECC71),
                      ),
                      filled: true,
                      fillColor: Colors.white.withValues(alpha: 0.05),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(15),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
                Flexible(
                  child: filteredPresets.isEmpty
                      ? Padding(
                          padding: const EdgeInsets.symmetric(vertical: 40),
                          child: Center(
                            child: Text(
                              searchQuery.isEmpty
                                  ? 'No presets available. Add one!'
                                  : 'No presets match your search.',
                              style: const TextStyle(color: Colors.white54),
                            ),
                          ),
                        )
                      : ListView.builder(
                          shrinkWrap: true,
                          itemCount: filteredPresets.length,
                          itemBuilder: (context, index) {
                            final p = filteredPresets[index];
                            final originalIndex = _presets.indexOf(p);
                            return ListTile(
                              contentPadding: EdgeInsets.zero,
                              title: Text(
                                p.name,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                              subtitle: Text(
                                'Cal: ${p.calories.toStringAsFixed(0)} | P: ${p.protein.toStringAsFixed(0)} | C: ${p.carbs.toStringAsFixed(0)} | F: ${p.fat.toStringAsFixed(0)}',
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.5),
                                ),
                              ),
                              trailing: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  IconButton(
                                    icon: const Icon(
                                      Icons.edit,
                                      color: Color(0xFF2ECC71),
                                    ),
                                    onPressed: () => _showEditPresetDialog(
                                      originalIndex,
                                    ).then((_) => setModalState(() {})),
                                  ),
                                  IconButton(
                                    icon: const Icon(
                                      Icons.delete,
                                      color: Colors.redAccent,
                                    ),
                                    onPressed: () async {
                                      if (p.id != null) {
                                        await DatabaseHelper.instance
                                            .deletePreset(p.id!);
                                        await _loadPresets();
                                        setModalState(() {});
                                      }
                                    },
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                ),
                const SizedBox(height: 20),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _showEditPresetDialog(int? index) async {
    final nameController = TextEditingController(
      text: index != null ? _presets[index].name : '',
    );
    final calController = TextEditingController(
      text: index != null ? _presets[index].calories.toString() : '',
    );
    final protController = TextEditingController(
      text: index != null ? _presets[index].protein.toString() : '',
    );
    final carbController = TextEditingController(
      text: index != null ? _presets[index].carbs.toString() : '',
    );
    final fatController = TextEditingController(
      text: index != null ? _presets[index].fat.toString() : '',
    );

    await showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(index == null ? 'New Preset' : 'Edit Preset'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameController,
                  decoration: const InputDecoration(labelText: 'Name'),
                ),
                TextField(
                  controller: calController,
                  decoration: const InputDecoration(
                    labelText: 'Calories (per 100g)',
                  ),
                  keyboardType: TextInputType.number,
                ),
                TextField(
                  controller: protController,
                  decoration: const InputDecoration(
                    labelText: 'Protein (per 100g)',
                  ),
                  keyboardType: TextInputType.number,
                ),
                TextField(
                  controller: carbController,
                  decoration: const InputDecoration(
                    labelText: 'Carbs (per 100g)',
                  ),
                  keyboardType: TextInputType.number,
                ),
                TextField(
                  controller: fatController,
                  decoration: const InputDecoration(
                    labelText: 'Fat (per 100g)',
                  ),
                  keyboardType: TextInputType.number,
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                final newPreset = FoodPreset(
                  id: index != null ? _presets[index].id : null,
                  name: nameController.text,
                  calories: double.tryParse(calController.text) ?? 0,
                  protein: double.tryParse(protController.text) ?? 0,
                  carbs: double.tryParse(carbController.text) ?? 0,
                  fat: double.tryParse(fatController.text) ?? 0,
                );

                if (index == null) {
                  await DatabaseHelper.instance.insertPreset(newPreset);
                } else {
                  await DatabaseHelper.instance.updatePreset(newPreset);
                }

                await _loadPresets();
                if (mounted) Navigator.pop(context);
              },
              child: const Text('Save'),
            ),
          ],
        );
      },
    );
  }

  Widget _buildPreview(FoodPreset p, double weight) {
    double factor = weight / 100;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF2ECC71).withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(15),
        border: Border.all(
          color: const Color(0xFF2ECC71).withValues(alpha: 0.1),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              const Icon(
                Icons.analytics_outlined,
                color: Color(0xFF2ECC71),
                size: 20,
              ),
              const SizedBox(width: 8),
              const Text(
                'Selection Preview',
                style: TextStyle(
                  color: Color(0xFFBBF246),
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _previewRow(
            'Calories',
            '${(p.calories * factor).toStringAsFixed(1)} kcal',
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: Divider(height: 1, color: Colors.white12),
          ),
          _previewRow(
            'Macros',
            'P: ${(p.protein * factor).toStringAsFixed(1)}g | C: ${(p.carbs * factor).toStringAsFixed(1)}g | F: ${(p.fat * factor).toStringAsFixed(1)}g',
          ),
        ],
      ),
    );
  }

  Widget _previewRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
        ),
        Text(value, style: const TextStyle(fontSize: 12)),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F0F),
      appBar: AppBar(
        title: const Text(
          'Nutrition Diary',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: _showManagePresets,
            icon: const Icon(Icons.settings_suggest_rounded),
            tooltip: 'Manage Presets',
          ),
          const SizedBox(width: 10),
        ],
      ),
      body: Column(
        children: [
          _buildMacroHeader(),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 25, vertical: 10),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Food Log',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white70,
                ),
              ),
            ),
          ),
          Expanded(
            child: _entries.isEmpty
                ? const Center(
                    child: Text(
                      'Add your first meal!',
                      style: TextStyle(color: Colors.grey),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: _entries.length,
                    itemBuilder: (context, index) {
                      final item = _entries[index];
                      return Card(
                        elevation: 0,
                        color: const Color(0xFF1A1A1A),
                        margin: const EdgeInsets.only(bottom: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(15),
                          side: BorderSide(
                            color: Colors.white.withValues(alpha: 0.05),
                          ),
                        ),
                        child: ListTile(
                          title: Text(
                            item.name,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          subtitle: Text(
                            'P: ${item.protein.toStringAsFixed(0)}g | C: ${item.carbs.toStringAsFixed(0)}g | F: ${item.fat.toStringAsFixed(0)}g',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.5),
                            ),
                          ),
                          trailing: Text(
                            '${item.calories.toStringAsFixed(0)} kcal',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Color(0xFFBBF246),
                            ),
                          ),
                          onLongPress: () => _deleteEntry(index),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddDialog,
        label: const Text('Log Food'),
        icon: const Icon(Icons.add_shopping_cart),
        backgroundColor: const Color(0xFFBBF246),
        foregroundColor: Colors.black,
      ),
    );
  }

  Widget _buildMacroHeader() {
    return Container(
      margin: const EdgeInsets.all(20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(25),
      ),
      child: Column(
        children: [
          _macroProgress(
            'Calories',
            _totalCal,
            widget.calGoal + widget.burnedCalories,
            const Color(0xFF2ECC71),
            'kcal',
          ),
          const Divider(color: Colors.white24, height: 24),
          Row(
            children: [
              Expanded(
                child: _macroProgress(
                  'Protein',
                  _totalProt,
                  widget.protGoal,
                  const Color(0xFF2ECC71),
                  'g',
                  isCompact: true,
                ),
              ),
              const SizedBox(width: 15),
              Expanded(
                child: _macroProgress(
                  'Carbs',
                  _totalCarb,
                  widget.carbGoal,
                  const Color(0xFF2ECC71),
                  'g',
                  isCompact: true,
                ),
              ),
              const SizedBox(width: 15),
              Expanded(
                child: _macroProgress(
                  'Fat',
                  _totalFat,
                  widget.fatGoal,
                  const Color(0xFF2ECC71),
                  'g',
                  isCompact: true,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _macroProgress(
    String label,
    double current,
    double goal,
    Color color,
    String unit, {
    bool isCompact = false,
  }) {
    double progress = (current / goal).clamp(0.0, 1.0);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: TextStyle(
                color: Colors.white70,
                fontSize: isCompact ? 10 : 12,
              ),
            ),
            Text(
              '${current.toStringAsFixed(0)}/${goal.toStringAsFixed(0)} $unit',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 10,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: LinearProgressIndicator(
            value: progress,
            backgroundColor: Colors.white12,
            valueColor: AlwaysStoppedAnimation<Color>(color),
            minHeight: isCompact ? 4 : 8,
          ),
        ),
      ],
    );
  }
}
