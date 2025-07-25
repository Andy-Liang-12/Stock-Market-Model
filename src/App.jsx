import { useRef, useState, useEffect, useCallback } from 'react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Pause, Play, DollarSign, Activity, Globe } from 'lucide-react';
import SettingsPanel, { defaultGameSettings } from './SettingsPanel';

// Game configuration
// const SECTORS = ['Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer', 'Industrial'];
// const MARKET_REGIMES = ['Bull', 'Bear', 'Volatile'];
// const AGENT_TYPES = ['Fundamentalist', 'Chartist', 'Noise'];

// Generate realistic Heston parameters using normal distribution
// TODO: calibrate to real market data, currently arbitrary guesses as a placeholder
const generateHestonParams = () => {
  const normalRandom = (mean, stdDev) => {
    const u = Math.random();
    const v = Math.random();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return z * stdDev + mean;
  };

  return {
    drift: Math.max(0.01, normalRandom(0.08, 0.03)), // 8% ± 3%
    volOfVol: Math.max(0.1, normalRandom(0.3, 0.1)), // 30% ± 10%
    meanReversion: Math.max(0.5, normalRandom(2.0, 0.5)), // 2.0 ± 0.5
    longTermVol: Math.max(0.1, normalRandom(0.25, 0.05)), // 25% ± 5%
    correlation: Math.max(-0.9, Math.min(-0.3, normalRandom(-0.7, 0.2))) // -70% ± 20%
  };
};

// Generate fictional companies with individual Heston parameters
// TODO: refactor into a separate JSON file, fetch when game starts. Can possibly base quality (partially) on beta.
const generateCompanies = () => {
  const companies = [
    { name: 'TechCorp', symbol: 'TECH', sector: 'Technology', quality: 0.8 },
    { name: 'MediCure', symbol: 'MEDI', sector: 'Healthcare', quality: 0.7 },
    { name: 'FinanceFlow', symbol: 'FINF', sector: 'Finance', quality: 0.6 },
    { name: 'EnergyMax', symbol: 'ENMX', sector: 'Energy', quality: 0.5 },
    { name: 'ConsumeAll', symbol: 'CONS', sector: 'Consumer', quality: 0.7 },
    { name: 'BuildTech', symbol: 'BLTC', sector: 'Industrial', quality: 0.6 },
    { name: 'CloudNet', symbol: 'CLNT', sector: 'Technology', quality: 0.9 },
    { name: 'HealthPlus', symbol: 'HLTH', sector: 'Healthcare', quality: 0.8 },
    { name: 'BankSecure', symbol: 'BNKS', sector: 'Finance', quality: 0.7 },
    { name: 'OilDrill', symbol: 'OILD', sector: 'Energy', quality: 0.4 },
    { name: 'AirlineGo', symbol: 'AIRG', sector: 'Industrial', quality: 0.6 },
    { name: 'RetailMax', symbol: 'RETL', sector: 'Consumer', quality: 0.5 },
  ];
  
  return companies.map((company, index) => ({
    ...company,
    id: index,
    price: Math.round((50 + Math.random() * 100) * 100) / 100, // Initial price $50-150, rounded to cents. // TODO: more diverse prices
    volatility: 0.2 + Math.random() * 0.3, // Initial volatility 20-50%
    hestonParams: generateHestonParams(),
    history: [], // Combined price and volume history
    baseVolume: Math.floor(1000 + Math.random() * 9000), // Base daily volume
  }));
};

// Generate news events with positive/negative sector impacts and sentiment deltas
const fetchNewsEvents = async () => {
  try {
    console.log('Fetching news events...');
    const response = await fetch('/newsEvents.json');
    console.log('Fetch response:', response);
    if (!response.ok) {
      console.error('Failed to fetch news events:', response.status, response.statusText);
      throw new Error('Failed to fetch news events');
    }
    const data = await response.json();
    console.log('Fetched news events:', data);
    return data;
  } catch (error) {
    console.error('Error in fetchNewsEvents:', error);
    throw error;
  }
};

