import React from 'react';
import Svg, { Circle, Path, Rect, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useAppTheme } from '../../utils/theme';

/**
 * EmptyPharmaciesIllustration
 * Pill bottle next to a magnifying glass, used in the Home empty state.
 */
export function EmptyPharmaciesIllustration({ size = 128 }) {
  const { colors } = useAppTheme();

  return (
    <Svg width={size} height={size} viewBox="0 0 128 128" fill="none">
      <Circle cx="64" cy="64" r="58" fill={colors.primaryMuted} />
      <Rect
        x="34"
        y="42"
        width="38"
        height="56"
        rx="8"
        fill={colors.surface}
        stroke={colors.primary}
        strokeWidth="2.5"
      />
      <Rect x="38" y="48" width="30" height="8" rx="3" fill={colors.primary} />
      <Path
        d="M44 70h18M44 78h12"
        stroke={colors.primary}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Circle
        cx="88"
        cy="80"
        r="16"
        fill="none"
        stroke={colors.secondary}
        strokeWidth="3.5"
      />
      <Path
        d="M100 92l8 8"
        stroke={colors.secondary}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <Circle cx="84" cy="76" r="3" fill={colors.secondary} opacity="0.5" />
    </Svg>
  );
}

/**
 * AuthHeroOrnament
 * Soft abstract medical cross with concentric rings, used as the AuthShell hero background.
 * Sits behind the title — must not capture touches.
 */
export function AuthHeroOrnament({ width = 320, height = 200 }) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 320 200"
      fill="none"
      pointerEvents="none"
    >
      <Defs>
        <LinearGradient id="ornamentFade" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.22" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0.04" />
        </LinearGradient>
      </Defs>
      <G opacity="0.85">
        <Circle cx="260" cy="40" r="78" fill="url(#ornamentFade)" />
        <Circle cx="260" cy="40" r="52" fill="none" stroke="#FFFFFF" strokeOpacity="0.18" strokeWidth="1" />
        <Circle cx="260" cy="40" r="32" fill="none" stroke="#FFFFFF" strokeOpacity="0.22" strokeWidth="1" />
      </G>
      <G opacity="0.9">
        <Circle cx="56" cy="156" r="44" fill="#FFFFFF" fillOpacity="0.08" />
        <Rect x="46" y="138" width="20" height="36" rx="3" fill="#FFFFFF" fillOpacity="0.22" />
        <Rect x="38" y="146" width="36" height="20" rx="3" fill="#FFFFFF" fillOpacity="0.22" />
      </G>
      <G opacity="0.6">
        <Path
          d="M0 180 Q80 150 160 180 T320 180"
          stroke="#FFFFFF"
          strokeOpacity="0.14"
          strokeWidth="1.5"
          fill="none"
        />
      </G>
    </Svg>
  );
}

/**
 * ChatbotWelcomeIllustration
 * Friendly speech bubble with a medical heart, shown above quick-prompt chips when only
 * the seeded welcome message is present.
 */
export function ChatbotWelcomeIllustration({ size = 132 }) {
  const { colors } = useAppTheme();

  return (
    <Svg width={size} height={size} viewBox="0 0 132 132" fill="none">
      <Circle cx="66" cy="66" r="60" fill={colors.primaryMuted} />
      <Path
        d="M28 50c0-9 7-16 16-16h44c9 0 16 7 16 16v22c0 9-7 16-16 16H58l-14 14V88h0c-9 0-16-7-16-16V50z"
        fill={colors.surface}
        stroke={colors.primary}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <Path
        d="M66 50c-3-5-10-6-13-1-3 5 0 11 4 15l9 9 9-9c4-4 7-10 4-15-3-5-10-4-13 1z"
        fill={colors.error}
        opacity="0.85"
      />
      <Path
        d="M60 76h12"
        stroke={colors.primary}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}
