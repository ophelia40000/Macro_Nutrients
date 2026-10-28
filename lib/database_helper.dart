import 'dart:async';

import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';
import 'models.dart';

class DatabaseHelper {
  static final DatabaseHelper instance = DatabaseHelper._init();
  static Database? _database;

  DatabaseHelper._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('nutrition.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 2,
      onCreate: _createDB,
      onUpgrade: _onUpgrade,
    );
  }

  Future _onUpgrade(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      await _createProgressTable(db);
    }
  }

  Future _createDB(Database db, int version) async {
    await _createPresetsTable(db);
    await _createEntriesTable(db);
    await _createSummariesTable(db);
    await _createProgressTable(db);
  }

  Future _createPresetsTable(Database db) async {
    const idType = 'INTEGER PRIMARY KEY AUTOINCREMENT';
    const textType = 'TEXT NOT NULL';
    const realType = 'REAL NOT NULL';
    await db.execute('''
CREATE TABLE presets (
  id $idType,
  name $textType,
  calories $realType,
  protein $realType,
  carbs $realType,
  fat $realType
)
''');
  }

  Future _createEntriesTable(Database db) async {
    const idType = 'INTEGER PRIMARY KEY AUTOINCREMENT';
    const textType = 'TEXT NOT NULL';
    const realType = 'REAL NOT NULL';
    await db.execute('''
CREATE TABLE entries (
  id $idType,
  name $textType,
  calories $realType,
  protein $realType,
  carbs $realType,
  fat $realType,
  date $textType
)
''');
  }

  Future _createSummariesTable(Database db) async {
    const realType = 'REAL NOT NULL';
    await db.execute('''
CREATE TABLE summaries (
  date TEXT PRIMARY KEY,
  calories $realType,
  protein $realType,
  carbs $realType,
  fat $realType,
  burnedCalories $realType
)
''');
  }

  Future _createProgressTable(Database db) async {
    const idType = 'INTEGER PRIMARY KEY AUTOINCREMENT';
    const textType = 'TEXT NOT NULL';
    const realType = 'REAL NOT NULL';
    await db.execute('''
CREATE TABLE progress (
  id $idType,
  imagePath $textType,
  date $textType,
  weight $realType
)
''');
  }

  // --- Presets ---
  Future<int> insertPreset(FoodPreset preset) async {
    final db = await instance.database;
    return await db.insert('presets', preset.toMap());
  }

  Future<List<FoodPreset>> getAllPresets() async {
    final db = await instance.database;
    final result = await db.query('presets', orderBy: 'name ASC');
    return result.map((json) => FoodPreset.fromMap(json)).toList();
  }

  Future<int> updatePreset(FoodPreset preset) async {
    final db = await instance.database;
    return await db.update(
      'presets',
      preset.toMap(),
      where: 'id = ?',
      whereArgs: [preset.id],
    );
  }

  Future<int> deletePreset(int id) async {
    final db = await instance.database;
    return await db.delete('presets', where: 'id = ?', whereArgs: [id]);
  }

  // --- Entries ---
  Future<int> insertEntry(FoodEntry entry) async {
    final db = await instance.database;
    return await db.insert('entries', entry.toMap());
  }

  Future<List<FoodEntry>> getEntriesByDate(String date) async {
    final db = await instance.database;
    final result = await db.query(
      'entries',
      where: 'date = ?',
      whereArgs: [date],
      orderBy: 'id DESC',
    );
    return result.map((json) => FoodEntry.fromMap(json)).toList();
  }

  Future<int> deleteEntry(int id) async {
    final db = await instance.database;
    return await db.delete('entries', where: 'id = ?', whereArgs: [id]);
  }

  Future<int> clearEntries() async {
    final db = await instance.database;
    return await db.delete('entries');
  }

  // --- Summaries ---
  Future<int> upsertSummary(DailySummary summary) async {
    final db = await instance.database;
    return await db.insert(
      'summaries',
      summary.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<DailySummary?> getSummary(String date) async {
    final db = await instance.database;
    final maps = await db.query(
      'summaries',
      where: 'date = ?',
      whereArgs: [date],
    );

    if (maps.isNotEmpty) {
      return DailySummary.fromMap(maps.first);
    } else {
      return null;
    }
  }

  Future<List<DailySummary>> getAllSummaries() async {
    final db = await instance.database;
    final result = await db.query('summaries', orderBy: 'date DESC');
    return result.map((json) => DailySummary.fromMap(json)).toList();
  }

  // --- Progress Photos ---
  Future<int> insertProgressPhoto(ProgressPhoto photo) async {
    final db = await instance.database;
    return await db.insert('progress', photo.toMap());
  }

  Future<List<ProgressPhoto>> getAllProgressPhotos() async {
    final db = await instance.database;
    final result = await db.query('progress', orderBy: 'date DESC');
    return result.map((json) => ProgressPhoto.fromMap(json)).toList();
  }

  Future<int> deleteProgressPhoto(int id) async {
    final db = await instance.database;
    return await db.delete('progress', where: 'id = ?', whereArgs: [id]);
  }

  Future<int> updateWeightForDate(String datePrefix, double weight) async {
    final db = await instance.database;
    return await db.update(
      'progress',
      {'weight': weight},
      where: 'date LIKE ?',
      whereArgs: ['$datePrefix%'],
    );
  }

  Future close() async {
    final db = await instance.database;
    db.close();
  }
}
