import 'dart:convert';

class DailySummary {
  final String date;
  final double calories;
  final double protein;
  final double carbs;
  final double fat;
  final double burnedCalories;

  DailySummary({
    required this.date,
    required this.calories,
    required this.protein,
    required this.carbs,
    required this.fat,
    this.burnedCalories = 0,
  });

  Map<String, dynamic> toMap() => {
        'date': date,
        'calories': calories,
        'protein': protein,
        'carbs': carbs,
        'fat': fat,
        'burnedCalories': burnedCalories,
      };

  factory DailySummary.fromMap(Map<String, dynamic> map) => DailySummary(
        date: map['date'] as String,
        calories: (map['calories'] as num).toDouble(),
        protein: (map['protein'] as num).toDouble(),
        carbs: (map['carbs'] as num).toDouble(),
        fat: (map['fat'] as num).toDouble(),
        burnedCalories: (map['burnedCalories'] as num?)?.toDouble() ?? 0,
      );

  Map<String, dynamic> toJson() => toMap();
  factory DailySummary.fromJson(Map<String, dynamic> json) => DailySummary.fromMap(json);
}

class FoodEntry {
  final String id;
  final String name;
  final double calories;
  final double protein;
  final double carbs;
  final double fat;
  final String? date;

  FoodEntry({
    required this.id,
    required this.name,
    required this.calories,
    required this.protein,
    required this.carbs,
    required this.fat,
    this.date,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'name': name,
        'calories': calories,
        'protein': protein,
        'carbs': carbs,
        'fat': fat,
        'date': date,
      };

  factory FoodEntry.fromMap(Map<String, dynamic> map) => FoodEntry(
        id: map['id']?.toString() ?? DateTime.now().millisecondsSinceEpoch.toString(),
        name: map['name'] as String,
        calories: (map['calories'] as num).toDouble(),
        protein: (map['protein'] as num).toDouble(),
        carbs: (map['carbs'] as num).toDouble(),
        fat: (map['fat'] as num).toDouble(),
        date: map['date'] as String?,
      );

  Map<String, dynamic> toJson() => toMap();
  factory FoodEntry.fromJson(Map<String, dynamic> json) => FoodEntry.fromMap(json);
}

class FoodPreset {
  final String? id;
  final String name;
  final double calories;
  final double protein;
  final double carbs;
  final double fat;

  FoodPreset({
    this.id,
    required this.name,
    required this.calories,
    required this.protein,
    required this.carbs,
    required this.fat,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'name': name,
        'calories': calories,
        'protein': protein,
        'carbs': carbs,
        'fat': fat,
      };

  factory FoodPreset.fromMap(Map<String, dynamic> map) => FoodPreset(
        id: map['id']?.toString(),
        name: map['name'] as String,
        calories: (map['calories'] as num).toDouble(),
        protein: (map['protein'] as num).toDouble(),
        carbs: (map['carbs'] as num).toDouble(),
        fat: (map['fat'] as num).toDouble(),
      );

  Map<String, dynamic> toJson() => toMap();
  factory FoodPreset.fromJson(Map<String, dynamic> json) => FoodPreset.fromMap(json);
}

class ProgressPhoto {
  final String id;
  final String imagePath;
  final String date;
  final double weight;
  final bool isAsset;

  ProgressPhoto({
    required this.id,
    required this.imagePath,
    required this.date,
    required this.weight,
    this.isAsset = false,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'imagePath': imagePath,
        'date': date,
        'weight': weight,
        'isAsset': isAsset ? 1 : 0,
      };

  factory ProgressPhoto.fromMap(Map<String, dynamic> map) => ProgressPhoto(
        id: map['id']?.toString() ?? DateTime.now().millisecondsSinceEpoch.toString(),
        imagePath: map['imagePath'] as String,
        date: map['date'] as String,
        weight: (map['weight'] as num).toDouble(),
        isAsset: (map['isAsset'] == 1 || map['isAsset'] == true),
      );

  Map<String, dynamic> toJson() => toMap();
  factory ProgressPhoto.fromJson(Map<String, dynamic> json) => ProgressPhoto.fromMap(json);
}

class WorkoutSet {
  final double weight;
  final int reps;

