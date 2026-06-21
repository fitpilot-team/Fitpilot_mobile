import React, { useEffect, useMemo, useRef } from 'react';
import { FlatList, Pressable, Text, View, type ListRenderItem } from 'react-native';
import type { AppTheme } from '../../theme';

const YEAR_COLUMNS = 4;
const YEAR_ROW_GAP = 8;
const YEAR_ITEM_HEIGHT = 40;

type YearPickerStyles = {
  decadeChip: object;
  decadeChipActive: object;
  decadeChipText: object;
  decadeChipTextActive: object;
  decadeRow: object;
  decadeSection: object;
  decadeTitle: object;
  selectorOptionActive: object;
  selectorOptionTextActive: object;
  yearGrid: object;
  yearOption: object;
  yearOptionText: object;
  yearScroll: object;
};

interface BirthdateYearPickerProps {
  years: number[];
  selectedYear: number | null;
  scrollToYear: number;
  onSelect: (year: number) => void;
  styles: YearPickerStyles;
  theme: AppTheme;
}

type YearRow = {
  key: string;
  years: number[];
};

const buildYearRows = (years: number[]): YearRow[] => {
  const rows: YearRow[] = [];

  for (let index = 0; index < years.length; index += YEAR_COLUMNS) {
    const slice = years.slice(index, index + YEAR_COLUMNS);
    rows.push({
      key: slice.join('-'),
      years: slice,
    });
  }

  return rows;
};

const getDecadeStart = (year: number) => Math.floor(year / 10) * 10;

export const BirthdateYearPicker: React.FC<BirthdateYearPickerProps> = ({
  years,
  selectedYear,
  scrollToYear,
  onSelect,
  styles,
  theme,
}) => {
  const listRef = useRef<FlatList<YearRow>>(null);
  const yearRows = useMemo(() => buildYearRows(years), [years]);

  const decades = useMemo(() => {
    const uniqueDecades = new Set<number>();
    years.forEach((year) => uniqueDecades.add(getDecadeStart(year)));
    return Array.from(uniqueDecades).sort((left, right) => right - left);
  }, [years]);

  const [activeDecade, setActiveDecade] = React.useState(() => getDecadeStart(scrollToYear));

  useEffect(() => {
    setActiveDecade(getDecadeStart(scrollToYear));
  }, [scrollToYear]);

  useEffect(() => {
    const targetIndex = years.indexOf(scrollToYear);
    if (targetIndex < 0) {
      return;
    }

    const rowIndex = Math.floor(targetIndex / YEAR_COLUMNS);
    const timer = setTimeout(() => {
      listRef.current?.scrollToIndex({
        index: rowIndex,
        animated: false,
        viewPosition: 0.35,
      });
    }, 80);

    return () => clearTimeout(timer);
  }, [scrollToYear, years]);

  const scrollToDecade = (decadeStart: number) => {
    setActiveDecade(decadeStart);

    const firstYearInDecade = years.find(
      (year) => getDecadeStart(year) === decadeStart,
    );

    if (!firstYearInDecade) {
      return;
    }

    const rowIndex = Math.floor(years.indexOf(firstYearInDecade) / YEAR_COLUMNS);
    listRef.current?.scrollToIndex({
      index: Math.max(0, rowIndex),
      animated: true,
      viewPosition: 0,
    });
  };

  const renderYearRow: ListRenderItem<YearRow> = ({ item }) => (
    <View style={[styles.yearGrid, { marginBottom: YEAR_ROW_GAP }]}>
      {item.years.map((year) => {
        const isSelected = year === selectedYear;

        return (
          <Pressable
            key={year}
            onPress={() => onSelect(year)}
            style={[
              styles.yearOption,
              isSelected ? styles.selectorOptionActive : null,
            ]}
          >
            <Text
              style={[
                styles.yearOptionText,
                isSelected ? styles.selectorOptionTextActive : null,
              ]}
            >
              {year}
            </Text>
          </Pressable>
        );
      })}
      {item.years.length < YEAR_COLUMNS
        ? Array.from({ length: YEAR_COLUMNS - item.years.length }, (_, index) => (
            <View key={`spacer-${index}`} style={styles.yearOption} />
          ))
        : null}
    </View>
  );

  return (
    <View>
      <View style={styles.decadeRow}>
        {decades.map((decadeStart) => {
          const isActive = activeDecade === decadeStart;

          return (
            <Pressable
              key={decadeStart}
              onPress={() => scrollToDecade(decadeStart)}
              style={[
                styles.decadeChip,
                isActive ? styles.decadeChipActive : null,
              ]}
            >
              <Text
                style={[
                  styles.decadeChipText,
                  isActive ? styles.decadeChipTextActive : null,
                ]}
              >
                {decadeStart}s
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        ref={listRef}
        data={yearRows}
        keyExtractor={(item) => item.key}
        renderItem={renderYearRow}
        style={styles.yearScroll}
        showsVerticalScrollIndicator
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({
              index: info.index,
              animated: false,
            });
          }, 100);
        }}
        getItemLayout={(_, index) => ({
          length: YEAR_ITEM_HEIGHT + YEAR_ROW_GAP,
          offset: (YEAR_ITEM_HEIGHT + YEAR_ROW_GAP) * index,
          index,
        })}
        ListHeaderComponent={
          <Text style={[styles.decadeTitle, { color: theme.colors.textMuted }]}>
            Los años más recientes aparecen primero
          </Text>
        }
      />
    </View>
  );
};

export const buildBirthYearOptions = (
  minDateKey: string | null,
  maxDateKey: string | null,
): number[] => {
  const anchorYear = maxDateKey
    ? Number(maxDateKey.slice(0, 4))
    : new Date().getFullYear();
  const minYear = minDateKey ? Number(minDateKey.slice(0, 4)) : anchorYear - 120;
  const maxYear = maxDateKey ? Number(maxDateKey.slice(0, 4)) : anchorYear;

  const years: number[] = [];
  for (let year = maxYear; year >= minYear; year -= 1) {
    years.push(year);
  }

  return years;
};
