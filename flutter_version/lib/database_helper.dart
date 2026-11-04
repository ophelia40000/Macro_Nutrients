import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'models.dart';

class DatabaseHelper {
  static final DatabaseHelper instance = DatabaseHelper._init();
  static Database? _database;

  DatabaseHelper._init();

  Future<Database> get database async {
    if (kIsWeb) {
      throw UnsupportedError('sqflite database is not supported on web. Use SharedPreferences.');
    }
    if (_database != null) return _database!;
    _database = await _initDB('nutrition_v2.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = p.join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 1,
      onCreate: _createDB,
    );
  }

  Future _createDB(Database db, int version) async {
    await db.execute('''
      CREATE TABLE entries (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        calories REAL NOT NULL,
        protein REAL NOT NULL,
        carbs REAL NOT NULL,
        fat REAL NOT NULL,
        date TEXT
      )
    ''');

    await db.execute('''
      CREATE TABLE presets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        calories REAL NOT NULL,
        protein REAL NOT NULL,
        carbs REAL NOT NULL,
        fat REAL NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE summaries (
        date TEXT PRIMARY KEY,
        calories REAL NOT NULL,
        protein REAL NOT NULL,
        carbs REAL NOT NULL,
        fat REAL NOT NULL,
        burnedCalories REAL NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE progress (
        id TEXT PRIMARY KEY,
        imagePath TEXT NOT NULL,
        date TEXT NOT NULL,
        weight REAL NOT NULL,
        isAsset INTEGER NOT NULL
      )
    ''');

    // Seed initial presets
    await db.insert('presets', {'id': 'p1', 'name': 'Nasi Putih (100g)', 'calories': 130.0, 'protein': 2.7, 'carbs': 28.2, 'fat': 0.3});
    await db.insert('presets', {'id': 'p2', 'name': 'Roti Tawar (100g)', 'calories': 265.0, 'protein': 9.0, 'carbs': 49.0, 'fat': 3.2});
    await db.insert('presets', {'id': 'p3', 'name': 'Mie Instan (Porsi)', 'calories': 380.0, 'protein': 8.0, 'carbs': 54.0, 'fat': 14.0});

    // Seed default entries
    final today = DateTime.now().toIso8601String().split('T')[0];
    await db.insert('entries', {'id': '1', 'name': 'Nasi Putih (300g)', 'calories': 390.0, 'protein': 5.0, 'carbs': 85.0, 'fat': 1.0, 'date': today});
    await db.insert('entries', {'id': '2', 'name': 'Kakap', 'calories': 275.0, 'protein': 21.0, 'carbs': 11.0, 'fat': 16.0, 'date': today});
    await db.insert('entries', {'id': '3', 'name': 'Naspad', 'calories': 1020.0, 'protein': 71.0, 'carbs': 73.0, 'fat': 50.0, 'date': today});
    await db.insert('entries', {'id': '4', 'name': 'dada ayam mentah (250g)', 'calories': 300.0, 'protein': 56.0, 'carbs': 0.0, 'fat': 7.0, 'date': today});
    await db.insert('entries', {'id': '5', 'name': 'Nasi Putih (200g)', 'calories': 260.0, 'protein': 3.0, 'carbs': 56.0, 'fat': 1.0, 'date': today});

    // Seed default progress photos
    await db.insert('progress', {'id': 'prog_1', 'imagePath': 'assets/images/progress_1.jpg', 'date': '12 Okt 2024', 'weight': 74.5, 'isAsset': 1});
    await db.insert('progress', {'id': 'prog_2', 'imagePath': 'assets/images/progress_2.jpg', 'date': '02 Nov 2024', 'weight': 72.8, 'isAsset': 1});
    await db.insert('progress', {'id': 'prog_3', 'imagePath': 'assets/images/progress_3.jpg', 'date': '24 Nov 2024', 'weight': 70.2, 'isAsset': 1});
  }

  // --- WEB SHARED PREFERENCES KEYS ---
  static const String _webEntriesKey = 'macro_web_entries_v1';
  static const String _webPresetsKey = 'macro_web_presets_v1';
  static const String _webProgressKey = 'macro_web_progress_v1';

  List<FoodEntry> _getDefaultEntries() {
    final today = DateTime.now().toIso8601String().split('T')[0];
    return [
      FoodEntry(id: '1', name: 'Nasi Putih (300g)', calories: 390.0, protein: 5.0, carbs: 85.0, fat: 1.0, date: today),
      FoodEntry(id: '2', name: 'Kakap', calories: 275.0, protein: 21.0, carbs: 11.0, fat: 16.0, date: today),
      FoodEntry(id: '3', name: 'Naspad', calories: 1020.0, protein: 71.0, carbs: 73.0, fat: 50.0, date: today),
      FoodEntry(id: '4', name: 'dada ayam mentah (250g)', calories: 300.0, protein: 56.0, carbs: 0.0, fat: 7.0, date: today),
      FoodEntry(id: '5', name: 'Nasi Putih (200g)', calories: 260.0, protein: 3.0, carbs: 56.0, fat: 1.0, date: today),
    ];
  }

