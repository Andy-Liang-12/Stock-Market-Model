import React, { useState } from 'react';
import { Settings, X, RefreshCw, DollarSign, Zap, TrendingUp, AlertTriangle } from 'lucide-react';

// TODO: Settings should only update when the user clicks "Apply Settings"
// Currently, it updates immediately on input change, which can be disruptive
// Consider adding a "Save" button to apply changes at once
const SettingsPanel = ({ 
  gameSettings,
  onSettingsChange,
  onResetGame,
  onAddFunds,
  onOpenSettings,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('game');

  const handleSettingChange = (category, key, value) => {
    onSettingsChange({
      ...gameSettings,
      [category]: {
        ...gameSettings[category],
        [key]: value
      }
    });
  };

  const handleResetConfirm = () => {
    if (window.confirm('Are you sure you want to reset the game? This will clear all progress.')) {
      onResetGame();
      setIsOpen(false);
    }
  };

  const tabs = [
    { id: 'game', label: 'Game', icon: DollarSign },
    { id: 'market', label: 'Market', icon: TrendingUp },
    { id: 'events', label: 'Events', icon: Zap },
    { id: 'advanced', label: 'Advanced', icon: Settings },
    { id: 'cheats', label: 'Cheats', icon: AlertTriangle },
  ];

  // Game Settings: Starting Cash, Available Funds, Game (Tick) Speed, Trading Fees, Short Selling
  const renderGameSettings = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-3">Game Settings</h3>
      <div className="grid grid-cols-2 gap-4">
        {/* Starting Cash */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">Starting Cash ($)</label>
          <input
            type="number"
            value={gameSettings.game.startingCash}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              handleSettingChange('game', 'startingCash', isNaN(value) ? 100000 : value);
            }}
            className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            min="0"
            max="1000000"
            step="1000"
          />
        </div>

        {/* Tick Speed */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">Tick Speed (ms)</label>
          <input
            type="number"
            value={gameSettings.game.tickInterval}
            onChange={e => {
              const value = parseInt(e.target.value);
              handleSettingChange('game', 'tickInterval', isNaN(value) ? 500 : value);
            }}
            className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            min="100"
            max="5000"
            step="10"
          />
        </div>
      </div>

      {/* Trading Fee Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-sm text-gray-300">Enable Trading Fees</label>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={gameSettings.game.tradingFeesEnabled}
            onChange={() =>
              handleSettingChange(
                'game',
                'tradingFeesEnabled',
                !gameSettings.game.tradingFeesEnabled
              )
            }
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-600 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
        </label>
      </div>

      {/* Trading Fee Input */}
      {gameSettings.game.tradingFeesEnabled && (
        <div>
          <label className="block text-sm text-gray-300 mb-2">Trading Fee (%)</label>
          <input
            type="number"
            value={gameSettings.game.tradingFeePercent}
            onChange={e => {
              const value = parseFloat(e.target.value);
              handleSettingChange('game', 'tradingFeePercent', isNaN(value) ? 0.1 : value);
            }}
            className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            min="0"
            max="5"
            step="0.1"
          />
        </div>
      )}

      {/* Short Selling Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-sm text-gray-300">Allow Short Selling</label>
        
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={gameSettings.game.allowShortSelling}
            onChange={() =>
              handleSettingChange(
                'game',
                'allowShortSelling',
                !gameSettings.game.allowShortSelling
              )
            }
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-600 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
        </label>
      </div>
    </div>
  );

  // Market Settings: Initial Regime, Volatility Multiplier, Initial Sentiment, Regime Change Probability, Agent Trading
  const renderMarketSettings = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-3">Market Settings</h3>

      
      <div className="grid grid-cols-2 gap-4">
        {/* Initial Market Regime */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">Initial Market Regime</label>
          <select
            value={gameSettings.market.initialRegime}
            onChange={(e) => handleSettingChange('market', 'initialRegime', e.target.value)}
            className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="Bull">Bull Market</option>
            <option value="Bear">Bear Market</option>
            <option value="Volatile">Volatile Market</option>
          </select>
        </div>

        {/* Volatility Multiplier */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">Base Volatility Multiplier</label>
          <input
            type="number"
            value={gameSettings.market.volatilityMultiplier}
            onChange={e => {
              const value = parseFloat(e.target.value);
              handleSettingChange('market', 'volatilityMultiplier', isNaN(value) ? 1.0 : value);
            }}
            className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            min="0.1"
            max="5.0"
            step="0.1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Initial Sentiment*/}
        <div>
          <label className="block text-sm text-gray-300 mb-2">Initial Sentiment</label>
          <input
            type="number"
            value={gameSettings.market.initialSentiment}
            onChange={e => {
              const value = parseFloat(e.target.value);
              handleSettingChange('market', 'initialSentiment', isNaN(value) ? 0 : value);
            }}
            className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            min="-1"
            max="1"
            step="0.1"
          />
        </div>

        {/* Regime Change Probability */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">Regime Change Probability (%)</label>
          <input
            type="number"
            value={gameSettings.market.regimeChangeProbability * 100}
            onChange={e => {
              const value = parseFloat(e.target.value);
              handleSettingChange('market', 'regimeChangeProbability', isNaN(value) ? 0.05 : value / 100);
            }}
            className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            min="0"
            max="50"
            step="1"
          />
        </div>
      </div>

      {/* Agent Trading Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-sm text-gray-300">Enable Agent Trading</label>
        
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={gameSettings.market.enableAgentTrading}
            onChange={() =>
              handleSettingChange(
                'market',
                'enableAgentTrading',
                !gameSettings.market.enableAgentTrading
              )
            }
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-600 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
        </label>
      </div>
    </div>
  );

  // Events Settings: Enable News Events, Event Probability, Impact Multiplier, Auto-Continue, Auto-Continue Delay
  const renderEventsSettings = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-3">Events Settings</h3>

      {/* Enable News Events */}
      <div className="flex items-center justify-between">
        <label className="text-sm text-gray-300">Enable News Events</label>
        
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={gameSettings.events.enabled}
            onChange={() =>
              handleSettingChange(
                'events',
                'enabled',
                !gameSettings.events.enabled
              )
            }
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-600 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
        </label>
      </div>

      {gameSettings.events.enabled && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Event Probability (%)</label>
              <input
                type="number"
                value={gameSettings.events.eventProbability * 100}
                onChange={e => {
                  const value = parseFloat(e.target.value);
                  handleSettingChange('events', 'eventProbability', isNaN(value) ? 0.08 : value / 100);
                }}
                className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                min="0"
                max="100"
                step="1"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Impact Multiplier</label>
              <input
                type="number"
                value={gameSettings.events.impactMultiplier}
                onChange={e => {
                  const value = parseFloat(e.target.value);
                  handleSettingChange('events', 'impactMultiplier', isNaN(value) ? 1.0 : value);
                }}
                className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                min="0.0"
                max="5.0"
                step="0.1"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-300">Auto-Continue Events</label>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={gameSettings.events.autoContinue}
                onChange={() =>
                  handleSettingChange(
                    'events',
                    'autoContinue',
                    !gameSettings.events.autoContinue
                  )
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
            </label>
          </div>

          {gameSettings.events.autoContinue && (
            <div>
              <label className="block text-sm text-gray-300 mb-2">Auto-Continue Delay (seconds)</label>
              <input
                type="number"
                value={gameSettings.events.autoContinueDelay}
                onChange={e => {
                  const value = parseInt(e.target.value);
                  handleSettingChange('events', 'autoContinueDelay', isNaN(value) ? 5 : value);
                }}
                className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                min="1"
                max="60"
                step="1"
              />
            </div>
          )}
        </>
      )}
    </div>
  );

  // Advanced Settings: Developer Mode, Show Debug Info, Max History Points, Random Seed
  // None of these settings do anything currently
  const renderAdvancedSettings = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-3">Advanced Settings</h3>
      
      {/* Developer Mode */}
      <div className="flex items-center justify-between">
        <label className="text-sm text-gray-300">Developer Mode</label>
        
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={gameSettings.advanced.developerMode}
            onChange={() =>
              handleSettingChange(
                'advanced',
                'developerMode',
                !gameSettings.advanced.developerMode
              )
            }
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-600 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
        </label>
      </div>

      {/* Show Debug Info */}
      <div className="flex items-center justify-between">
        <label className="text-sm text-gray-300">Show Debug Info</label>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={gameSettings.advanced.showDebugInfo}
            onChange={() =>
              handleSettingChange(
                'advanced',
                'showDebugInfo',
                !gameSettings.advanced.showDebugInfo
              )
            }
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-600 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-300 mb-2">Max History Points</label>
          <input
            type="number"
            value={gameSettings.advanced.maxHistoryPoints}
            onChange={e => {
              const value = parseInt(e.target.value);
              handleSettingChange('advanced', 'maxHistoryPoints', isNaN(value) ? 0 : value);
            }}
            className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            min="0"
            max="10000"
            step="100"
            placeholder="0 = unlimited"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">Random Seed</label>
          <input
            type="number"
            value={gameSettings.advanced.randomSeed || ''}
            onChange={e => {
              const value = parseInt(e.target.value);
              handleSettingChange('advanced', 'randomSeed', isNaN(value) ? null : value);
            }}
            className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            placeholder="Random"
          />
        </div>
      </div>

      <div className="border-t border-gray-600 pt-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-300">Danger Zone</span>
          <AlertTriangle className="w-4 h-4 text-red-400" />
        </div>
        
        <button
          onClick={handleResetConfirm}
          className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded font-bold flex items-center justify-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reset Game</span>
        </button>
      </div>
    </div>
  );

  // Cheats: Adding Funds
  const renderCheats = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-3">Cheats</h3>
        {/* Add Funds */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">Add Funds ($)</label>
          <form
            onSubmit={e => {
              e.preventDefault();
              const value = parseFloat(e.target.elements.addFunds.value);
              if (!isNaN(value) && value !== 0) {
                if (typeof onAddFunds === 'function') onAddFunds(value);
              }
            }}
          >
            <input
              type="number"
              name="addFunds"
              className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              step="100"
              placeholder="Enter amount (+/-)"
            />
            <button type="submit" className="mt-2 w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold">Apply</button>
          </form>
        </div>
      </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'game': return renderGameSettings();
      case 'market': return renderMarketSettings();
      case 'events': return renderEventsSettings();
      case 'advanced': return renderAdvancedSettings();
      case 'cheats': return renderCheats();
      default: return renderGameSettings();
    }
  };

  return (
    <>
      {/* Settings Button */}
      <button
        onClick={() => { onOpenSettings(); setIsOpen(true); }}
        className="fixed top-4 right-4 p-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-600 transition-colors z-40"
        title="Settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Settings Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Settings & Developer Mode</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex h-[70vh]">
              {/* Tabs */}
              <div className="w-48 bg-gray-800 border-r border-gray-700">
                <div className="p-4 space-y-2">
                  {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                {renderTabContent()}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-700 p-4 flex justify-end">
              <button
                onClick={() => { setIsOpen(false); }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Apply Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Default settings structure
export const defaultGameSettings = {
  game: {
    startingCash: 100000,
    availableFunds: 100000,
    tickInterval: 500,
    tradingFeesEnabled: false,
    tradingFeePercent: 0.0,
    allowShortSelling: false
  },
  market: {
    initialRegime: 'Bull',
    volatilityMultiplier: 1.0,
    initialSentiment: 0.0,
    regimeChangeProbability: 0.05,
    enableAgentTrading: false
  },
  events: {
    enabled: true,
    eventProbability: 0.08,
    impactMultiplier: 1.0,
    autoContinue: false,
    autoContinueDelay: 5
  },
  advanced: {
    developerMode: false,
    showDebugInfo: false,
    maxHistoryPoints: 0, // 0 = unlimited
    randomSeed: null
  }
};

export default SettingsPanel;