import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, shadows3D } from '@/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search filename, date or tag',
  onClear,
}) => {
  const { theme, radius, spacing, typography } = useTheme();

  return (
    <View
      style={[
        styles.container,
        shadows3D.soft,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: radius.pill,
          borderColor: 'rgba(255, 255, 255, 0.9)',
          paddingHorizontal: spacing.lg,
          paddingVertical: 4,
        },
      ]}
    >
      <Ionicons name="search" size={18} color={theme.colors.textSubtle} style={styles.searchIcon} />
      <TextInput
        style={[
          styles.input,
          typography.bodyMedium,
          {
            color: theme.colors.text,
            paddingVertical: spacing.sm + 2,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSubtle}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear || (() => onChangeText(''))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close-circle" size={18} color={theme.colors.textSubtle} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
  },
});