  List<FoodPreset> _getDefaultPresets() {
    return [
      FoodPreset(id: 'p1', name: 'Nasi Putih (100g)', calories: 130.0, protein: 2.7, carbs: 28.2, fat: 0.3),
      FoodPreset(id: 'p2', name: 'Roti Tawar (100g)', calories: 265.0, protein: 9.0, carbs: 49.0, fat: 3.2),
      FoodPreset(id: 'p3', name: 'Mie Instan (Porsi)', calories: 380.0, protein: 8.0, carbs: 54.0, fat: 14.0),
    ];
  }

  List<ProgressPhoto> _getDefaultProgressPhotos() {
    return [
      ProgressPhoto(id: 'prog_1', imagePath: 'assets/images/progress_1.jpg', date: '12 Okt 2024', weight: 74.5, isAsset: true),
      ProgressPhoto(id: 'prog_2', imagePath: 'assets/images/progress_2.jpg', date: '02 Nov 2024', weight: 72.8, isAsset: true),
      ProgressPhoto(id: 'prog_3', imagePath: 'assets/images/progress_3.jpg', date: '24 Nov 2024', weight: 70.2, isAsset: true),
    ];
  }

  // --- ENTRIES ---
  Future<List<FoodEntry>> getTodayEntries() async {
    final today = DateTime.now().toIso8601String().split('T')[0];

    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      final str = prefs.getString(_webEntriesKey);
      if (str == null || str.isEmpty) {
        final defs = _getDefaultEntries();
        await prefs.setString(_webEntriesKey, jsonEncode(defs.map((e) => e.toMap()).toList()));
        return defs;
      }
      try {
        final List<dynamic> list = jsonDecode(str);
        final all = list.map((m) => FoodEntry.fromMap(m as Map<String, dynamic>)).toList();
        return all.where((e) => e.date == today).toList();
      } catch (_) {
        return _getDefaultEntries();
      }
    }

