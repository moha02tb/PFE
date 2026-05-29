import React from 'react';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../../utils/theme';
import AppInput from './Input';

export default function SearchBar(props) {
  const { colors } = useAppTheme();

  return (
    <AppInput
      clearable
      autoCapitalize="none"
      autoCorrect={false}
      icon={<Feather name="search" size={18} color={colors.iconMuted} />}
      {...props}
    />
  );
}
