export interface UdioConfig {
  apiKey: string;
  bifrostUrl: string;
  bifrostApiKey: string;
  useBifrost: boolean;
}

export interface ThemeConfig {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  backgroundGradient: string;
  fontStyle: string;
  borderRadius: string;
}

export interface GenerationSettings {
  voiceGender: 'male' | 'female' | 'any';
  bpm: number;
  temperature: number;
  customStyles: string[];
}

const DEFAULT_CONFIG: UdioConfig = {
  apiKey: '',
  bifrostUrl: '',
  bifrostApiKey: '',
  useBifrost: false,
};

const DEFAULT_THEME: ThemeConfig = {
  primaryColor: '#6366f1',
  accentColor: '#a855f7',
  backgroundColor: '#09090b',
  backgroundGradient: 'linear-gradient(to bottom, #09090b, #000000)',
  fontStyle: 'Inter',
  borderRadius: '12px',
};

const DEFAULT_GENERATION: GenerationSettings = {
  voiceGender: 'any',
  bpm: 120,
  temperature: 0.8,
  customStyles: [],
};

const STORAGE_KEY = 'aether-music-config';
const THEME_STORAGE_KEY = 'aether-theme-config';
const GENERATION_STORAGE_KEY = 'aether-generation-config';

export const getConfig = (): UdioConfig => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load config:', e);
  }
  return DEFAULT_CONFIG;
};

export const saveConfig = (config: UdioConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save config:', e);
  }
};

export const clearConfig = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const isConfigValid = (config: UdioConfig): boolean => {
  if (config.useBifrost) {
    return !!config.bifrostUrl && !!config.bifrostApiKey;
  }
  return !!config.apiKey;
};

export const getTheme = (): ThemeConfig => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_THEME, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load theme:', e);
  }
  return DEFAULT_THEME;
};

export const saveTheme = (theme: ThemeConfig): void => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
  } catch (e) {
    console.error('Failed to save theme:', e);
  }
};

export const getGenerationSettings = (): GenerationSettings => {
  try {
    const stored = localStorage.getItem(GENERATION_STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_GENERATION, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load generation settings:', e);
  }
  return DEFAULT_GENERATION;
};

export const saveGenerationSettings = (settings: GenerationSettings): void => {
  try {
    localStorage.setItem(GENERATION_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save generation settings:', e);
  }
};
