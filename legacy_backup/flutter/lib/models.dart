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
        date: map['date'],
        calories: (map['calories'] as num).toDouble(),
        protein: (map['protein'] as num).toDouble(),
        carbs: (map['carbs'] as num).toDouble(),
        fat: (map['fat'] as num).toDouble(),
        burnedCalories: (map['burnedCalories'] as num?)?.toDouble() ?? 0,
      );

  // Legacy support for SharedPreferences JSON
  Map<String, dynamic> toJson() => toMap();
  factory DailySummary.fromJson(Map<String, dynamic> json) => DailySummary.fromMap(json);
}

class FoodEntry {
  final int? id;
  final String name;
  final double calories;
  final double protein;
  final double carbs;
  final double fat;
  final String? date; // Added to track which day the food belongs to

  FoodEntry({
    this.id,
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
        id: map['id'] as int?,
        name: map['name'],
        calories: (map['calories'] as num).toDouble(),
        protein: (map['protein'] as num).toDouble(),
        carbs: (map['carbs'] as num).toDouble(),
        fat: (map['fat'] as num).toDouble(),
        date: map['date'] as String?,
      );

  // Legacy support
  Map<String, dynamic> toJson() => {
        'name': name,
        'calories': calories,
        'protein': protein,
        'carbs': carbs,
        'fat': fat,
      };
  factory FoodEntry.fromJson(Map<String, dynamic> json) => FoodEntry(
        name: json['name'],
        calories: (json['calories'] as num).toDouble(),
        protein: (json['protein'] as num).toDouble(),
        carbs: (json['carbs'] as num).toDouble(),
        fat: (json['fat'] as num).toDouble(),
      );
}

class FoodPreset {
  final int? id;
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
        id: map['id'] as int?,
        name: map['name'],
        calories: (map['calories'] as num).toDouble(),
        protein: (map['protein'] as num).toDouble(),
        carbs: (map['carbs'] as num).toDouble(),
        fat: (map['fat'] as num).toDouble(),
      );

  // Legacy support
  Map<String, dynamic> toJson() => toMap();
  factory FoodPreset.fromJson(Map<String, dynamic> json) => FoodPreset.fromMap(json);
}

class ProgressPhoto {
  final int? id;
  final String imagePath;
  final String date;
  final double weight;

  ProgressPhoto({
    this.id,
    required this.imagePath,
    required this.date,
    required this.weight,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'imagePath': imagePath,
        'date': date,
        'weight': weight,
      };

  factory ProgressPhoto.fromMap(Map<String, dynamic> map) => ProgressPhoto(
        id: map['id'] as int?,
        imagePath: map['imagePath'] as String,
        date: map['date'] as String,
        weight: (map['weight'] as num).toDouble(),
      );
}
