import React from 'react';

export type CountryItem = {
  name: Record<string, string>;
  dial_code: string;
  code: string;
  flag: string;
};

export type CountryPickerProps = {
  show: boolean;
  pickerButtonOnPress: (item: CountryItem) => void;
  onBackdropPress?: () => void;
  initialState?: string;
  inputPlaceholder?: string;
  searchMessage?: string;
  lang?: string;
  style?: Record<string, unknown>;
};

const countryPickerModule = require('react-native-country-codes-picker') as {
  CountryPicker: React.ComponentType<CountryPickerProps>;
  countryCodes: CountryItem[];
};

export const CountryPicker = countryPickerModule.CountryPicker;
export const countryCodes = countryPickerModule.countryCodes;
