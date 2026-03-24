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

// The package ships typings that currently break under this repo's TS setup.
// Using require here isolates the vendor surface behind our own typed wrapper.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const countryPickerModule = require('react-native-country-codes-picker') as {
  CountryPicker: React.ComponentType<CountryPickerProps>;
  countryCodes: CountryItem[];
};

export const CountryPicker = countryPickerModule.CountryPicker;
export const countryCodes = countryPickerModule.countryCodes;
