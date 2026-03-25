import React, { useState, useEffect } from 'react';
import { X, Settings, CheckCircle, XCircle, Loader2, Palette, Music, Sliders, Trash2, Plus } from 'lucide-react';
import { 
  UdioConfig, 
  ThemeConfig, 
  getConfig, 
  saveConfig, 
  isConfigValid,
  getTheme,
  saveTheme,
  getGenerationSettings,
  saveGenerationSettings,
} from '../services/settingsService';
import { setApiKey, setBifrostConfig, testConnection } from '../services/llmService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'api' | 'theme';

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<UdioConfig>(getConfig());
  const [theme, setTheme] = useState<ThemeConfig>(getTheme());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'bifrost' | 'udio'>('bifrost');
  const [settingsTab, setSettingsTab] = useState<Tab>('api');

  useEffect(() => {
    if (isOpen) {
      setConfig(getConfig());
      setTheme(getTheme());
      setTestResult(null);
      setActiveTab(config.useBifrost ? 'bifrost' : 'udio');
    }
  }, [isOpen]);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testConnection(
        activeTab === 'bifrost' ? config.bifrostApiKey : config.apiKey,
        activeTab === 'bifrost' ? config.bifrostUrl : undefined
      );
      setTestResult(result);
    } catch {
      setTestResult(false);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      saveConfig(config);
      saveTheme(theme);
      
      if (config.useBifrost) {
        setBifrostConfig({
          url: config.bifrostUrl,
          apiKey: config.bifrostApiKey,
        });
      } else {
        setApiKey(config.apiKey);
      }
      
      onClose();
    } catch (e) {
      console.error('Failed to save config:', e);
    } finally {
      setSaving(false);
    }
  };

  const toggleUseBifrost = (useBifrost: boolean) => {
    setConfig({ ...config, useBifrost });
    setActiveTab(useBifrost ? 'bifrost' : 'udio');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${theme.primaryColor}33` }}>
              <Settings className="text-indigo-400" size={20} style={{ color: theme.primaryColor }} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Settings</h2>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Configuration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Settings Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSettingsTab('api')}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
              settingsTab === 'api' ? 'text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
            style={{ backgroundColor: settingsTab === 'api' ? theme.primaryColor : undefined }}
          >
            <Sliders size={16} />
            API
          </button>
          <button
            onClick={() => setSettingsTab('theme')}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
              settingsTab === 'theme' ? 'text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
            style={{ backgroundColor: settingsTab === 'theme' ? theme.primaryColor : undefined }}
          >
            <Palette size={16} />
            Theme
          </button>
        </div>

        <div className="space-y-4">
          {settingsTab === 'api' && (
            <>
              {/* Tab Selection */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setActiveTab('bifrost')}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${
                    activeTab === 'bifrost'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  Bifrost
                </button>
                <button
                  onClick={() => setActiveTab('udio')}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${
                    activeTab === 'udio'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  Udio
                </button>
              </div>

              {/* Use Bifrost Toggle */}
              {activeTab === 'bifrost' && (
                <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  <div>
                    <span className="text-sm font-medium">Use Bifrost Server</span>
                    <p className="text-xs text-zinc-500">Route through your custom gateway</p>
                  </div>
                  <button
                    onClick={() => toggleUseBifrost(!config.useBifrost)}
                    className="w-11 h-6 rounded-full transition-colors relative"
                    style={{ backgroundColor: config.useBifrost ? theme.primaryColor : '#3f3f46' }}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        config.useBifrost ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}

              {activeTab === 'bifrost' ? (
                <>
                  <div>
                    <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">
                      Bifrost Server URL
                    </label>
                    <input
                      type="text"
                      value={config.bifrostUrl}
                      onChange={(e) => setConfig({ ...config, bifrostUrl: e.target.value })}
                      placeholder="http://localhost:8080"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">
                      Bifrost API Key
                    </label>
                    <input
                      type="password"
                      value={config.bifrostApiKey}
                      onChange={(e) => setConfig({ ...config, bifrostApiKey: e.target.value })}
                      placeholder="Your Bifrost API key"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">
                      Udio API Key
                    </label>
                    <input
                      type="password"
                      value={config.apiKey}
                      onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      placeholder="sk-..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </>
              )}
            </>
          )}

          {settingsTab === 'theme' && (
            <>
              <div>
                <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">
                  Primary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={theme.primaryColor}
                    onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                    className="w-12 h-12 rounded-xl cursor-pointer border-2 border-zinc-700"
                  />
                  <input
                    type="text"
                    value={theme.primaryColor}
                    onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">
                  Accent Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={theme.accentColor}
                    onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                    className="w-12 h-12 rounded-xl cursor-pointer border-2 border-zinc-700"
                  />
                  <input
                    type="text"
                    value={theme.accentColor}
                    onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">
                  Background Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={theme.backgroundColor}
                    onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                    className="w-12 h-12 rounded-xl cursor-pointer border-2 border-zinc-700"
                  />
                  <input
                    type="text"
                    value={theme.backgroundColor}
                    onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">
                  Border Radius
                </label>
                <select
                  value={theme.borderRadius}
                  onChange={(e) => setTheme({ ...theme, borderRadius: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="0px">Square (0px)</option>
                  <option value="6px">Small (6px)</option>
                  <option value="12px">Medium (12px)</option>
                  <option value="16px">Large (16px)</option>
                  <option value="24px">Round (24px)</option>
                  <option value="9999px">Pill</option>
                </select>
              </div>
            </>
          )}

          {testResult !== null && (
            <div
              className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold ${
                testResult
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}
            >
              {testResult ? (
                <>
                  <CheckCircle size={14} />
                  Connection successful
                </>
              ) : (
                <>
                  <XCircle size={14} />
                  Connection failed - check settings
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          {settingsTab === 'api' && (
            <button
              onClick={handleTest}
              disabled={testing || (activeTab === 'bifrost' ? !config.bifrostUrl : !config.apiKey)}
              className="flex-1 py-3 bg-zinc-800 text-zinc-300 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {testing ? <Loader2 size={14} className="animate-spin" /> : null}
              Test
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || (settingsTab === 'api' && !isConfigValid(config))}
            className="flex-1 py-3 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: theme.primaryColor }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
