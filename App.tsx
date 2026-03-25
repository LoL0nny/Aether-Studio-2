import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Download,
  RefreshCw,
  Plus,
  Settings,
  Loader2,
  Music2,
  ChevronDown,
  Library,
  PlusCircle,
  X,
  Upload,
  Mic,
  Volume2,
  Waves,
  Headphones,
  Sparkles,
  Wand2,
  Trash2,
  Bookmark,
} from 'lucide-react';
import {
  generateMusic,
  checkStatus,
  extendMusic,
  remixMusic,
  downloadAudio,
  setApiKey,
  setBifrostConfig,
  getCredits,
  MusicGenerationParams,
} from './services/llmService';
import { 
  getConfig, 
  isConfigValid, 
  getTheme, 
  getGenerationSettings,
  saveGenerationSettings,
  ThemeConfig,
  GenerationSettings,
} from './services/settingsService';
import SettingsModal from './components/SettingsModal';

interface GeneratedSong {
  id: string;
  title: string;
  prompt: string;
  style: string;
  audioUrl: string;
  taskId: string;
}

const MODELS = [
  { id: 'chirp-v3-5', name: 'v3.5', credits: 5 },
  { id: 'chirp-v4-0', name: 'v4.0', credits: 8 },
  { id: 'chirp-v4-5', name: 'v4.5', credits: 10 },
  { id: 'chirp-v4-5-plus', name: 'v4.5+', credits: 10 },
  { id: 'chirp-v5', name: 'v5', credits: 12 },
];

const STYLE_PRESETS = [
  'Pop', 'Rock', 'EDM', 'Jazz', 'Lo-fi', 'Classical',
  'Hip-hop', 'R&B', 'Country', 'Metal', 'Acoustic', 'Electronic',
];

