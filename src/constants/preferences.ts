import { UserPreferences } from '../types';

export const DEFAULT_PREFERENCES: UserPreferences = {
  units: {
    altitude: 'ft',
    speed: 'kts',
    distance: 'nm',
  },
  mapStyle: 'dark',
  notifications: {
    statusChanges: true,
    proximityAlerts: false,
    proximityRadius: 50,
    audibleAlerts: false,
  },
  mapLayers: {
    weather: false,
    airspace: false,
  },
  defaultView: 'global',
};
