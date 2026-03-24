import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { CountryPicker, type CountryItem } from '../../vendor/countryPicker';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, spacing, fontSize, shadows } from '../../constants/colors';
import { useAppTheme, useThemedStyles } from '../../theme';
import {
  buildE164Phone,
  DEFAULT_PHONE_COUNTRY,
  sanitizePhoneDigits,
  splitE164Phone,
} from '../../utils/phone';

interface PhoneInputProps {
  label?: string;
  value: string;
  onChangeValue: (value: string) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  value,
  onChangeValue,
  error,
  helperText,
  disabled = false,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryItem>(DEFAULT_PHONE_COUNTRY);
  const [nationalNumber, setNationalNumber] = useState('');

  useEffect(() => {
    const nextValue = splitE164Phone(value);

    setSelectedCountry(nextValue.country);
    setNationalNumber(nextValue.nationalNumber);
  }, [value]);

  const handleCountrySelect = (country: CountryItem) => {
    setSelectedCountry(country);
    setIsPickerVisible(false);
    onChangeValue(buildE164Phone(country, nationalNumber));
  };

  const handleNumberChange = (text: string) => {
    const digits = sanitizePhoneDigits(text);

    setNationalNumber(digits);
    onChangeValue(buildE164Phone(selectedCountry, digits));
  };

  const helperMessage = error || helperText;

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={[styles.fieldContainer, error ? styles.fieldContainerError : null]}>
        <TouchableOpacity
          style={[styles.countryButton, disabled ? styles.countryButtonDisabled : null]}
          activeOpacity={0.7}
          disabled={disabled}
          onPress={() => setIsPickerVisible(true)}
        >
          <Text style={styles.flag}>{selectedCountry.flag}</Text>
          <Text style={styles.dialCode}>{selectedCountry.dial_code}</Text>
          <Ionicons name="chevron-down" size={16} color={theme.colors.icon} />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={nationalNumber}
          onChangeText={handleNumberChange}
          editable={!disabled}
          keyboardType="phone-pad"
          placeholder="Número de teléfono"
          placeholderTextColor={theme.colors.textMuted}
        />
      </View>

      {helperMessage ? (
        <Text style={[styles.helperText, error ? styles.errorText : null]}>{helperMessage}</Text>
      ) : null}

      <CountryPicker
        show={isPickerVisible}
        lang="es"
        initialState={selectedCountry.dial_code}
        inputPlaceholder="Busca un país"
        searchMessage="No encontramos resultados"
        onBackdropPress={() => setIsPickerVisible(false)}
        pickerButtonOnPress={handleCountrySelect}
        style={{
          modal: styles.pickerModal,
          textInput: styles.pickerSearchInput,
          countryButtonStyles: styles.pickerCountryButton,
          dialCode: styles.pickerDialCode,
          countryName: styles.pickerCountryName,
        }}
      />
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) =>
  StyleSheet.create({
    container: {
      marginBottom: spacing.md,
    },
    label: {
      fontSize: fontSize.sm,
      fontWeight: '500',
      color: theme.colors.textSecondary,
      marginBottom: spacing.xs,
    },
    fieldContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.inputBackground,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
      overflow: 'hidden',
    },
    fieldContainerError: {
      borderColor: theme.colors.error,
    },
    countryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderRightWidth: 1,
      borderRightColor: theme.colors.inputBorder,
      backgroundColor: theme.colors.surface,
    },
    countryButtonDisabled: {
      opacity: 0.6,
    },
    flag: {
      fontSize: fontSize.lg,
    },
    dialCode: {
      fontSize: fontSize.base,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    input: {
      flex: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontSize: fontSize.base,
      color: theme.colors.textPrimary,
    },
    helperText: {
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
      marginTop: spacing.xs,
    },
    errorText: {
      color: theme.colors.error,
    },
    pickerModal: {
      backgroundColor: theme.colors.surface,
      height: '72%',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.lg,
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      ...shadows.lg,
    },
    pickerSearchInput: {
      backgroundColor: theme.colors.inputBackground,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      color: theme.colors.textPrimary,
      fontSize: fontSize.base,
    },
    pickerCountryButton: {
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    pickerDialCode: {
      color: theme.colors.textMuted,
      fontSize: fontSize.base,
    },
    pickerCountryName: {
      color: theme.colors.textPrimary,
      fontSize: fontSize.base,
    },
  });
