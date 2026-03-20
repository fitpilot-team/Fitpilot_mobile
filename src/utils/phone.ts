import { countryCodes, type CountryItem } from '../vendor/countryPicker';

const DEFAULT_COUNTRY_CODE = 'MX';

const SORTED_COUNTRIES = [...countryCodes].sort(
  (left, right) => right.dial_code.length - left.dial_code.length,
);

export const DEFAULT_PHONE_COUNTRY =
  countryCodes.find((country) => country.code === DEFAULT_COUNTRY_CODE) ?? countryCodes[0];

export const sanitizePhoneDigits = (value: string) => value.replace(/\D/g, '');

export const buildE164Phone = (
  country: Pick<CountryItem, 'dial_code'>,
  nationalNumber: string,
) => {
  const digits = sanitizePhoneDigits(nationalNumber);

  if (!digits) {
    return '';
  }

  return `${country.dial_code}${digits}`;
};

export const splitE164Phone = (value: string | null | undefined) => {
  const normalizedValue = value?.trim() ?? '';

  if (!normalizedValue) {
    return {
      country: DEFAULT_PHONE_COUNTRY,
      nationalNumber: '',
    };
  }

  const matchedCountry = SORTED_COUNTRIES.find((country) =>
    normalizedValue.startsWith(country.dial_code),
  );

  if (!matchedCountry) {
    return {
      country: DEFAULT_PHONE_COUNTRY,
      nationalNumber: sanitizePhoneDigits(normalizedValue.replace(/^\+/, '')),
    };
  }

  return {
    country: matchedCountry,
    nationalNumber: sanitizePhoneDigits(
      normalizedValue.slice(matchedCountry.dial_code.length),
    ),
  };
};
