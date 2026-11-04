import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTokens {
  // Palettes (Derived directly from DESIGN.md and React Native tokens)
  static const Color stoneCanvas = Color(0xFFFAFAF9);
  static const Color pureWhite = Color(0xFFFFFFFF);
  static const Color stoneBorder = Color(0xFFE8E6E5);
  static const Color stoneMuted = Color(0xFFD6D3D1);
  static const Color ashGray = Color(0xFFA8A29E);
  static const Color warmGray = Color(0xFF78716C);
  static const Color inkBlack = Color(0xFF0C0A09);
  static const Color soot = Color(0xFF1C1917);

  // Accents (Restrained, deliberate use only)
  static const Color skyWash = Color(0xFFC1E1F7);
  static const Color cyanSignal = Color(0xFF3BA6F1);
  static const Color cyanEdge = Color(0xFF3398E1);

  // States
  static const Color surplusAlert = Color(0xFFE54D2E);
  static const Color surplusWash = Color(0x1FE54D2E); // 12% opacity
  static const Color positiveGreen = Color(0xFF059669);
  static const Color positiveWash = Color(0x14059669);

  // Structural Radii
  static const double radiusCard = 10.0;
  static const double radiusFeatureCard = 16.0;
  static const double radiusPill = 9999.0;
  static const double radiusInput = 6.0;

  // Text Styles using Outfit
  static TextStyle titleHeader = GoogleFonts.outfit(
    fontSize: 20,
    fontWeight: FontWeight.w800,
    color: inkBlack,
    letterSpacing: -0.3,
  );

  static TextStyle sectionTitle = GoogleFonts.outfit(
    fontSize: 16,
    fontWeight: FontWeight.w700,
    color: inkBlack,
    letterSpacing: -0.2,
  );

  static TextStyle sectionSubtitle = GoogleFonts.outfit(
    fontSize: 12,
    fontWeight: FontWeight.w500,
    color: warmGray,
    letterSpacing: -0.1,
  );

  static TextStyle kicker = GoogleFonts.outfit(
    fontSize: 10.5,
    fontWeight: FontWeight.w800,
    color: warmGray,
    letterSpacing: 0.8,
  );

  static TextStyle body = GoogleFonts.outfit(
    fontSize: 13,
    fontWeight: FontWeight.w400,
    color: inkBlack,
  );

  static TextStyle bodyMuted = GoogleFonts.outfit(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    color: warmGray,
  );

  static TextStyle pillText = GoogleFonts.outfit(
    fontSize: 11,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.2,
  );

  static TextStyle buttonText = GoogleFonts.outfit(
    fontSize: 14,
    fontWeight: FontWeight.w700,
    color: pureWhite,
    letterSpacing: -0.2,
  );

  // Decorations
  static BoxDecoration cardDecoration({
    Color background = pureWhite,
    Color borderColor = stoneBorder,
    double radius = radiusCard,
  }) {
    return BoxDecoration(
      color: background,
      borderRadius: BorderRadius.circular(radius),
      border: Border.all(color: borderColor, width: 1),
    );
  }

  static InputDecoration inputDecoration({
    required String hintText,
    Widget? prefixIcon,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      hintText: hintText,
      hintStyle: GoogleFonts.outfit(color: ashGray, fontSize: 13),
      prefixIcon: prefixIcon,
      suffixIcon: suffixIcon,
      filled: true,
      fillColor: stoneCanvas,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusInput),
        borderSide: const BorderSide(color: stoneBorder, width: 1),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusInput),
        borderSide: const BorderSide(color: cyanSignal, width: 1.5),
      ),
    );
  }
}

