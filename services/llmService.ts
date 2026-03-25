const UDIO_BASE_URL = 'https://udioapi.pro/api/v2';

export interface MusicGenerationParams {
  mode: 'inspiration' | 'custom';
  gpt_description_prompt?: string;
  prompt?: string;
  style?: string;
  title?: string;
  model?: string;
  make_instrumental?: boolean;
}

export interface GenerationResponse {
  taskId: string;
}

export interface StatusResponse {
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';
  audio_urls?: string[];
  title?: string;
  prompt?: string;
  style?: string;
  error?: string;
}

export interface CreditsResponse {
  credits: number;
  used_credits: number;
}

export interface BifrostConfig {
  url: string;
  apiKey: string;
}

let apiKey: string = '';
let bifrostConfig: BifrostConfig | null = null;
let useBifrost: boolean = false;

export const setApiKey = (key: string) => {
  apiKey = key;
  useBifrost = false;
  bifrostConfig = null;
};

export const setBifrostConfig = (config: BifrostConfig) => {
  bifrostConfig = config;
  useBifrost = true;
  apiKey = '';
};

export const isConfigured = () => {
  if (useBifrost && bifrostConfig) {
    return !!bifrostConfig.url && !!bifrostConfig.apiKey;
  }
  return !!apiKey;
};

const getBaseUrl = () => {
  if (useBifrost && bifrostConfig) {
    return bifrostConfig.url;
  }
  return UDIO_BASE_URL;
};

const getAuthHeader = () => {
  if (useBifrost && bifrostConfig) {
    return { 'Authorization': `Bearer ${bifrostConfig.apiKey}` };
  }
  return { 'Authorization': `Bearer ${apiKey}` };
};

const headers = () => ({
  ...getAuthHeader(),
  'Content-Type': 'application/json',
});

export const generateMusic = async (params: MusicGenerationParams): Promise<GenerationResponse> => {
  if (!isConfigured()) throw new Error('API not configured');

  const baseUrl = getBaseUrl();
  
  if (useBifrost && bifrostConfig) {
    const payload = {
      model: params.model || 'chirp-v3-5',
      make_instrumental: params.make_instrumental || false,
    };

    if (params.mode === 'inspiration') {
      (payload as Record<string, unknown>).gpt_description_prompt = params.gpt_description_prompt;
    } else {
      (payload as Record<string, unknown>).prompt = params.prompt;
      (payload as Record<string, unknown>).style = params.style || '';
      (payload as Record<string, unknown>).title = params.title || '';
    }

    const response = await fetch(`${baseUrl}/generate`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Generation failed');
    }

    return { taskId: data.data?.task_id || data.taskId };
  }

  const payload: Record<string, unknown> = {
    model: params.model || 'chirp-v3-5',
    make_instrumental: params.make_instrumental || false,
  };

  if (params.mode === 'inspiration') {
    payload.gpt_description_prompt = params.gpt_description_prompt;
  } else {
    payload.prompt = params.prompt;
    payload.style = params.style || '';
    payload.title = params.title || '';
  }

  const response = await fetch(`${baseUrl}/generate`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Generation failed');
  }

  return { taskId: data.data.task_id };
};

export const checkStatus = async (taskId: string): Promise<StatusResponse> => {
  if (!isConfigured()) throw new Error('API not configured');

  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/status?task_id=${taskId}`, {
    method: 'GET',
    headers: headers(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Status check failed');
  }

  return {
    status: data.data?.status || data.status,
    audio_urls: data.data?.audio_urls || data.audio_urls,
    title: data.data?.title || data.title,
    prompt: data.data?.prompt || data.prompt,
    style: data.data?.style || data.style,
    error: data.data?.error || data.error,
  };
};

export const getCredits = async (): Promise<CreditsResponse> => {
  if (!isConfigured()) throw new Error('API not configured');

  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/credits`, {
    method: 'GET',
    headers: headers(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to get credits');
  }

  return {
    credits: data.data?.credits ?? 0,
    used_credits: data.data?.used_credits ?? 0,
  };
};

export const extendMusic = async (taskId: string): Promise<GenerationResponse> => {
  if (!isConfigured()) throw new Error('API not configured');

  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/extend/generate`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ taskId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Extend failed');
  }

  return { taskId: data.data?.task_id || data.taskId };
};

export const remixMusic = async (taskId: string): Promise<GenerationResponse> => {
  if (!isConfigured()) throw new Error('API not configured');

  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/remix/generate`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ taskId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Remix failed');
  }

  return { taskId: data.data?.task_id || data.taskId };
};

export const downloadAudio = async (url: string): Promise<Blob> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to download audio');
  }
  return response.blob();
};

export const testConnection = async (key?: string, baseUrl?: string): Promise<boolean> => {
  try {
    const url = baseUrl || UDIO_BASE_URL;
    const authKey = key || (bifrostConfig?.apiKey) || apiKey;
    
    const response = await fetch(`${url}/credits`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authKey}`,
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch {
    return false;
  }
};