// Heston model simulation with individual parameters
const hestonStep = (price, volatility, hestonParams, dt = 1/252) => {
  const { drift, volOfVol, meanReversion, longTermVol, correlation } = hestonParams;
  
  const dW1 = Math.random() * Math.sqrt(dt) - Math.sqrt(dt) / 2;
  const dW2 = correlation * dW1 + Math.sqrt(1 - correlation * correlation) * (Math.random() * Math.sqrt(dt) - Math.sqrt(dt) / 2);
  
  const newVol = Math.max(0.01, volatility + meanReversion * (longTermVol - volatility) * dt + volOfVol * Math.sqrt(volatility) * dW2);
  const newPrice = price * Math.exp((drift - 0.5 * volatility) * dt + Math.sqrt(volatility) * dW1);
  
  return { price: Math.round(newPrice * 100) / 100, volatility: newVol };
};

// Generate dynamic volume based on agent activity and events
// TODO: no magic numbers, use constants for base volume and multipliers
const generateVolume = (baseVolume, agentDemand, eventImpact = 0, sentiment = 0) => {
  // Base volume with some randomness
  let volume = baseVolume * (0.8 + Math.random() * 0.4);
  
  // Agent activity increases volume
  volume *= (1 + Math.abs(agentDemand) * 2);
  
  // Event impact spikes volume
  volume *= (1 + eventImpact * 3);
  
  // Sentiment affects volume
  volume *= (1 + Math.abs(sentiment) * 0.5);
  
  return Math.round(volume);
};

// Agent simulation
// Too many magic numbers here, refactor to constants
const simulateAgents = (stocks, sentiment, regime) => {
  const agentDemand = {};
  
  stocks.forEach(stock => {
    let demand = 0;
    const recentReturn = stock.history.length > 1 ? 
      (stock.price - stock.history[stock.history.length - 2].price) / stock.history[stock.history.length - 2].price : 0;
    
    // Fundamentalists
    const fundamentalValue = stock.quality * 100;
    if (stock.price < fundamentalValue) demand += 0.3;
    else if (stock.price > fundamentalValue) demand -= 0.3;
    
    // Chartists
    if (recentReturn > 0.02) demand += 0.2;
    else if (recentReturn < -0.02) demand -= 0.2;
    
    // Noise traders
    demand += (Math.random() - 0.5) * 0.1;
    
    // Apply sentiment and regime effects
    demand *= (1 + sentiment * 0.5);
    if (regime === 'Bull') demand *= 1.2;
    else if (regime === 'Bear') demand *= 0.8;
    else demand *= (0.8 + Math.random() * 0.4);
    
    agentDemand[stock.symbol] = demand;
  });
  
  return agentDemand;
};

// Stochastic sentiment evolution with mean reversion
// TODO: I honestly have no idea if this works. Stochastic sentiment evolution was just a cool idea I had. Further analysis needed.
const updateSentiment = (currentSentiment, dt = 1/252) => {
  // Mean reversion parameters
  const meanReversionSpeed = 0.5;
  const longTermMean = 0.0;
  const volatility = 0.1;
  
  // Brownian motion component
  const dW = (Math.random() - 0.5) * Math.sqrt(dt);
  
  // Mean-reverting process
  const newSentiment = currentSentiment + 
    meanReversionSpeed * (longTermMean - currentSentiment) * dt + 
    volatility * dW;
  
  // Keep sentiment bounded between -1 and 1
  return Math.max(-1, Math.min(1, newSentiment));
};

// Filter history based on time period
// Used to display different time frames in the chart
// TODO: may want to switch to a date based system in the future
const filterHistoryByPeriod = (history, period) => {
  if (!history || history.length === 0) return [];
  
  const periodsInDays = {
    '1W': 7,
    '1M': 30,
    '6M': 180,
    '1Y': 365,
    'ALL': Infinity
  };
  
  const days = periodsInDays[period] || 30;
  if (days === Infinity) return history;
  return history.slice(-days);
};