    final db = await instance.database;
    final maps = await db.query(
      'entries',
      where: 'date = ?',
      whereArgs: [today],
      orderBy: 'id DESC',
    );
    return maps.map((m) => FoodEntry.fromMap(m)).toList();
  }

  Future<void> addEntry(FoodEntry entry) async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      final all = await getTodayEntries();
      final updated = [entry, ...all.where((e) => e.id != entry.id)];
      await prefs.setString(_webEntriesKey, jsonEncode(updated.map((e) => e.toMap()).toList()));
      return;
    }

    final db = await instance.database;
    await db.insert('entries', entry.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<void> deleteEntry(String id) async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      final all = await getTodayEntries();
      final updated = all.where((e) => e.id != id).toList();
      await prefs.setString(_webEntriesKey, jsonEncode(updated.map((e) => e.toMap()).toList()));
      return;
    }

    final db = await instance.database;
    await db.delete('entries', where: 'id = ?', whereArgs: [id]);
  }

  Future<void> clearEntries() async {
    final today = DateTime.now().toIso8601String().split('T')[0];
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      final all = await getTodayEntries();
      final updated = all.where((e) => e.date != today).toList();
      await prefs.setString(_webEntriesKey, jsonEncode(updated.map((e) => e.toMap()).toList()));
      return;
    }

    final db = await instance.database;
    await db.delete('entries', where: 'date = ?', whereArgs: [today]);
  }

  // --- PRESETS ---
  Future<List<FoodPreset>> getPresets() async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      final str = prefs.getString(_webPresetsKey);
      if (str == null || str.isEmpty) {
        final defs = _getDefaultPresets();
        await prefs.setString(_webPresetsKey, jsonEncode(defs.map((p) => p.toMap()).toList()));
        return defs;
      }
      try {
        final List<dynamic> list = jsonDecode(str);
        return list.map((m) => FoodPreset.fromMap(m as Map<String, dynamic>)).toList();
      } catch (_) {
        return _getDefaultPresets();
      }
    }

    final db = await instance.database;
    final maps = await db.query('presets', orderBy: 'name ASC');
    return maps.map((m) => FoodPreset.fromMap(m)).toList();
  }

  Future<void> addPreset(FoodPreset preset) async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      final all = await getPresets();
      final updated = [preset, ...all.where((p) => p.name != preset.name)];
      await prefs.setString(_webPresetsKey, jsonEncode(updated.map((p) => p.toMap()).toList()));
      return;
    }

    final db = await instance.database;
    await db.insert('presets', preset.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<void> deletePreset(String id) async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      final all = await getPresets();
      final updated = all.where((p) => p.id != id && p.name != id).toList();
      await prefs.setString(_webPresetsKey, jsonEncode(updated.map((p) => p.toMap()).toList()));
      return;
    }

    final db = await instance.database;
    await db.delete('presets', where: 'id = ?', whereArgs: [id]);
  }

  // --- SUMMARIES ---
  Future<void> upsertSummary(DailySummary summary) async {
    if (kIsWeb) return;
    final db = await instance.database;
    await db.insert('summaries', summary.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  // --- PROGRESS PHOTOS ---
  Future<List<ProgressPhoto>> getProgressPhotos() async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      final str = prefs.getString(_webProgressKey);
      if (str == null || str.isEmpty) {
        final defs = _getDefaultProgressPhotos();
        await prefs.setString(_webProgressKey, jsonEncode(defs.map((p) => p.toMap()).toList()));
        return defs;
      }
      try {
        final List<dynamic> list = jsonDecode(str);
        return list.map((m) => ProgressPhoto.fromMap(m as Map<String, dynamic>)).toList();
      } catch (_) {
        return _getDefaultProgressPhotos();
      }
    }

    final db = await instance.database;
    final maps = await db.query('progress', orderBy: 'id ASC');
    return maps.map((m) => ProgressPhoto.fromMap(m)).toList();
  }

  Future<void> addProgressPhoto(ProgressPhoto photo) async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      final all = await getProgressPhotos();
      final updated = [...all, photo];
      await prefs.setString(_webProgressKey, jsonEncode(updated.map((p) => p.toMap()).toList()));
      return;
    }

    final db = await instance.database;
    await db.insert('progress', photo.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<void> deleteProgressPhoto(String id) async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      final all = await getProgressPhotos();
      final updated = all.where((p) => p.id != id).toList();
      await prefs.setString(_webProgressKey, jsonEncode(updated.map((p) => p.toMap()).toList()));
      return;
    }

    final db = await instance.database;
    await db.delete('progress', where: 'id = ?', whereArgs: [id]);
  }

  // --- WORKOUTS ---
  static const String _workoutsKey = 'workout_routines_v1';

  static List<WorkoutRoutine> getDefaultWorkouts() {
    final today = DateTime.now().toIso8601String().split('T')[0];
    return [
      WorkoutRoutine(
        id: 'ex_1',
        name: 'Incline Dumbbell Press',
        region: 'Chest',
        history: [
          WorkoutSession(
            date: today,
            sets: [
              WorkoutSet(weight: 24, reps: 12),
              WorkoutSet(weight: 24, reps: 10),
              WorkoutSet(weight: 24, reps: 8),
            ],
          ),
        ],
      ),
      WorkoutRoutine(
        id: 'ex_2',
        name: 'Lat Pulldown',
        region: 'Back',
        history: [
          WorkoutSession(
            date: today,
            sets: [
              WorkoutSet(weight: 55, reps: 12),
              WorkoutSet(weight: 55, reps: 10),
              WorkoutSet(weight: 55, reps: 10),
            ],
          ),
        ],
      ),
    ];
  }

  Future<List<WorkoutRoutine>> getWorkouts() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonStr = prefs.getString(_workoutsKey);
    if (jsonStr == null || jsonStr.isEmpty) {
      final defaults = getDefaultWorkouts();
      await saveWorkouts(defaults);
      return defaults;
    }
    try {
      final List<dynamic> list = jsonDecode(jsonStr);
      return list.map((item) => WorkoutRoutine.fromMap(item as Map<String, dynamic>)).toList();
    } catch (_) {
      return getDefaultWorkouts();
    }
  }

  Future<void> saveWorkouts(List<WorkoutRoutine> workouts) async {
    final prefs = await SharedPreferences.getInstance();
    final jsonStr = jsonEncode(workouts.map((w) => w.toMap()).toList());
    await prefs.setString(_workoutsKey, jsonStr);
  }

  // --- GOALS ---
  static const String _goalsKey = 'user_goals_v1';

  Future<UserGoals> getGoals() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonStr = prefs.getString(_goalsKey);
    if (jsonStr == null || jsonStr.isEmpty) {
      final defaults = UserGoals();
      await saveGoals(defaults);
      return defaults;
    }
    try {
      final Map<String, dynamic> map = jsonDecode(jsonStr);
      return UserGoals.fromMap(map);
    } catch (_) {
      return UserGoals();
    }
  }

  Future<void> saveGoals(UserGoals goals) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_goalsKey, jsonEncode(goals.toMap()));
  }
}
