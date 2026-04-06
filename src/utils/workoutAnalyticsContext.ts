import type {
  Macrocycle,
  MacrocycleListItem,
  Mesocycle,
  Microcycle,
  WorkoutAnalyticsProgramScope,
  WorkoutAnalyticsScopeKind,
} from '../types';
import { compareDateKeys, getTodayDateKey } from './date';

export type HistoricalWorkoutAnalyticsScopeKind = Exclude<WorkoutAnalyticsScopeKind, 'range'>;

export interface WorkoutAnalyticsContextSelection {
  macrocycleId: string | null;
  mesocycleId: string | null;
  microcycleId: string | null;
}

export interface WorkoutAnalyticsContextRequestParams {
  macrocycleId: string | null;
  mesocycleId: string | null;
  microcycleId: string | null;
}

export interface WorkoutAnalyticsHistoricalProgram {
  summary: MacrocycleListItem;
  detail: Macrocycle;
  mesocycles: Mesocycle[];
}

export interface WorkoutAnalyticsContextItem {
  id: string;
  scopeKind: HistoricalWorkoutAnalyticsScopeKind;
  title: string;
  subtitle: string;
  startDate: string | null;
  endDate: string | null;
  macrocycleId: string;
  mesocycleId: string | null;
  microcycleId: string | null;
}

export interface WorkoutAnalyticsContextPickerSection {
  title: string;
  data: WorkoutAnalyticsContextItem[];
}

const VISIBLE_MACROCYCLE_STATUSES = new Set(['active', 'completed']);

const compareIsoDesc = (left?: string | null, right?: string | null) => {
  if (left && right) {
    return right.localeCompare(left);
  }

  if (left) {
    return -1;
  }

  if (right) {
    return 1;
  }

  return 0;
};

const compareNumericIdDesc = (left?: string | null, right?: string | null) => {
  const leftNumber = Number.parseInt(left ?? '', 10);
  const rightNumber = Number.parseInt(right ?? '', 10);

  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
    return rightNumber - leftNumber;
  }

  return (right ?? '').localeCompare(left ?? '');
};

const comparePrograms = (
  left: WorkoutAnalyticsHistoricalProgram,
  right: WorkoutAnalyticsHistoricalProgram,
) =>
  compareIsoDesc(left.summary.start_date, right.summary.start_date) ||
  compareIsoDesc(left.summary.created_at, right.summary.created_at) ||
  compareNumericIdDesc(left.summary.id, right.summary.id);

const compareMesocyclesDesc = (left: Mesocycle, right: Mesocycle) =>
  compareIsoDesc(left.start_date, right.start_date) ||
  (right.block_number ?? 0) - (left.block_number ?? 0) ||
  compareNumericIdDesc(left.id, right.id);

const compareMicrocyclesDesc = (left: Microcycle, right: Microcycle) =>
  compareIsoDesc(left.start_date, right.start_date) ||
  (right.week_number ?? 0) - (left.week_number ?? 0) ||
  compareNumericIdDesc(left.id, right.id);

const buildBlockTitle = (mesocycle: Mesocycle) => `Bloque ${mesocycle.block_number}`;

const buildMicrocycleTitle = (microcycle: Microcycle) => `Microciclo ${microcycle.week_number}`;

const buildBlockSubtitle = (program: WorkoutAnalyticsHistoricalProgram, mesocycle: Mesocycle) => {
  const blockTitle = buildBlockTitle(mesocycle);
  const normalizedName = mesocycle.name?.trim();

  if (normalizedName && normalizedName !== blockTitle) {
    return `${normalizedName} - ${program.summary.name}`;
  }

  return program.summary.name;
};

const buildMicrocycleSubtitle = (
  program: WorkoutAnalyticsHistoricalProgram,
  mesocycle: Mesocycle,
  microcycle: Microcycle,
) => {
  const microcycleTitle = buildMicrocycleTitle(microcycle);
  const normalizedName = microcycle.name?.trim();
  const blockLabel = buildBlockTitle(mesocycle);

  if (normalizedName && normalizedName !== microcycleTitle) {
    return `${normalizedName} - ${blockLabel}`;
  }

  return `${blockLabel} - ${program.summary.name}`;
};

const pickCurrentByDate = <T extends { start_date: string; end_date: string }>(
  items: T[],
  todayDateKey: string,
) =>
  items.find(
    (item) =>
      compareDateKeys(item.start_date, todayDateKey) <= 0 &&
      compareDateKeys(item.end_date, todayDateKey) >= 0,
  ) ?? items[0] ?? null;