const StockMarketGame = () => {
  // Game state
  const [stocks, setStocks] = useState(() => generateCompanies());
  const [newsEvents, setNewsEvents] = useState([]); // Will be fetched on game start
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [gameTime, setGameTime] = useState(0);
  const [sentiment, setSentiment] = useState(defaultGameSettings.market.initialSentiment);
  const [regime, setRegime] = useState(defaultGameSettings.market.initialRegime);
  const [showEvent, setShowEvent] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [pendingEventEffects, setPendingEventEffects] = useState(null);

  // Game settings
  const [gameSettings, setGameSettings] = useState(defaultGameSettings);
  // Track previous settings for diff logging
  const prevSettingsRef = useRef(gameSettings);

  // Player state
  const [availableFunds, setAvailableFunds] = useState(gameSettings.game.startingCash);
  const [portfolio, setPortfolio] = useState({});
  const [selectedStock, setSelectedStock] = useState(null);
  const [tradeAmount, setTradeAmount] = useState(100);
  const [tradeType, setTradeType] = useState('buy');
  const [chartPeriod, setChartPeriod] = useState('1M');
  // startingCash is always derived from gameSettings
  const startingCash = gameSettings.game.startingCash;
  
  // Calculate portfolio value
  const portfolioValue = Object.entries(portfolio).reduce((total, [symbol, shares]) => {
    const stock = stocks.find(s => s.symbol === symbol);
    return total + (stock ? stock.price * shares : 0);
  }, 0);
  
  const totalValue = availableFunds + portfolioValue;
  
  // Apply event effects to stocks
  const applyEventEffects = (stocks, eventEffects) => {
    return stocks.map(stock => {
      let priceMultiplier = 1;
      let volatilityMultiplier = 1;
      let eventImpactMagnitude = 0;
      
      // Check positive impacts
      const positiveImpact = eventEffects.sectorImpacts.positive.find(impact => impact.sector === stock.sector);
      if (positiveImpact) {
        priceMultiplier *= (1 + positiveImpact.magnitude * 0.1 * gameSettings.events.impactMultiplier);
        volatilityMultiplier *= (1 + positiveImpact.volatility);
        eventImpactMagnitude = Math.max(eventImpactMagnitude, positiveImpact.magnitude);
      }
      
      // Check negative impacts
      const negativeImpact = eventEffects.sectorImpacts.negative.find(impact => impact.sector === stock.sector);
      if (negativeImpact) {
        priceMultiplier *= (1 - negativeImpact.magnitude * 0.1 * gameSettings.events.impactMultiplier);
        volatilityMultiplier *= (1 + negativeImpact.volatility);
        eventImpactMagnitude = Math.max(eventImpactMagnitude, negativeImpact.magnitude);
      }
      
      return {
        ...stock,
        priceMultiplier,
        volatilityMultiplier,
        eventImpactMagnitude
      };
    });
  };
  
  // Update stock prices using individual Heston parameters and agent effects
  const updateStockPrices = useCallback((eventEffects = null) => {
    const agentDemand = gameSettings.market.enableAgentTrading ? 
      simulateAgents(stocks, sentiment, regime) : 
      {};
    
    setStocks(prevStocks => {
      let updatedStocks = prevStocks;
      
      // Apply event effects if present
      if (eventEffects) {
        updatedStocks = applyEventEffects(prevStocks, eventEffects);
      }
      
      return updatedStocks.map(stock => {
        const { price: newPrice, volatility: newVol } = hestonStep(
          stock.price, 
          stock.volatility, 
          stock.hestonParams
        );
        
        // Apply agent demand
        const demandEffect = agentDemand[stock.symbol] || 0;
        let finalPrice = Math.max(0.01, newPrice * (1 + demandEffect * 0.1));
        
        // Apply event effects if present
        let eventImpact = 0;
        if (stock.priceMultiplier) {
          finalPrice *= stock.priceMultiplier;
          eventImpact = stock.eventImpactMagnitude || 0;
        }
        
        finalPrice = Math.round(finalPrice * 100) / 100;
        
        // Apply volatility effects  
        let finalVolatility = newVol * gameSettings.market.volatilityMultiplier;
        if (stock.volatilityMultiplier) {
          finalVolatility = Math.min(1.0, finalVolatility * stock.volatilityMultiplier);
        }
        
        // Generate volume based on agent activity and event impact
        const volume = generateVolume(
          stock.baseVolume, 
          Math.abs(demandEffect), 
          eventImpact, 
          sentiment
        );
        
        // Update history with both price and volume
        const newHistory = [...stock.history, { 
          time: gameTime, 
          price: finalPrice, 
          volume: volume 
        }];
        
        return {
          ...stock,
          price: finalPrice,
          volatility: finalVolatility,
          history: newHistory,
          // Clear event effect multipliers
          priceMultiplier: undefined,
          volatilityMultiplier: undefined,
          eventImpactMagnitude: undefined
        };
      });
    });
  }, [stocks, sentiment, regime, gameTime, gameSettings.market.enableAgentTrading, gameSettings.market.volatilityMultiplier, gameSettings.events.impactMultiplier]);
  
  // Game loop
  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setGameTime(prev => prev + 1);
        console.log(`Tick: ${gameTime}`);
        
        // Update sentiment stochastically
        setSentiment(prev => updateSentiment(prev));
        
        // Apply pending event effects if any
        if (pendingEventEffects) {
          updateStockPrices(pendingEventEffects);
          setPendingEventEffects(null);
        } else {
          updateStockPrices();
        }
        
        // Check for new events
        if (gameSettings.events.enabled && Math.random() < gameSettings.events.eventProbability && currentEventIndex < newsEvents.length) {
          const event = newsEvents[currentEventIndex];
          setCurrentEvent(event);
          setShowEvent(true);
          setIsPaused(true); // Pause the game when event occurs
        }
        
        // Update regime occasionally
        if (Math.random() < gameSettings.market.regimeChangeProbability) {
          const regimes = ['Bull', 'Bear', 'Volatile'];
          setRegime(regimes[Math.floor(Math.random() * regimes.length)]);
        }
      }, gameSettings.game.tickInterval);
      
      return () => clearInterval(interval);
    }
  }, [isPaused, updateStockPrices, currentEventIndex, newsEvents, pendingEventEffects, gameSettings.game.tickInterval, gameSettings.events.eventProbability, gameSettings.events.enabled, gameSettings.market.regimeChangeProbability]);

  // Fetch news events on mount
  useEffect(() => {
  fetchNewsEvents()
    .then(setNewsEvents)
    .catch(err => {
      console.error('Failed to load news events:', err);
      setNewsEvents([]); // fallback to empty array
    });
  }, []);
  
  // Handle news event response - sets up effects to be applied on next tick
  const handleEventResponse = () => {
    if (currentEvent) {
      // Store event effects to be applied on next market update
      setPendingEventEffects(currentEvent);
      
      // Update sentiment by delta amount
      setSentiment(prev => Math.max(-1, Math.min(1, prev + currentEvent.deltaSentiment)));
      
      setCurrentEventIndex(prev => prev + 1);
    }
    
    setShowEvent(false);
    setCurrentEvent(null);
  };
  
  // Trading functions
  const executeTrade = () => {
    if (!selectedStock || tradeAmount <= 0) return;
    
    const stock = stocks.find(s => s.symbol === selectedStock);
    if (!stock) return;
    
    const baseCost = stock.price * tradeAmount;
    const tradingFee = gameSettings.game.tradingFeesEnabled ? 
      baseCost * (gameSettings.game.tradingFeePercent / 100) : 0;
    const totalCost = baseCost + tradingFee;
    const currentShares = portfolio[selectedStock] || 0;
    
    if (tradeType === 'buy' && availableFunds >= totalCost) {
      setAvailableFunds(prev => prev - totalCost);
      setPortfolio(prev => ({
        ...prev,
        [selectedStock]: currentShares + tradeAmount
      }));
    } else if (tradeType === 'sell' && currentShares >= tradeAmount) {
      const proceeds = baseCost - tradingFee;
      setAvailableFunds(prev => prev + proceeds);
      setPortfolio(prev => ({
        ...prev,
        [selectedStock]: currentShares - tradeAmount
      }));
    }
  };
  
  const getSectorColor = (sector) => {
    const colors = {
      'Technology': '#3B82F6',
      'Healthcare': '#10B981',
      'Finance': '#F59E0B',
      'Energy': '#EF4444',
      'Consumer': '#8B5CF6',
      'Industrial': '#6B7280'
    };
    return colors[sector] || '#6B7280';
  };
  
  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 p-3 rounded-lg border border-gray-600">
          <p className="text-gray-300">{`Day: ${label}`}</p>
          <p className="text-blue-400">{`Price: $${data.price.toFixed(2)}`}</p>
          <p className="text-green-400">{`Volume: ${data.volume.toLocaleString()}`}</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Stock Market Training Game</h1>
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4" />
            <span>Day {gameTime}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span>Regime: {regime}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Sentiment: </span>
            <div className={`px-2 py-1 rounded text-xs ${sentiment > 0 ? 'bg-green-600' : sentiment < 0 ? 'bg-red-600' : 'bg-gray-600'}`}>
              {sentiment > 0 ? 'Positive' : sentiment < 0 ? 'Negative' : 'Neutral'} ({sentiment.toFixed(2)})
            </div>
          </div>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center space-x-1 px-3 py-1 rounded ${isPaused ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>
        </div>
      </div>
      
      {/* Portfolio Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <span className="text-sm text-gray-400">Available Funds</span>
          </div>
          <span className="text-xl font-bold">${availableFunds.toLocaleString()}</span>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-gray-400">Portfolio</span>
          </div>
          <span className="text-xl font-bold">${portfolioValue.toLocaleString()}</span>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Activity className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-gray-400">Total Value</span>
          </div>
          <span className="text-xl font-bold">${totalValue.toLocaleString()}</span>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm text-gray-400">P&L</span>
          </div>
          <span className={`text-xl font-bold ${totalValue >= startingCash ? 'text-green-400' : 'text-red-400'}`}>
            {totalValue >= startingCash ? '+' : ''}${(totalValue - startingCash).toLocaleString()}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        {/* Stock List */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Stocks</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {stocks.map(stock => {
              const change = stock.history.length > 1 ? 
                stock.price - stock.history[stock.history.length - 2].price : 0;
              const changePercent = stock.history.length > 1 ? 
                (change / stock.history[stock.history.length - 2].price) * 100 : 0;
              
              return (
                <div
                  key={stock.symbol}
                  onClick={() => setSelectedStock(stock.symbol)}
                  className={`p-3 rounded cursor-pointer transition-colors ${
                    selectedStock === stock.symbol ? 'bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <span className="font-bold">{stock.symbol}</span>
                      <span className="text-xs text-gray-400 ml-2">{stock.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${stock.price.toFixed(2)}</div>
                      <div className={`text-xs flex items-center ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {change >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span style={{ color: getSectorColor(stock.sector) }}>{stock.sector}</span>
                    <span>Vol: {(stock.volatility * 100).toFixed(1)}%</span>
                  </div>
                  {stock.history.length > 0 && (
                    <div className="text-xs text-gray-400 mt-1">
                      Volume: {stock.history[stock.history.length - 1].volume.toLocaleString()}
                    </div>
                  )}
                  {portfolio[stock.symbol] && (
                    <div className="mt-1 text-xs text-blue-400">
                      Holding: {portfolio[stock.symbol]} shares
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Price Chart */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              Price Chart {selectedStock && `- ${selectedStock}`}
            </h2>
            <div className="flex space-x-2">
              {['1W', '1M', '6M', '1Y', 'ALL'].map(period => (
                <button
                  key={period}
                  onClick={() => setChartPeriod(period)}
                  className={`px-3 py-1 text-xs rounded ${
                    chartPeriod === period ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          {selectedStock && stocks.find(s => s.symbol === selectedStock)?.history.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={filterHistoryByPeriod(stocks.find(s => s.symbol === selectedStock).history, chartPeriod)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9CA3AF" />
                  <YAxis yAxisId="price" orientation="left" stroke="#9CA3AF" />
                  <YAxis yAxisId="volume" orientation="right" stroke="#9CA3AF" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    yAxisId="price"
                    type="monotone" 
                    dataKey="price" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Bar 
                    yAxisId="volume"
                    dataKey="volume" 
                    fill="#10B981" 
                    opacity={0.3}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              Select a stock to view price chart
            </div>
          )}
        </div>
        
        {/* Trading Panel */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Trading</h2>
          {selectedStock ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Stock</label>
                <div className="text-lg font-bold">{selectedStock}</div>
                <div className="text-sm text-gray-400">
                  ${stocks.find(s => s.symbol === selectedStock)?.price.toFixed(2)}
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Action</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setTradeType('buy')}
                    className={`flex-1 py-2 px-4 rounded ${
                      tradeType === 'buy' ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => setTradeType('sell')}
                    className={`flex-1 py-2 px-4 rounded ${
                      tradeType === 'sell' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    Sell
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Shares</label>
                <input
                  type="number"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  min="0"
                />
              </div>
              
              <div className="text-sm text-gray-400">
                {(() => {
                  const stock = stocks.find(s => s.symbol === selectedStock);
                  const baseCost = (stock?.price || 0) * tradeAmount;
                  const tradingFee = gameSettings.game.tradingFeesEnabled ? 
                    baseCost * (gameSettings.game.tradingFeePercent / 100) : 0;
                  const totalCost = baseCost + tradingFee;
                  
                  return (
                    <div>
                      <div>Base Cost: ${baseCost.toLocaleString()}</div>
                      {gameSettings.game.tradingFeesEnabled && (
                        <div>Trading Fee ({gameSettings.game.tradingFeePercent}%): ${tradingFee.toLocaleString()}</div>
                      )}
                      <div className="font-semibold">
                        Total: ${totalCost.toLocaleString()}
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              <button
                onClick={executeTrade}
                disabled={(() => {
                  const stock = stocks.find(s => s.symbol === selectedStock);
                  const baseCost = (stock?.price || 0) * tradeAmount;
                  const tradingFee = gameSettings.game.tradingFeesEnabled ? 
                    baseCost * (gameSettings.game.tradingFeePercent / 100) : 0;
                  const totalCost = baseCost + tradingFee;
                  
                  return (tradeType === 'buy' && availableFunds < totalCost) ||
                         (tradeType === 'sell' && (portfolio[selectedStock] || 0) < tradeAmount);
                })()}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-bold"
              >
                Execute Trade
              </button>
              
              {portfolio[selectedStock] && (
                <div className="text-sm text-gray-400">
                  Current position: {portfolio[selectedStock]} shares
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-400">Select a stock to trade</div>
          )}
        </div>
      </div>
      
      {/* News Event Modal */}
      {showEvent && currentEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-2xl w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-yellow-400">Breaking News!</h3>
            <p className="mb-4 text-lg">{currentEvent.description}</p>
            
            <div className="mb-4 space-y-2">
              {currentEvent.sectorImpacts.positive.length > 0 && (
                <div className="text-sm">
                  <span className="text-green-400 font-semibold">Positive impacts:</span>
                  <div className="ml-2">
                    {currentEvent.sectorImpacts.positive.map((impact, index) => (
                      <div key={index} className="text-green-300">
                        • {impact.sector}: +{(impact.magnitude * 100).toFixed(0)}% expected price impact
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {currentEvent.sectorImpacts.negative.length > 0 && (
                <div className="text-sm">
                  <span className="text-red-400 font-semibold">Negative impacts:</span>
                  <div className="ml-2">
                    {currentEvent.sectorImpacts.negative.map((impact, index) => (
                      <div key={index} className="text-red-300">
                        • {impact.sector}: -{(impact.magnitude * 100).toFixed(0)}% expected price impact
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="text-sm">
                <span className="text-gray-400">Market sentiment change: </span>
                <span className={currentEvent.deltaSentiment > 0 ? 'text-green-400' : currentEvent.deltaSentiment < 0 ? 'text-red-400' : 'text-gray-400'}>
                  {currentEvent.deltaSentiment > 0 ? '+' : ''}{(currentEvent.deltaSentiment * 100).toFixed(0)}%
                </span>
              </div>
              
              <div className="text-sm text-gray-400">
                Event significance: {(currentEvent.significance * 100).toFixed(0)}%
              </div>
            </div>
            
            <div className="text-sm text-blue-400 mb-4">
              Make your trades now! Price reactions will occur after you continue.
            </div>
            <button
              onClick={handleEventResponse}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded font-bold"
            >
              Continue Trading
            </button>
          </div>
        </div>
      )}

      {/* Settings/Dev Panel */}
      <SettingsPanel 
        gameSettings={gameSettings}
        onSettingsChange={newSettings => {
          // Log the update and diff
          console.log('[SettingsPanel -> App] Settings updated:', newSettings);
          // Show what changed
          const prev = prevSettingsRef.current;
          const changes = {};
          Object.keys(newSettings).forEach(category => {
            changes[category] = {};
            Object.keys(newSettings[category]).forEach(key => {
              if (prev[category][key] !== newSettings[category][key]) {
                changes[category][key] = {
                  from: prev[category][key],
                  to: newSettings[category][key]
                };
              }
            });
            // Remove empty change objects
            if (Object.keys(changes[category]).length === 0) {
              delete changes[category];
            }
          });
          if (Object.keys(changes).length > 0) {
            console.log('[SettingsPanel -> App] Changed:', changes);
          } else {
            console.log('[SettingsPanel -> App] No changes detected.');
          }
          prevSettingsRef.current = newSettings;
          setGameSettings(newSettings);
        }}
        onResetGame={() => {
          setStocks(generateCompanies());
          setAvailableFunds(gameSettings.game.startingCash);
          setPortfolio({});
          setGameTime(0);
          setSentiment(gameSettings.market.initialSentiment);
          setRegime(gameSettings.market.initialRegime);
          setCurrentEventIndex(0);
          setIsPaused(true);
        }}
        onAddFunds={amount => {
          setAvailableFunds(prev => Math.max(0, prev + amount));
        }}
      />
    </div>
  );
};

export default StockMarketGame;