const App: React.FC = () => {
  const [customMode, setCustomMode] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [title, setTitle] = useState('');
  const [style, setStyle] = useState('');
  const [selectedModel, setSelectedModel] = useState('chirp-v3-5');
  const [isInstrumental, setIsInstrumental] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  const [songs, setSongs] = useState<GeneratedSong[]>([]);
  const [currentSong, setCurrentSong] = useState<GeneratedSong | null>(null);
  const [currentVersion, setCurrentVersion] = useState<0 | 1>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [credits, setCredits] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  
  // New features
  const [theme, setTheme] = useState<ThemeConfig>(getTheme());
  const [genSettings, setGenSettings] = useState<GenerationSettings>(getGenerationSettings());
  const [uploadedAudio, setUploadedAudio] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [bpmInput, setBpmInput] = useState(genSettings.bpm);
  const [tempInput, setTempInput] = useState(genSettings.temperature);
  const [showStylePicker, setShowStylePicker] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadedTheme = getTheme();
    const loadedGenSettings = getGenerationSettings();
    setTheme(loadedTheme);
    setGenSettings(loadedGenSettings);
    setBpmInput(loadedGenSettings.bpm);
    setTempInput(loadedGenSettings.temperature);
    
    const config = getConfig();
    if (isConfigValid(config)) {
      if (config.useBifrost && config.bifrostUrl && config.bifrostApiKey) {
        setBifrostConfig({
          url: config.bifrostUrl,
          apiKey: config.bifrostApiKey,
        });
      } else if (config.apiKey) {
        setApiKey(config.apiKey);
      }
      setIsConfigured(true);
      fetchCredits();
    }
  }, []);

  const fetchCredits = async () => {
    try {
      const creds = await getCredits();
      setCredits(creds.credits);
    } catch (e) {
      console.error('Failed to fetch credits:', e);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedAudio(file);
      const url = URL.createObjectURL(file);
      setAudioPreview(url);
    }
  };

  const clearUploadedAudio = () => {
    setUploadedAudio(null);
    if (audioPreview) {
      URL.revokeObjectURL(audioPreview);
      setAudioPreview(null);
    }
  };

  const handleGenerate = async () => {
    if (!isConfigured) {
      setSettingsOpen(true);
      return;
    }

    const promptText = customMode ? lyrics : prompt;
    if (!promptText.trim()) {
      setError(customMode ? 'Please enter lyrics' : 'Please enter a description');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratingId(crypto.randomUUID());

    try {
      const styleWithBpm = style 
        ? `${style}, ${bpmInput} bpm`
        : `${bpmInput} bpm`;

      const params: MusicGenerationParams = {
        mode: customMode ? 'custom' : 'inspiration',
        gpt_description_prompt: !customMode ? prompt : undefined,
        prompt: customMode ? lyrics : undefined,
        style: styleWithBpm,
        title: title,
        model: selectedModel,
        make_instrumental: isInstrumental,
      };

      const { taskId } = await generateMusic(params);

      let status = await checkStatus(taskId);
      let attempts = 0;
      const maxAttempts = 120;

      while (status.status !== 'SUCCESS' && status.status !== 'FAILED' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        status = await checkStatus(taskId);
        attempts++;
        setGenerationStatus(`Generating... ${Math.round((attempts / maxAttempts) * 100)}%`);
      }

      if (status.status === 'SUCCESS' && status.audio_urls && status.audio_urls.length > 0) {
        const newSongs: GeneratedSong[] = status.audio_urls.map((url, idx) => ({
          id: `${taskId}-${idx}`,
          title: status.title || (customMode ? title || 'Untitled' : 'Untitled'),
          prompt: status.prompt || prompt,
          style: status.style || styleWithBpm,
          audioUrl: url,
          taskId,
        }));
        
        setSongs(prev => [...newSongs, ...prev]);
        setCurrentSong(newSongs[0]);
        setCurrentVersion(0);
        fetchCredits();
      } else {
        throw new Error(status.error || 'Generation failed');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
      setGeneratingId(null);
      setGenerationStatus('');
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !currentSong) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleRemix = async () => {
    if (!currentSong) return;

    setIsGenerating(true);
    setError(null);

    try {
      const { taskId } = await remixMusic(currentSong.taskId);
      
      let status = await checkStatus(taskId);
      let attempts = 0;
      const maxAttempts = 120;

      while (status.status !== 'SUCCESS' && status.status !== 'FAILED' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        status = await checkStatus(taskId);
        attempts++;
      }

      if (status.status === 'SUCCESS' && status.audio_urls && status.audio_urls.length > 0) {
        const newSongs: GeneratedSong[] = status.audio_urls.map((url, idx) => ({
          id: `${taskId}-${idx}`,
          title: status.title || `${currentSong.title} (Remix)`,
          prompt: status.prompt || currentSong.prompt,
          style: status.style || currentSong.style,
          audioUrl: url,
          taskId,
        }));
        
        setSongs(prev => [...newSongs, ...prev]);
        setCurrentSong(newSongs[0]);
        setCurrentVersion(0);
        fetchCredits();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Remix failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExtend = async () => {
    if (!currentSong) return;

    setIsGenerating(true);
    setError(null);

    try {
      const { taskId } = await extendMusic(currentSong.taskId);
      
      let status = await checkStatus(taskId);
      let attempts = 0;
      const maxAttempts = 120;

      while (status.status !== 'SUCCESS' && status.status !== 'FAILED' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        status = await checkStatus(taskId);
        attempts++;
      }

      if (status.status === 'SUCCESS' && status.audio_urls && status.audio_urls.length > 0) {
        const newSong: GeneratedSong = {
          id: `${taskId}-0`,
          title: `${currentSong.title} (Extended)`,
          prompt: currentSong.prompt,
          style: currentSong.style,
          audioUrl: status.audio_urls[0],
          taskId,
        };
        
        setSongs(prev => [newSong, ...prev]);
        setCurrentSong(newSong);
        setCurrentVersion(0);
        fetchCredits();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Extend failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (song?: GeneratedSong) => {
    const targetSong = song || currentSong;
    if (!targetSong) return;

    try {
      const blob = await downloadAudio(targetSong.audioUrl);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${targetSong.title}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError('Download failed');
    }
  };

  const selectSong = (song: GeneratedSong, version: 0 | 1) => {
    setCurrentSong(song);
    setCurrentVersion(version);
    setIsPlaying(false);
    setProgress(0);
  };

  const toggleStyle = (preset: string) => {
    setStyle(prev => prev ? `${prev}, ${preset}` : preset);
  };

  const addCustomStyle = (customStyle: string) => {
    setStyle(prev => prev ? `${prev}, ${customStyle}` : customStyle);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const groupedSongs: Record<string, GeneratedSong[]> = {};
  songs.forEach(song => {
    const baseId = song.taskId;
    if (!groupedSongs[baseId]) {
      groupedSongs[baseId] = [];
    }
    groupedSongs[baseId].push(song);
  });

  const primaryColor = theme.primaryColor;
  const accentColor = theme.accentColor;

  return (
    <div 
      className="h-screen text-white flex flex-col overflow-hidden"
      style={{ 
        background: theme.backgroundGradient || theme.backgroundColor,
        fontFamily: theme.fontStyle,
      }}
    >
      <audio
        ref={audioRef}
        src={currentSong?.audioUrl}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setProgress(audioRef.current.currentTime);
          }
        }}
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
          }
        }}
      />

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-30" style={{
          background: `radial-gradient(circle at 20% 80%, ${primaryColor}40 0%, transparent 50%),
                       radial-gradient(circle at 80% 20%, ${accentColor}40 0%, transparent 50%)`,
        }} />
        <div className="absolute inset-0 animate-pulse" style={{
          background: `radial-gradient(circle at 50% 50%, ${primaryColor}10 0%, transparent 70%)`,
        }} />
      </div>

      {/* Header */}
      <header className="relative flex items-center justify-between px-6 py-4 border-b border-zinc-800/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center animate-pulse"
              style={{ 
                background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                boxShadow: `0 0 30px ${primaryColor}60`,
              }}
            >
              <Music2 size={20} className="text-white" />
            </div>
            <span 
              className="text-2xl font-black tracking-wider"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              AETHER
            </span>
          </div>
          
          <button
            onClick={() => setShowLibrary(false)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              !showLibrary 
                ? 'shadow-lg' 
                : 'text-zinc-400 hover:text-white'
            }`}
            style={{ 
              backgroundColor: !showLibrary ? primaryColor : 'transparent',
              boxShadow: !showLibrary ? `0 0 20px ${primaryColor}40` : 'none',
            }}
          >
            Create
          </button>
          <button
            onClick={() => setShowLibrary(true)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              showLibrary 
                ? 'shadow-lg' 
                : 'text-zinc-400 hover:text-white'
            }`}
            style={{ 
              backgroundColor: showLibrary ? primaryColor : 'transparent',
              boxShadow: showLibrary ? `0 0 20px ${primaryColor}40` : 'none',
            }}
          >
            <Library size={16} className="inline mr-2" />
            Library
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div 
            className="px-4 py-2 rounded-xl border"
            style={{ 
              borderColor: `${primaryColor}50`,
              backgroundColor: `${primaryColor}10`,
            }}
          >
            <span className="text-xs text-zinc-400 uppercase tracking-widest">Credits: </span>
            <span className="text-lg font-bold" style={{ color: primaryColor }}>{credits ?? '--'}</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900/80 backdrop-blur rounded-xl border border-zinc-700 hover:border-zinc-500 transition-colors"
            >
              <Sparkles size={14} style={{ color: primaryColor }} />
              <span className="text-sm font-medium">{MODELS.find(m => m.id === selectedModel)?.name}</span>
              <ChevronDown size={14} />
            </button>
            {modelDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden z-50 shadow-xl">
                {MODELS.map(model => (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model.id);
                      setModelDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-sm hover:bg-zinc-800 transition-colors flex justify-between items-center ${
                      selectedModel === model.id ? 'bg-zinc-800' : ''
                    }`}
                  >
                    <span className="font-medium">{model.name}</span>
                    <span className="text-xs text-zinc-500">{model.credits}cr</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 bg-zinc-900/80 backdrop-blur hover:bg-zinc-800 rounded-xl transition-colors border border-zinc-700"
            style={{ borderColor: `${primaryColor}30` }}
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      {!showLibrary ? (
        <div className="relative flex-1 flex overflow-hidden">
          {/* Left Panel - Create */}
          <div className="w-[420px] border-r border-zinc-800/50 p-5 overflow-y-auto bg-zinc-950/30 backdrop-blur-sm">
            <div className="space-y-4">
              {/* Mode Toggle */}
              <div 
                className="p-1 rounded-xl flex"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <button
                  onClick={() => setCustomMode(false)}
                  className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${
                    !customMode ? 'shadow-lg' : 'text-zinc-400'
                  }`}
                  style={{ 
                    backgroundColor: !customMode ? primaryColor : 'transparent',
                  }}
                >
                  <Wand2 size={16} className="inline mr-2" />
                  Quick
                </button>
                <button
                  onClick={() => setCustomMode(true)}
                  className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${
                    customMode ? 'shadow-lg' : 'text-zinc-400'
                  }`}
                  style={{ 
                    backgroundColor: customMode ? primaryColor : 'transparent',
                  }}
                >
                  <Mic size={16} className="inline mr-2" />
                  Custom
                </button>
              </div>

              {/* Voice Settings */}
              <div className="p-4 rounded-xl border" style={{ borderColor: `${primaryColor}30`, backgroundColor: `${primaryColor}05` }}>
                <button 
                  onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                  className="flex items-center justify-between w-full"
                >
                  <div className="flex items-center gap-2">
                    <Headphones size={16} style={{ color: primaryColor }} />
                    <span className="text-sm font-medium">Voice & Tempo</span>
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={`transition-transform ${showVoiceSettings ? 'rotate-180' : ''}`}
                  />
                </button>
                
                {showVoiceSettings && (
                  <div className="mt-4 space-y-4">
                    {/* Voice Gender */}
                    <div>
                      <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Voice</label>
                      <div className="flex gap-2">
                        {(['male', 'female', 'any'] as const).map((gender) => (
                          <button
                            key={gender}
                            onClick={() => setGenSettings({ ...genSettings, voiceGender: gender })}
                            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize"
                            style={{ 
                              backgroundColor: genSettings.voiceGender === gender ? primaryColor : '#27272a',
                              color: genSettings.voiceGender === gender ? 'white' : '#a1a1aa',
                            }}
                          >
                            {gender === 'any' ? 'Any' : gender}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* BPM */}
                    <div>
                      <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 flex justify-between">
                        <span>BPM</span>
                        <span style={{ color: primaryColor }}>{bpmInput}</span>
                      </label>
                      <input
                        type="range"
                        min="60"
                        max="200"
                        value={bpmInput}
                        onChange={(e) => {
                          setBpmInput(parseInt(e.target.value));
                          setGenSettings({ ...genSettings, bpm: parseInt(e.target.value) });
                        }}
                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        style={{ accentColor: primaryColor }}
                      />
                    </div>

                    {/* Temperature */}
                    <div>
                      <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 flex justify-between">
                        <span>Creativity</span>
                        <span style={{ color: primaryColor }}>{tempInput.toFixed(1)}</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={tempInput}
                        onChange={(e) => {
                          setTempInput(parseFloat(e.target.value));
                          setGenSettings({ ...genSettings, temperature: parseFloat(e.target.value) });
                        }}
                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        style={{ accentColor: primaryColor }}
                      />
                      <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                        <span>Precise</span>
                        <span>Balanced</span>
                        <span>Creative</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Audio Upload */}
              <div className="p-4 rounded-xl border" style={{ borderColor: `${accentColor}30`, backgroundColor: `${accentColor}05` }}>
                <div className="flex items-center gap-2 mb-3">
                  <Upload size={16} style={{ color: accentColor }} />
                  <span className="text-sm font-medium">Audio Reference (Optional)</span>
                </div>
                
                {uploadedAudio ? (
                  <div className="flex items-center gap-3 p-3 bg-zinc-900 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm truncate">{uploadedAudio.name}</p>
                      <p className="text-xs text-zinc-500">{(uploadedAudio.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button 
                      onClick={clearUploadedAudio}
                      className="p-1 hover:bg-zinc-800 rounded"
                    >
                      <X size={16} />
                    </button>
                    {audioPreview && (
                      <audio src={audioPreview} controls className="h-8 w-32" />
                    )}
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer hover:border-zinc-500 transition-colors">
                    <Upload size={24} className="text-zinc-500 mb-2" />
                    <span className="text-xs text-zinc-500">Drop audio or click to upload</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Prompt/Lyrics */}
              <div>
                <textarea
                  value={customMode ? lyrics : prompt}
                  onChange={(e) => customMode ? setLyrics(e.target.value) : setPrompt(e.target.value)}
                  placeholder={customMode 
                    ? 'Enter your lyrics here...\n\n[Verse]\nYour lyrics here\n\n[Chorus]\nMore lyrics' 
                    : 'Describe your song...\n\nExample: An upbeat electro-pop song about summer vibes, catchy melody, 120 BPM'
                  }
                  className="w-full h-36 bg-zinc-900/80 border border-zinc-700 rounded-xl px-4 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:border-indigo-500 resize-none backdrop-blur"
                  style={{ 
                    borderColor: `${primaryColor}30`,
                    '&:focus': { boxShadow: `0 0 0 2px ${primaryColor}40` },
                  }}
                />
              </div>

              {/* Title */}
              <div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Song title (optional)"
                  className="w-full bg-zinc-900/80 border border-zinc-700 rounded-xl px-4 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:border-indigo-500 backdrop-blur"
                  style={{ borderColor: `${primaryColor}30` }}
                />
              </div>

              {/* Style */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <input
                    type="text"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    placeholder="Style (e.g., pop, upbeat, electronic)"
                    className="flex-1 bg-zinc-900/80 border border-zinc-700 rounded-xl px-4 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:border-indigo-500 backdrop-blur mr-2"
                    style={{ borderColor: `${primaryColor}30` }}
                  />
                  <button
                    onClick={() => {
                      const newStyle = style.trim();
                      if (newStyle && !genSettings.customStyles.includes(newStyle)) {
                        const updated = { ...genSettings, customStyles: [...genSettings.customStyles, newStyle] };
                        setGenSettings(updated);
                        saveGenerationSettings(updated);
                      }
                    }}
                    className="p-3 rounded-xl transition-colors"
                    style={{ backgroundColor: `${primaryColor}30` }}
                    title="Save to library"
                  >
                    <Bookmark size={18} style={{ color: primaryColor }} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {STYLE_PRESETS.map(preset => (
                    <button
                      key={preset}
                      onClick={() => toggleStyle(preset)}
                      className="px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 rounded-full text-xs text-zinc-300 hover:text-white transition-colors backdrop-blur"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                
                {/* Custom Style Library */}
                {genSettings.customStyles.length > 0 && (
                  <div className="p-3 rounded-xl" style={{ backgroundColor: `${primaryColor}10`, border: `1px solid ${primaryColor}20` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Bookmark size={12} style={{ color: primaryColor }} />
                      <span className="text-xs uppercase tracking-wider" style={{ color: primaryColor }}>My Styles</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {genSettings.customStyles.map((customStyle, idx) => (
                        <button
                          key={`custom-${idx}`}
                          onClick={() => addCustomStyle(customStyle)}
                          onDoubleClick={() => {
                            const updated = {
                              ...genSettings,
                              customStyles: genSettings.customStyles.filter((_, i) => i !== idx),
                            };
                            setGenSettings(updated);
                            saveGenerationSettings(updated);
                          }}
                          className="px-3 py-1.5 rounded-full text-xs transition-colors backdrop-blur flex items-center gap-1"
                          style={{ 
                            backgroundColor: `${accentColor}30`, 
                            color: accentColor,
                            border: `1px solid ${accentColor}50`,
                          }}
                        >
                          {customStyle}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-2">Click to add • Double-click to remove</p>
                  </div>
                )}
              </div>

              {/* Instrumental Toggle */}
              <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl">
                <span className="text-sm text-zinc-400">Instrumental (no vocals)</span>
                <button
                  onClick={() => setIsInstrumental(!isInstrumental)}
                  className="w-12 h-6 rounded-full transition-colors relative"
                  style={{ backgroundColor: isInstrumental ? primaryColor : '#3f3f46' }}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      isInstrumental ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div 
                  className="p-3 rounded-xl text-sm"
                  style={{ 
                    backgroundColor: '#ef444420',
                    border: '1px solid #ef444440',
                    color: '#ef4444',
                  }}
                >
                  {error}
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                  boxShadow: `0 0 30px ${primaryColor}40`,
                }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    {generationStatus || 'Creating...'}
                  </>
                ) : (
                  <>
                    <PlusCircle size={20} />
                    Generate Song
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="flex-1 p-6 overflow-y-auto">
            {songs.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div 
                    className="w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center animate-pulse"
                    style={{ 
                      background: `linear-gradient(135deg, ${primaryColor}20, ${accentColor}20)`,
                      border: `2px solid ${primaryColor}30`,
                    }}
                  >
                    <Waves size={40} style={{ color: primaryColor }} />
                  </div>
                  <p className="text-xl font-bold mb-2">Ready to Create</p>
                  <p className="text-zinc-500">Enter a description and click Generate</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedSongs).map(([baseId, group]) => (
                  <div 
                    key={baseId} 
                    className="p-5 rounded-2xl border backdrop-blur-sm"
                    style={{ 
                      backgroundColor: `${primaryColor}05`,
                      borderColor: `${primaryColor}20`,
                      boxShadow: `0 0 40px ${primaryColor}10`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg">{group[0].title}</h3>
                      <div className="flex items-center gap-2">
                        {group.map((song, idx) => (
                          <button
                            key={song.id}
                            onClick={() => selectSong(song, idx as 0 | 1)}
                            className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
                            style={{ 
                              backgroundColor: currentSong?.id === song.id ? primaryColor : '#27272a',
                              color: currentSong?.id === song.id ? 'white' : '#a1a1aa',
                            }}
                          >
                            v{idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-zinc-500 mb-4">{group[0].style || group[0].prompt.slice(0, 100)}</p>

                    <div className="flex items-center gap-4 mb-4">
                      <button
                        onClick={handlePlayPause}
                        className="w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-lg"
                        style={{ 
                          background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                          boxShadow: `0 0 20px ${primaryColor}40`,
                        }}
                      >
                        {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                      </button>
                      <div className="flex-1">
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ 
                              width: `${duration ? (progress / duration) * 100 : 0}%`,
                              background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-zinc-500 font-mono">
                          <span>{formatTime(progress)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => handleDownload()}
                        className="py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        <Download size={16} />
                        Download
                      </button>
                      <button
                        onClick={handleRemix}
                        disabled={isGenerating}
                        className="py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <RefreshCw size={16} />
                        Remix
                      </button>
                      <button
                        onClick={handleExtend}
                        disabled={isGenerating}
                        className="py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Plus size={16} />
                        Extend
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Library View */
        <div className="relative flex-1 p-6 overflow-y-auto">
          {songs.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Library size={48} className="mx-auto mb-4 text-zinc-600" />
                <p className="text-xl font-bold mb-2">Your Library is Empty</p>
                <p className="text-zinc-500">Create some songs to see them here</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {songs.map((song, idx) => (
                <div 
                  key={song.id} 
                  className="p-4 rounded-xl border backdrop-blur-sm"
                  style={{ 
                    backgroundColor: `${primaryColor}05`,
                    borderColor: `${primaryColor}20`,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold truncate">{song.title}</h3>
                    <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: `${primaryColor}30`, color: primaryColor }}>
                      v{idx % 2 + 1}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mb-3 truncate">{song.style || song.prompt.slice(0, 50)}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setCurrentSong(song); setCurrentVersion(idx % 2 as 0 | 1); setShowLibrary(false); }}
                      className="flex-1 py-2 rounded-lg text-sm font-bold transition-colors"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Play
                    </button>
                    <button
                      onClick={() => handleDownload(song)}
                      className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          setTheme(getTheme());
          setGenSettings(getGenerationSettings());
          const config = getConfig();
          if (isConfigValid(config)) {
            if (config.useBifrost && config.bifrostUrl && config.bifrostApiKey) {
              setBifrostConfig({
                url: config.bifrostUrl,
                apiKey: config.bifrostApiKey,
              });
            } else if (config.apiKey) {
              setApiKey(config.apiKey);
            }
            setIsConfigured(true);
            fetchCredits();
          }
        }}
      />
    </div>
  );
};

export default App;
