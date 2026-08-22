import { useEffect, useReducer } from 'react';
import { getRecentReports } from '../services/reportService';
import { getUserTrustStatus } from '../services/trustService';

const initialState = {
  reports: [],
  trustStatus: null,
  loading: true,
};

function homePageReducer(state, action) {
  switch (action.type) {
    case 'loaded':
      return {
        reports: action.reports,
        trustStatus: action.trustStatus,
        loading: false,
      };
    case 'reset':
      return initialState;
    default:
      return state;
  }
}

export function useHomePageData(user, refreshKey) {
  const [state, dispatch] = useReducer(homePageReducer, initialState);

  useEffect(() => {
    let cancelled = false;

    dispatch({ type: 'reset' });

    Promise.all([getRecentReports(3), getUserTrustStatus(user)])
      .then(([recentReports, trustStatus]) => {
        if (cancelled) return;
        dispatch({ type: 'loaded', reports: recentReports, trustStatus });
      })
      .catch(() => {
        if (cancelled) return;
        dispatch({ type: 'loaded', reports: [], trustStatus: null });
      });

    return () => {
      cancelled = true;
    };
  }, [user, refreshKey]);

  return state;
}