const normalizeProgram = (
  summary: MacrocycleListItem,
  detail: Macrocycle,
): WorkoutAnalyticsHistoricalProgram => {
  const mesocycles = [...(detail.mesocycles ?? [])]
    .map((mesocycle) => ({
      ...mesocycle,
      microcycles: [...(mesocycle.microcycles ?? [])].sort(compareMicrocyclesDesc),
    }))
    .sort(compareMesocyclesDesc);

  return {
    summary,
    detail: {
      ...detail,
      mesocycles,
    },
    mesocycles,
  };
};

const findProgramById = (
  programs: WorkoutAnalyticsHistoricalProgram[],
  macrocycleId?: string | null,
) => programs.find((program) => program.summary.id === macrocycleId) ?? null;

const findMesocycleById = (
  programs: WorkoutAnalyticsHistoricalProgram[],
  mesocycleId?: string | null,
) => {
  for (const program of programs) {
    const mesocycle = program.mesocycles.find((candidate) => candidate.id === mesocycleId);
    if (mesocycle) {
      return {
        program,
        mesocycle,
      };
    }
  }

  return null;
};

const findMicrocycleById = (
  programs: WorkoutAnalyticsHistoricalProgram[],
  microcycleId?: string | null,
) => {
  for (const program of programs) {
    for (const mesocycle of program.mesocycles) {
      const microcycle = (mesocycle.microcycles ?? []).find((candidate) => candidate.id === microcycleId);
      if (microcycle) {
        return {
          program,
          mesocycle,
          microcycle,
        };
      }
    }
  }

  return null;
};

const getDefaultMesocycle = (
  program: WorkoutAnalyticsHistoricalProgram | null,
  todayDateKey: string,
) => {
  if (!program) {
    return null;
  }

  return pickCurrentByDate(program.mesocycles, todayDateKey);
};

const getDefaultMicrocycle = (mesocycle: Mesocycle | null, todayDateKey: string) => {
  if (!mesocycle) {
    return null;
  }

  return pickCurrentByDate([...(mesocycle.microcycles ?? [])], todayDateKey);
};

const buildSelection = (
  program: WorkoutAnalyticsHistoricalProgram | null,
  mesocycle: Mesocycle | null,
  microcycle: Microcycle | null,
): WorkoutAnalyticsContextSelection => ({
  macrocycleId: program?.summary.id ?? null,
  mesocycleId: mesocycle?.id ?? null,
  microcycleId: microcycle?.id ?? null,
});

export const buildHistoricalProgramsCatalog = (
  macrocycleSummaries: MacrocycleListItem[],
  macrocycleDetailsById: Record<string, Macrocycle>,
) =>
  macrocycleSummaries
    .filter((summary) => VISIBLE_MACROCYCLE_STATUSES.has(summary.status))
    .map((summary) => {
      const detail = macrocycleDetailsById[summary.id];
      if (!detail) {
        return null;
      }

      return normalizeProgram(summary, detail);
    })
    .filter((program): program is WorkoutAnalyticsHistoricalProgram => program != null)
    .sort(comparePrograms);

export const getSelectionFromProgramScope = (
  programScope?: WorkoutAnalyticsProgramScope | null,
): WorkoutAnalyticsContextSelection => ({
  macrocycleId: programScope?.macrocycle_id ?? null,
  mesocycleId: programScope?.mesocycle_id ?? null,
  microcycleId: programScope?.microcycle_id ?? null,
});

export const areSelectionsEqual = (
  left: WorkoutAnalyticsContextSelection,
  right: WorkoutAnalyticsContextSelection,
) =>
  left.macrocycleId === right.macrocycleId &&
  left.mesocycleId === right.mesocycleId &&
  left.microcycleId === right.microcycleId;

export const getRequestParamsForSelection = (
  scopeKind: WorkoutAnalyticsScopeKind,
  selection: WorkoutAnalyticsContextSelection,
): WorkoutAnalyticsContextRequestParams => {
  if (scopeKind === 'program') {
    return {
      macrocycleId: selection.macrocycleId,
      mesocycleId: null,
      microcycleId: null,
    };
  }

  if (scopeKind === 'mesocycle') {
    return {
      macrocycleId: selection.macrocycleId,
      mesocycleId: selection.mesocycleId,
      microcycleId: null,
    };
  }

  return {
    macrocycleId: selection.macrocycleId,
    mesocycleId: selection.mesocycleId,
    microcycleId: selection.microcycleId,
  };
};

