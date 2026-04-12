import { create } from 'zustand';
import { fetchCareTeamDomainSummaries } from '../services/careTeam';
import type {
  AssignedProfessionalDomain,
  AssignedProfessionalSummary,
} from '../types';

type CareTeamSummaryMap = Record<
  AssignedProfessionalDomain,
  AssignedProfessionalSummary | null
>;
type CareTeamErrorMap = Record<AssignedProfessionalDomain, string | null>;

interface CareTeamState {
  requestKey: string | null;
  hasLoaded: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  summaries: CareTeamSummaryMap;
  errors: CareTeamErrorMap;
  loadCareTeam: (
    clientId: string,
    options?: { dateKey?: string; force?: boolean },
  ) => Promise<void>;
  reset: () => void;
}

const createEmptySummaryMap = (): CareTeamSummaryMap => ({
  training: null,
  nutrition: null,
});

const createEmptyErrorMap = (): CareTeamErrorMap => ({
  training: null,
  nutrition: null,
});

let inFlightRequest: Promise<void> | null = null;
let inFlightRequestKey: string | null = null;

export const useCareTeamStore = create<CareTeamState>((set, get) => ({
  requestKey: null,
  hasLoaded: false,
  isLoading: false,
  isRefreshing: false,
  summaries: createEmptySummaryMap(),
  errors: createEmptyErrorMap(),

  loadCareTeam: async (clientId, options) => {
    const dateKey = options?.dateKey?.trim();
    if (!clientId || !dateKey) {
      return;
    }

    const requestKey = `${clientId}:${dateKey}`;
    const { requestKey: previousRequestKey, hasLoaded } = get();
    const isSameRequest = previousRequestKey === requestKey;

    if (!options?.force && isSameRequest && hasLoaded) {
      return;
    }

    if (inFlightRequest && inFlightRequestKey === requestKey) {
      return inFlightRequest;
    }

    set((state) => ({
      isLoading: !state.hasLoaded || !isSameRequest,
      isRefreshing: state.hasLoaded && isSameRequest,
      requestKey,
      ...(state.hasLoaded && isSameRequest
        ? {}
        : {
            summaries: createEmptySummaryMap(),
            errors: createEmptyErrorMap(),
          }),
    }));

    inFlightRequestKey = requestKey;
    inFlightRequest = (async () => {
      const results = await fetchCareTeamDomainSummaries(clientId, dateKey);

      set({
        requestKey,
        hasLoaded: true,
        isLoading: false,
        isRefreshing: false,
        summaries: {
          training: results.training.summary,
          nutrition: results.nutrition.summary,
        },
        errors: {
          training: results.training.error,
          nutrition: results.nutrition.error,
        },
      });
    })();

    try {
      await inFlightRequest;
    } finally {
      if (inFlightRequestKey === requestKey) {
        inFlightRequest = null;
        inFlightRequestKey = null;
      }
    }
  },

  reset: () => {
    inFlightRequest = null;
    inFlightRequestKey = null;

    set({
      requestKey: null,
      hasLoaded: false,
      isLoading: false,
      isRefreshing: false,
      summaries: createEmptySummaryMap(),
      errors: createEmptyErrorMap(),
    });
  },
}));