  WorkoutSet({required this.weight, required this.reps});

  Map<String, dynamic> toMap() => {
        'weight': weight,
        'reps': reps,
      };

  factory WorkoutSet.fromMap(Map<String, dynamic> map) => WorkoutSet(
        weight: (map['weight'] as num).toDouble(),
        reps: (map['reps'] as num).toInt(),
      );
}

class WorkoutSession {
  final String date;
  final List<WorkoutSet> sets;

  WorkoutSession({required this.date, required this.sets});

  Map<String, dynamic> toMap() => {
        'date': date,
        'sets': sets.map((s) => s.toMap()).toList(),
      };

  factory WorkoutSession.fromMap(Map<String, dynamic> map) => WorkoutSession(
        date: map['date'] as String,
        sets: (map['sets'] as List<dynamic>?)
                ?.map((s) => WorkoutSet.fromMap(s as Map<String, dynamic>))
                .toList() ??
            [],
      );
}

class WorkoutRoutine {
  final String id;
  final String name;
  final String region;
  final List<WorkoutSession> history;

  WorkoutRoutine({
    required this.id,
    required this.name,
    required this.region,
    required this.history,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'name': name,
        'region': region,
        'history': history.map((h) => h.toMap()).toList(),
      };

  factory WorkoutRoutine.fromMap(Map<String, dynamic> map) => WorkoutRoutine(
        id: map['id'] as String,
        name: map['name'] as String,
        region: map['region'] as String? ?? 'General',
        history: (map['history'] as List<dynamic>?)
                ?.map((h) => WorkoutSession.fromMap(h as Map<String, dynamic>))
                .toList() ??
            [],
      );

  String toJson() => jsonEncode(toMap());
  factory WorkoutRoutine.fromJson(Map<String, dynamic> json) => WorkoutRoutine.fromMap(json);
}

class UserGoals {
  final double calories;
  final double carbs;
  final double protein;
  final double fat;
  final double weight;
  final double height;
  final String gender;
  final double neck;
  final double waist;
  final double hip;

  UserGoals({
    this.calories = 2250,
    this.carbs = 300,
    this.protein = 104,
    this.fat = 40,
    this.weight = 70.0,
    this.height = 170.0,
    this.gender = 'male',
    this.neck = 38.0,
    this.waist = 80.0,
    this.hip = 90.0,
  });

  Map<String, dynamic> toMap() => {
        'calories': calories,
        'carbs': carbs,
        'protein': protein,
        'fat': fat,
        'weight': weight,
        'height': height,
        'gender': gender,
        'neck': neck,
        'waist': waist,
        'hip': hip,
      };

  factory UserGoals.fromMap(Map<String, dynamic> map) => UserGoals(
        calories: (map['calories'] as num?)?.toDouble() ?? 2250,
        carbs: (map['carbs'] as num?)?.toDouble() ?? 300,
        protein: (map['protein'] as num?)?.toDouble() ?? 104,
        fat: (map['fat'] as num?)?.toDouble() ?? 40,
        weight: (map['weight'] as num?)?.toDouble() ?? 70.0,
        height: (map['height'] as num?)?.toDouble() ?? 170.0,
        gender: map['gender'] as String? ?? 'male',
        neck: (map['neck'] as num?)?.toDouble() ?? 38.0,
        waist: (map['waist'] as num?)?.toDouble() ?? 80.0,
        hip: (map['hip'] as num?)?.toDouble() ?? 90.0,
      );

  String toJson() => jsonEncode(toMap());
  factory UserGoals.fromJson(Map<String, dynamic> json) => UserGoals.fromMap(json);
}