export const synchronizeSelectionForScope = (
  scopeKind: HistoricalWorkoutAnalyticsScopeKind,
  selection: WorkoutAnalyticsContextSelection,
  programs: WorkoutAnalyticsHistoricalProgram[],
  todayDateKey: string = getTodayDateKey(),
) => {
  if (!programs.length) {
    return buildSelection(null, null, null);
  }

  if (scopeKind === 'program') {
    const program =
      findProgramById(programs, selection.macrocycleId) ??
      findMesocycleById(programs, selection.mesocycleId)?.program ??
      findMicrocycleById(programs, selection.microcycleId)?.program ??
      programs[0];
    const mesocycle = getDefaultMesocycle(program, todayDateKey);
    const microcycle = getDefaultMicrocycle(mesocycle, todayDateKey);
    return buildSelection(program, mesocycle, microcycle);
  }

  if (scopeKind === 'mesocycle') {
    const resolvedMesocycle =
      findMesocycleById(programs, selection.mesocycleId) ??
      (() => {
        const program = findProgramById(programs, selection.macrocycleId) ?? programs[0];
        const mesocycle = getDefaultMesocycle(program, todayDateKey);

        if (!program || !mesocycle) {
          return null;
        }

        return {
          program,
          mesocycle,
        };
      })() ??
      (() => {
        const microcycleEntry = findMicrocycleById(programs, selection.microcycleId);
        if (!microcycleEntry) {
          return null;
        }

        return {
          program: microcycleEntry.program,
          mesocycle: microcycleEntry.mesocycle,
        };
      })();

    if (!resolvedMesocycle) {
      return buildSelection(programs[0], null, null);
    }

    const microcycle = getDefaultMicrocycle(resolvedMesocycle.mesocycle, todayDateKey);
    return buildSelection(resolvedMesocycle.program, resolvedMesocycle.mesocycle, microcycle);
  }

  const resolvedMicrocycle =
    findMicrocycleById(programs, selection.microcycleId) ??
    (() => {
      const mesocycleEntry = findMesocycleById(programs, selection.mesocycleId);
      if (!mesocycleEntry) {
        return null;
      }

      const microcycle = getDefaultMicrocycle(mesocycleEntry.mesocycle, todayDateKey);
      if (!microcycle) {
        return null;
      }

      return {
        ...mesocycleEntry,
        microcycle,
      };
    })() ??
    (() => {
      const program = findProgramById(programs, selection.macrocycleId) ?? programs[0];
      const mesocycle = getDefaultMesocycle(program, todayDateKey);
      const microcycle = getDefaultMicrocycle(mesocycle, todayDateKey);

      if (!program || !mesocycle || !microcycle) {
        return null;
      }

      return {
        program,
        mesocycle,
        microcycle,
      };
    })();

  if (!resolvedMicrocycle) {
    return buildSelection(programs[0], null, null);
  }

  return buildSelection(
    resolvedMicrocycle.program,
    resolvedMicrocycle.mesocycle,
    resolvedMicrocycle.microcycle,
  );
};

export const getContextItemsForScope = (
  scopeKind: HistoricalWorkoutAnalyticsScopeKind,
  programs: WorkoutAnalyticsHistoricalProgram[],
): WorkoutAnalyticsContextItem[] => {
  if (scopeKind === 'program') {
    return programs.map((program) => ({
      id: program.summary.id,
      scopeKind,
      title: program.summary.name,
      subtitle: program.summary.objective,
      startDate: program.summary.start_date,
      endDate: program.summary.end_date,
      macrocycleId: program.summary.id,
      mesocycleId: null,
      microcycleId: null,
    }));
  }

  if (scopeKind === 'mesocycle') {
    return programs
      .flatMap((program) =>
        program.mesocycles.map((mesocycle) => ({
          id: mesocycle.id,
          scopeKind,
          title: buildBlockTitle(mesocycle),
          subtitle: buildBlockSubtitle(program, mesocycle),
          startDate: mesocycle.start_date,
          endDate: mesocycle.end_date,
          macrocycleId: program.summary.id,
          mesocycleId: mesocycle.id,
          microcycleId: null,
        })),
      )
      .sort((left, right) => compareIsoDesc(left.startDate, right.startDate) || compareNumericIdDesc(left.id, right.id));
  }

  return programs
    .flatMap((program) =>
      program.mesocycles.flatMap((mesocycle) =>
        (mesocycle.microcycles ?? []).map((microcycle) => ({
          id: microcycle.id,
          scopeKind,
          title: buildMicrocycleTitle(microcycle),
          subtitle: buildMicrocycleSubtitle(program, mesocycle, microcycle),
          startDate: microcycle.start_date,
          endDate: microcycle.end_date,
          macrocycleId: program.summary.id,
          mesocycleId: mesocycle.id,
          microcycleId: microcycle.id,
        })),
      ),
    )
    .sort((left, right) => compareIsoDesc(left.startDate, right.startDate) || compareNumericIdDesc(left.id, right.id));
};

