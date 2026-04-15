import React from 'react';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../../utils/theme';
import IconButton from './IconButton';

export default function FavoriteButton({ active, onPress, accessibilityLabel, style }) {
  const { colors } = useAppTheme();

  return (
    <IconButton
      active={active}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      style={style}
      icon={<Feather name="heart" size={18} color={active ? '#D94A63' : colors.iconMuted} />}
    />
  );
}