export const getPickerSectionsForScope = (
  scopeKind: HistoricalWorkoutAnalyticsScopeKind,
  programs: WorkoutAnalyticsHistoricalProgram[],
): WorkoutAnalyticsContextPickerSection[] => {
  if (scopeKind === 'program') {
    return [
      {
        title: 'Programas',
        data: getContextItemsForScope(scopeKind, programs),
      },
    ];
  }

  if (scopeKind === 'mesocycle') {
    return programs.map((program) => ({
      title: program.summary.name,
      data: program.mesocycles.map((mesocycle) => ({
        id: mesocycle.id,
        scopeKind,
        title: buildBlockTitle(mesocycle),
        subtitle: buildBlockSubtitle(program, mesocycle),
        startDate: mesocycle.start_date,
        endDate: mesocycle.end_date,
        macrocycleId: program.summary.id,
        mesocycleId: mesocycle.id,
        microcycleId: null,
      })),
    }));
  }

  return programs.flatMap((program) =>
    program.mesocycles.map((mesocycle) => ({
      title: `${buildBlockTitle(mesocycle)} - ${program.summary.name}`,
      data: (mesocycle.microcycles ?? []).map((microcycle) => ({
        id: microcycle.id,
        scopeKind,
        title: buildMicrocycleTitle(microcycle),
        subtitle: buildMicrocycleSubtitle(program, mesocycle, microcycle),
        startDate: microcycle.start_date,
        endDate: microcycle.end_date,
        macrocycleId: program.summary.id,
        mesocycleId: mesocycle.id,
        microcycleId: microcycle.id,
      })),
    })),
  );
};

export const getSelectedContextItemForScope = (
  scopeKind: HistoricalWorkoutAnalyticsScopeKind,
  selection: WorkoutAnalyticsContextSelection,
  programs: WorkoutAnalyticsHistoricalProgram[],
) => {
  const items = getContextItemsForScope(scopeKind, programs);
  const selectedId =
    scopeKind === 'program'
      ? selection.macrocycleId
      : scopeKind === 'mesocycle'
        ? selection.mesocycleId
        : selection.microcycleId;

  return items.find((item) => item.id === selectedId) ?? null;
};

export const getAdjacentSelectionForScope = (
  scopeKind: HistoricalWorkoutAnalyticsScopeKind,
  selection: WorkoutAnalyticsContextSelection,
  programs: WorkoutAnalyticsHistoricalProgram[],
  direction: 'previous' | 'next',
) => {
  const items = getContextItemsForScope(scopeKind, programs);
  if (!items.length) {
    return null;
  }

  const selectedId =
    scopeKind === 'program'
      ? selection.macrocycleId
      : scopeKind === 'mesocycle'
        ? selection.mesocycleId
        : selection.microcycleId;
  const currentIndex = items.findIndex((item) => item.id === selectedId);

  if (currentIndex < 0) {
    return null;
  }

  const nextIndex = direction === 'previous' ? currentIndex + 1 : currentIndex - 1;
  const nextItem = items[nextIndex];

  if (!nextItem) {
    return null;
  }

  return {
    macrocycleId: nextItem.macrocycleId,
    mesocycleId: nextItem.mesocycleId,
    microcycleId: nextItem.microcycleId,
  };
};

export const isCurrentSelectionForScope = (
  scopeKind: HistoricalWorkoutAnalyticsScopeKind,
  selection: WorkoutAnalyticsContextSelection,
  currentProgramScope?: WorkoutAnalyticsProgramScope | null,
) => {
  const currentSelection = getSelectionFromProgramScope(currentProgramScope);

  if (scopeKind === 'program') {
    return currentSelection.macrocycleId === selection.macrocycleId;
  }

  if (scopeKind === 'mesocycle') {
    return currentSelection.mesocycleId === selection.mesocycleId;
  }

  return currentSelection.microcycleId === selection.microcycleId;
};
