import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { DollarSign, Zap, Target, Briefcase, Home, Shield, BarChart2, Settings, Sun, Moon, ArrowLeft, PiggyBank as PiggyBankIcon, Info, Users, Crown, Star, Store, TrendingUp, TrendingDown, Globe, Twitter, CalendarDays, X, AlertTriangle, Send, CheckCircle, XCircle, Lightbulb, LogOut } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';


// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyBD202YQyRGa7PUE9kh8o-bQQciAO8Lwc8",
  authDomain: "glowearth-f0801.firebaseapp.com",
  projectId: "glowearth-f0801",
  storageBucket: "glowearth-f0801.firebasestorage.app",
  messagingSenderId: "11001317302",
  appId: "1:11001317302:web:db00d5dd1cf0fabf862317",
  measurementId: "G-X992GXP4P7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// --- MOCK DATA ---
const mockUserData = {
    adult: {
        name: 'Alex Johnson',
        netWorth: 0,
        monthlyProfit: 0,
        monthlyLoss: 0,
        transactions: [],
        spendingByCategory: [],
        goals: [],
        investments: {
            portfolioValue: 0,
            performance: [],
            assets: []
        }
    },
    kid: {
        name: 'Lily',
        level: 1,
        xp: 0,
        xpToNextLevel: 500,
        piggyBank: 0,
        achievements: [],
        quests: []
    }
};

const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

// --- CACHING UTILITIES ---
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const setCache = (key, data) => {
    try {
        const cacheItem = {
            data,
            timestamp: new Date().getTime(),
        };
        localStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (error) {
        console.error("Error saving to cache:", error);
    }
};

const getCache = (key) => {
    try {
        const cachedItem = localStorage.getItem(key);
        if (!cachedItem) return null;

        const { data, timestamp } = JSON.parse(cachedItem);
        if (new Date().getTime() - timestamp > CACHE_TTL) {
            localStorage.removeItem(key);
            return null; // Cache expired
        }
        return data;
    } catch (error) {
        console.error("Error reading from cache:", error);
        return null;
    }
};

const preCacheCoinDetails = (coins) => {
    if (!coins || coins.length === 0) return;

    coins.forEach(coin => {
        const cacheKey = `coinDetail_${coin.id}`;
        const existingCache = getCache(cacheKey);

        // Pre-cache only if full data doesn't already exist.
        if (!existingCache || !existingCache.details.description?.en || existingCache.details.description.en.includes('Loading')) {
            const partialDetailsPayload = {
                details: {
                    id: coin.id,
                    name: coin.name,
                    symbol: coin.symbol,
                    image: { large: coin.image },
                    market_cap_rank: coin.market_cap_rank,
                    genesis_date: null,
                    description: { en: '<p><em>Loading full description...</em></p>' },
                    links: { homepage: [''], twitter_screen_name: '', subreddit_url: '' },
                    market_data: {
                        current_price: { usd: coin.current_price },
                        price_change_percentage_24h: coin.price_change_percentage_24h,
                        high_24h: { usd: coin.high_24h },
                        low_24h: { usd: coin.low_24h },
                        market_cap: { usd: coin.market_cap },
                        total_volume: { usd: coin.total_volume },
                    },
                },
                chartData: [],
            };
            setCache(cacheKey, partialDetailsPayload);
        }
    });
};


// --- CUSTOM HOOKS ---
const useVaultyTheme = () => {
    const [theme, setTheme] = useState('light');
    const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

    useEffect(() => {
        document.body.className = '';
        document.body.classList.add(theme);
    }, [theme]);

    return { theme, toggleTheme };
};

// --- SVG & ICON COMPONENTS ---
const VaultyLogo = ({ className }) => (
    <svg className={className} viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#00F2FE' }} />
                <stop offset="100%" style={{ stopColor: '#4FACFE' }} />
            </linearGradient>
            <linearGradient id="logoGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#43e97b' }} />
                <stop offset="100%" style={{ stopColor: '#38f9d7' }} />
            </linearGradient>
        </defs>
        <path fill="url(#logoGradient)" d="M110,0 C170.75,0 220,49.25 220,110 C220,170.75 170.75,220 110,220 C49.25,220 0,170.75 0,110 C0,49.25 49.25,0 110,0 Z" />
        <path fill="white" d="M110,50 L140,80 L140,140 L80,140 L80,80 L110,50 M110,72 L95,87 L95,125 L125,125 L125,87 L110,72 M110,95 C114.14,95 117.5,98.36 117.5,102.5 C117.5,106.64 114.14,110 110,110 C105.86,110 102.5,106.64 102.5,102.5 C102.5,98.36 105.86,95 110,95" />
    </svg>
);

const RedditIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12.0001 2.00005C6.47727 2.00005 2.00005 6.47727 2.00005 12.0001C2.00005 17.5229 6.47727 22.0001 12.0001 22.0001C17.5229 22.0001 22.0001 17.5229 22.0001 12.0001C22.0001 6.47727 17.5229 2.00005 12.0001 2.00005ZM12.0001 19.5001C7.86302 19.5001 4.50005 16.1371 4.50005 12.0001C4.50005 7.86302 7.86302 4.50005 12.0001 4.50005C16.1371 4.50005 19.5001 7.86302 19.5001 12.0001C19.5001 16.1371 16.1371 19.5001 12.0001 19.5001Z"></path>
        <path d="M12.0001 8.25005C11.3126 8.25005 10.75 8.81258 10.75 9.50005V10.7684C10.0528 11.1658 9.56384 11.7853 9.38241 12.5001H8.25C7.56258 12.5001 7.00005 13.0626 7.00005 13.7501C7.00005 14.4376 7.56258 15.0001 8.25 15.0001H9.38241C9.56384 15.7148 10.0528 16.3343 10.75 16.7317V18.0001C10.75 18.6876 11.3126 19.2501 12.0001 19.2501C12.6876 19.2501 13.2501 18.6876 13.2501 18.0001V16.7317C13.9473 16.3343 14.4363 15.7148 14.6177 15.0001H15.75C16.4375 15.0001 17.0001 14.4376 17.0001 13.7501C17.0001 13.0626 16.4375 12.5001 15.75 12.5001H14.6177C14.4363 11.7853 13.9473 11.1658 13.2501 10.7684V9.50005C13.2501 8.81258 12.6876 8.25005 12.0001 8.25005ZM12.0001 10.5001C12.8285 10.5001 13.5001 11.1716 13.5001 12.0001C13.5001 12.8285 12.8285 13.5001 12.0001 13.5001C11.1716 13.5001 10.5001 12.8285 10.5001 12.0001C10.5001 11.1716 11.1716 10.5001 12.0001 10.5001Z"></path>
        <path d="M9.00005 10.0001C9.55233 10.0001 10.0001 9.55233 10.0001 9.00005C10.0001 8.44776 9.55233 8.00005 9.00005 8.00005C8.44776 8.00005 8.00005 8.44776 8.00005 9.00005C8.00005 9.55233 8.44776 10.0001 9.00005 10.0001Z"></path>
        <path d="M15.0001 10.0001C15.5523 10.0001 16.0001 9.55233 16.0001 9.00005C16.0001 8.44776 15.5523 8.00005 15.0001 8.00005C14.4478 8.00005 14.0001 8.44776 14.0001 9.00005C14.0001 9.55233 14.4478 10.0001 15.0001 10.0001Z"></path>
    </svg>
);


const AnimatedIllustration = ({ type }) => {
    const illustrations = {
        piggy: (
            <div className="relative w-48 h-48">
                <div className="absolute animate-bounce bottom-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-pink-300 rounded-full" />
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-8 h-4 bg-pink-400 rounded-t-full" />
                <div className="absolute top-8 left-1/4 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-gray-800 rounded-full" />
                </div>
            </div>
        ),
        lemonade: (
            <div className="relative w-48 h-48">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-16 bg-yellow-200 border-4 border-yellow-400 rounded-t-lg" />
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-40 h-4 bg-yellow-400" />
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-4 h-16 bg-yellow-400" />
                 <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-2xl font-bold text-yellow-600">LEMONADE</div>
            </div>
        )
    };
    return illustrations[type] || null;
};

// --- UI COMPONENTS ---
const Card = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-lg p-6 transition-all duration-300 ${className}`}>
        {children}
    </div>
);

const Button = ({ children, onClick, className = '', variant = 'primary', disabled = false }) => {
    const baseClasses = 'px-6 py-3 font-bold rounded-xl transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed';
    const variants = {
        primary: 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-lg focus:ring-blue-300 dark:focus:ring-blue-800',
        secondary: 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-gray-300 dark:focus:ring-gray-600',
        success: 'bg-gradient-to-r from-green-400 to-teal-500 text-white shadow-lg focus:ring-green-300 dark:focus:ring-green-800',
        danger: 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg focus:ring-red-300 dark:focus:ring-red-800',
    };
    return <button onClick={onClick} className={`${baseClasses} ${variants[variant]} ${className}`} disabled={disabled}>{children}</button>;
};

const Modal = ({ show, onClose, title, children }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-11/12 max-w-md sm:max-w-2xl animate-fade-in-up">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
                    <button onClick={onClose} className="p-2 -m-2 rounded-full text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <X size={28} />
                    </button>
                </div>
                <div>{children}</div>
            </div>
        </div>
    );
};

const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-500"></div>
    </div>
);

const ProgressBar = ({ value, max, colorClass = 'bg-cyan-400' }) => (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
        <div className={`${colorClass} h-4 rounded-full`} style={{ width: `${(value / max) * 100}%` }}></div>
    </div>
);

// --- APP SCREENS & VIEWS ---

const Header = ({ title, onBack, theme, toggleTheme, userMode, onLogout }) => (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
            <div>
                {onBack && <button onClick={onBack} className="p-2 -m-2 mr-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><ArrowLeft className="h-6 w-6 text-gray-800 dark:text-white" /></button>}
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white inline-block">{title}</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
                { userMode === 'kid' && (
                    <div className="flex items-center space-x-2 bg-yellow-100 dark:bg-yellow-800/50 px-3 py-1 rounded-full">
                        <Star className="h-5 w-5 text-yellow-500"/>
                        <span className="font-bold text-yellow-700 dark:text-yellow-300">{mockUserData.kid.xp} XP</span>
                    </div>
                )}
                <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    {theme === 'light' ? <Moon className="h-6 w-6 text-gray-800 dark:text-white" /> : <Sun className="h-6 w-6 text-gray-800 dark:text-white" />}
                </button>
                <button onClick={onLogout} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    <LogOut className="h-6 w-6 text-gray-800 dark:text-white" />
                </button>
            </div>
        </div>
    </header>
);

const SplashScreen = () => (
    <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-black">
        <VaultyLogo className="w-48 h-48 animate-pulse" />
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mt-4">Vaulty</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Your AI Financial Mentor</p>
    </div>
);

const AuthScreen = ({ setView }) => (
    <div className="flex flex-col justify-center items-center h-screen bg-white dark:bg-gray-900 p-8">
        <VaultyLogo className="w-32 h-32 mb-8"/>
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-4">Welcome to Vaulty!</h2>
        <p className="text-lg text-center text-gray-600 dark:text-gray-400 mb-12">Your AI Financial Mentor</p>
        <div className="flex flex-col space-y-4 w-full max-w-sm">
            <Button onClick={() => setView('login')} variant="primary">Login</Button>
            <Button onClick={() => setView('register')} variant="secondary">Register</Button>
        </div>
    </div>
);

const LoginScreen = ({ setView }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged will handle the redirect
        } catch (err) {
            setError(err.message.replace('Firebase: ', ''));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col justify-center items-center h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <VaultyLogo className="w-24 h-24 mb-6"/>
            <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-6">Login to Vaulty</h2>
            <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    required
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</Button>
            </form>
            <p className="mt-6 text-gray-600 dark:text-gray-400">
                Don't have an account? <button onClick={() => setView('register')} className="font-bold text-cyan-500 hover:underline">Register</button>
            </p>
        </div>
    );
};

const RegisterScreen = ({ setView }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!agreed) {
            setError("You must agree to the terms of use.");
            return;
        }
        setLoading(true);
        setError('');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await setDoc(doc(db, "users", user.uid), {
                firstName,
                lastName,
                email,
                userMode: null // This will be set in the next step
            });
            // onAuthStateChanged will handle next steps
        } catch (err) {
            setError(err.message.replace('Firebase: ', ''));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <VaultyLogo className="w-24 h-24 mb-6"/>
            <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-6">Create Account</h2>
            <form onSubmit={handleRegister} className="w-full max-w-sm space-y-4">
                <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-400" required />
                <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-400" required />
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-400" required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-400" required />
                <div className="flex items-center space-x-2">
                    <input type="checkbox" id="terms" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" />
                    <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400">I agree to the <a href="#" className="text-cyan-500 hover:underline">Terms of Use</a></label>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating Account...' : 'Register'}</Button>
            </form>
            <p className="mt-6 text-gray-600 dark:text-gray-400">
                Already have an account? <button onClick={() => setView('login')} className="font-bold text-cyan-500 hover:underline">Login</button>
            </p>
        </div>
    );
};


const ModeSelectionScreen = ({ onSelect }) => (
    <div className="flex flex-col justify-center items-center h-screen bg-white dark:bg-gray-900 p-8">
        <VaultyLogo className="w-32 h-32 mb-8"/>
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-4">One Last Step!</h2>
        <p className="text-lg text-center text-gray-600 dark:text-gray-400 mb-12">Who is using the app right now?</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
            <div onClick={() => onSelect('adult')} className="cursor-pointer group p-8 bg-gradient-to-br from-cyan-50 to-blue-100 dark:from-cyan-900/50 dark:to-blue-900/50 rounded-2xl text-center shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <Briefcase className="h-16 w-16 mx-auto text-cyan-500 mb-4"/>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">I'm an Adult</h3>
                <p className="text-gray-600 dark:text-gray-300 mt-2">Manage finances, build a business, and invest smarter.</p>
            </div>
            <div onClick={() => onSelect('kid')} className="cursor-pointer group p-8 bg-gradient-to-br from-pink-50 to-yellow-100 dark:from-pink-900/50 dark:to-yellow-900/50 rounded-2xl text-center shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <PiggyBankIcon className="h-16 w-16 mx-auto text-pink-500 mb-4"/>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">I'm a Kid</h3>
                <p className="text-gray-600 dark:text-gray-300 mt-2">Play games, learn about money, and save up!</p>
            </div>
        </div>
    </div>
);

const AdultDashboard = ({ setView, userName }) => {
    const user = mockUserData.adult;
    const firstGoal = user.goals && user.goals.length > 0 ? user.goals[0] : null;

    return (
        <div className="py-6 space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Welcome back, {userName}</h2>
            
            <Card className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
                <p className="opacity-80 text-lg">Net Worth</p>
                <p className="text-4xl font-extrabold tracking-tight">${user.netWorth.toLocaleString()}</p>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-white">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setView('financeManager')} className="flex flex-col items-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                            <DollarSign className="h-8 w-8 text-green-500 mb-2"/>
                            <span className="font-semibold text-sm text-center text-gray-800 dark:text-white">Finance Manager</span>
                        </button>
                         <button onClick={() => setView('investmentTracker')} className="flex flex-col items-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                            <BarChart2 className="h-8 w-8 text-blue-500 mb-2"/>
                            <span className="font-semibold text-sm text-center text-gray-800 dark:text-white">Investments</span>
                        </button>
                         <button onClick={() => setView('businessMaker')} className="flex flex-col items-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                            <Zap className="h-8 w-8 text-yellow-500 mb-2"/>
                            <span className="font-semibold text-sm text-center text-gray-800 dark:text-white">Business Maker</span>
                        </button>
                         <button onClick={() => setView('goalPlanner')} className="flex flex-col items-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                            <Target className="h-8 w-8 text-red-500 mb-2"/>
                            <span className="font-semibold text-sm text-center text-gray-800 dark:text-white">Goal Planner</span>
                        </button>
                    </div>
                </Card>
                <Card>
                    <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-white">Next Financial Goal</h3>
                    {firstGoal ? (
                        <>
                            <div className="flex items-center space-x-4">
                                <Home className="h-10 w-10 text-cyan-500" />
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-white">{firstGoal.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        ${firstGoal.saved.toLocaleString()} / ${firstGoal.total.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <ProgressBar value={firstGoal.saved} max={firstGoal.total} className="mt-4" />
                        </>
                    ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                            <p>No goals set yet.</p>
                            <button onClick={() => setView('goalPlanner')} className="text-cyan-500 font-bold mt-2">Add a Goal</button>
                        </div>
                    )}
                </Card>
            </div>
            
            <Card>
                <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">Recent Transactions</h3>
                {user.transactions && user.transactions.length > 0 ? (
                    <ul className="space-y-4">
                        {user.transactions.slice(0, 3).map(tx => (
                            <li key={tx.id} className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-white">{tx.category}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{tx.date}</p>
                                </div>
                                <p className={`font-bold ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {tx.amount > 0 ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                                </p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                        <p>No recent transactions.</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

const formatLargeNumber = (num) => {
    if (!num && num !== 0) return 'N/A';
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
};

const CoinDetailModal = ({ coinId, onClose }) => {
    const [details, setDetails] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const formatApiHtml = (htmlString) => {
        if (!htmlString) return '';
        return htmlString.replace(/<a href/g, '<a target="_blank" rel="noopener noreferrer" href');
    };

    const fetchDetails = useCallback(async () => {
        const cacheKey = `coinDetail_${coinId}`;
        const cachedData = getCache(cacheKey);

        if (cachedData) {
            setDetails(cachedData.details);
            setChartData(cachedData.chartData);
            setLoading(false);
        } else {
            setLoading(true);
        }
        
        setError(null);

        try {
            const [detailsResponse, chartResponse] = await Promise.all([
                fetch(`https://api.coingecko.com/api/v3/coins/${coinId}`),
                fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=7`)
            ]);

            if (!detailsResponse.ok || !chartResponse.ok) {
                throw new Error('failed to fetch');
            }

            const detailsData = await detailsResponse.json();
            const chartRawData = await chartResponse.json();
            
            const formattedChartData = chartRawData.prices.map(price => ({
                date: new Date(price[0]).toLocaleDateString([], { month: 'short', day: 'numeric' }),
                price: price[1]
            }));

            setDetails(detailsData);
            setChartData(formattedChartData);
            setCache(cacheKey, { details: detailsData, chartData: formattedChartData });
        } catch (err) {
            setError(err.message);
            if (!cachedData) {
                setDetails(null);
                setChartData([]);
            }
        } finally {
            setLoading(false);
        }
    }, [coinId]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    const title = details?.name ?? (loading ? 'Loading...' : 'Error');

    return (
        <Modal show={true} onClose={onClose} title={title}>
            {loading && <LoadingSpinner />}
            {error && details && (
                <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 rounded-lg flex items-center gap-2">
                    <AlertTriangle size={20} />
                    <span>{error}. Displaying saved data.</span>
                </div>
            )}
            {error && !details && !loading && <p className="text-center text-red-500">{error}</p>}
            {details && (
                <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <img src={details.image?.large} alt={details.name} className="w-16 h-16" />
                            <div>
                                <h3 className="text-2xl font-bold dark:text-white">{details.name} <span className="text-gray-400 uppercase">{details.symbol}</span></h3>
                                <p className="text-3xl font-bold dark:text-white">${details.market_data?.current_price?.usd?.toLocaleString() ?? 'N/A'}</p>
                            </div>
                        </div>
                        <div className={`flex items-center gap-1 text-lg font-bold px-3 py-1 rounded-full ${details.market_data?.price_change_percentage_24h > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'}`}>
                           {details.market_data?.price_change_percentage_24h > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                            <span>{details.market_data?.price_change_percentage_24h?.toFixed(2) ?? '0.00'}%</span>
                        </div>
                    </div>

                    {/* 24h High/Low */}
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">24h High</p>
                            <p className="font-bold text-lg dark:text-white">${details.market_data?.high_24h?.usd?.toLocaleString() ?? 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">24h Low</p>
                            <p className="font-bold text-lg dark:text-white">${details.market_data?.low_24h?.usd?.toLocaleString() ?? 'N/A'}</p>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="w-full h-56">
                        <h4 className="font-bold text-lg mb-2 dark:text-white">7-Day Price Chart</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={details.market_data?.price_change_percentage_24h >= 0 ? '#10B981' : '#EF4444'} stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor={details.market_data?.price_change_percentage_24h >= 0 ? '#10B981' : '#EF4444'} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" stroke="gray" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis hide={true} domain={['auto', 'auto']} />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-2 px-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                                                    <p className="label font-bold text-gray-800 dark:text-white">{`${label}`}</p>
                                                    <p className="intro text-gray-600 dark:text-gray-300">{`Price: $${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="price" 
                                    stroke={details.market_data?.price_change_percentage_24h >= 0 ? '#10B981' : '#EF4444'} 
                                    strokeWidth={2} 
                                    fillOpacity={1} 
                                    fill="url(#priceGradient)" 
                                    dot={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Info */}
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                        <div className="flex items-center gap-2">
                            <Star size={20} className="text-yellow-500 flex-shrink-0"/> 
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Market Cap Rank</p>
                                <p className="font-bold dark:text-white">#{details.market_cap_rank ?? 'N/A'}</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-2">
                            <CalendarDays size={20} className="text-blue-500 flex-shrink-0"/> 
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Created Date</p>
                                <p className="font-bold dark:text-white">{details.genesis_date ? new Date(details.genesis_date).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <DollarSign size={20} className="text-green-500 flex-shrink-0"/> 
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Market Cap</p>
                                <p className="font-bold dark:text-white">{formatLargeNumber(details.market_data?.market_cap?.usd)}</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-2">
                            <BarChart2 size={20} className="text-orange-500 flex-shrink-0"/> 
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">24h Volume</p>
                                <p className="font-bold dark:text-white">{formatLargeNumber(details.market_data?.total_volume?.usd)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <h4 className="font-bold text-lg mb-2 dark:text-white">About {details.name}</h4>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: formatApiHtml(details.description?.en) }}></div>
                    </div>

                    {/* Socials */}
                    <div>
                        <h4 className="font-bold text-lg mb-2 dark:text-white">Official Links</h4>
                        <div className="flex flex-wrap gap-4">
                            {details.links?.homepage?.[0] && <a href={details.links.homepage[0]} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-500 hover:underline"><Globe size={16}/>Website</a>}
                            {details.links?.twitter_screen_name && <a href={`https://twitter.com/${details.links.twitter_screen_name}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-500 hover:underline"><Twitter size={16}/>Twitter</a>}
                            {details.links?.subreddit_url && <a href={details.links.subreddit_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-500 hover:underline"><RedditIcon className="w-4 h-4"/>Reddit</a>}
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};

const MarketPage = () => {
    const [topCoins, setTopCoins] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isStale, setIsStale] = useState(false);
    const [selectedCoin, setSelectedCoin] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    
    // --- DATA FETCHING ---
    const fetchTopCoins = useCallback(async () => {
        const cachedCoins = getCache('topCoins');
        if (cachedCoins) {
            setTopCoins(cachedCoins);
            setLoading(false);
        } else {
            setLoading(true);
        }
        
        setError(null);
        setIsStale(false);
    
        try {
            const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false');
            if (!response.ok) throw new Error('failed to fetch');
            const data = await response.json();
            setTopCoins(data);
            setCache('topCoins', data);
            preCacheCoinDetails(data);
        } catch (err) {
            setError(err.message);
            if (cachedCoins) {
                setIsStale(true);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTopCoins();
    }, [fetchTopCoins]);
    
    // --- SEARCH LOGIC ---
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);

        return () => clearTimeout(handler);
    }, [searchQuery]);

    useEffect(() => {
        if (debouncedQuery.trim() === '') {
            setSearchResults([]);
            if (topCoins.length > 0) {
                 setError(null);
                 setIsStale(false);
            }
            return;
        }

        const controller = new AbortController();
        const signal = controller.signal;

        const performSearch = async () => {
            const cacheKey = `search_${debouncedQuery}`;
            const cachedSearch = getCache(cacheKey);

            if (cachedSearch) {
                setSearchResults(cachedSearch);
                setLoading(false);
            } else {
                setLoading(true);
            }
            
            setError(null);
            setIsStale(false);

            try {
                const searchResponse = await fetch(`https://api.coingecko.com/api/v3/search?query=${debouncedQuery}`, { signal });
                if (!searchResponse.ok) throw new Error('failed to fetch');
                const searchData = await searchResponse.json();
                
                if (signal.aborted) return;

                if (searchData.coins && searchData.coins.length > 0) {
                    const coinIds = searchData.coins.slice(0, 50).map(c => c.id).join(',');
                    const marketsResponse = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds}&order=market_cap_desc&sparkline=false`, { signal });
                    if (!marketsResponse.ok) throw new Error('failed to fetch');
                    
                    const marketsData = await marketsResponse.json();
                    if (!signal.aborted) {
                        setSearchResults(marketsData);
                        setCache(cacheKey, marketsData);
                        preCacheCoinDetails(marketsData);
                    }
                } else {
                    setSearchResults([]);
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setError(err.message);
                    if (cachedSearch) setIsStale(true);
                    else setSearchResults([]);
                }
            } finally {
                if (!signal.aborted) {
                    setLoading(false);
                }
            }
        };

        performSearch();
        return () => controller.abort();
    }, [debouncedQuery, topCoins.length]);

    // --- RENDER LOGIC ---
    const handleRefresh = () => {
        setSearchQuery('');
        setDebouncedQuery('');
        localStorage.removeItem('topCoins');
        fetchTopCoins();
    };
    
    const coinsToDisplay = searchQuery.trim().length > 0 ? searchResults : topCoins;

    return (
        <div className="py-6 space-y-6">
            <Card>
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white text-center sm:text-left">Cryptocurrency Market</h2>
                    <Button onClick={handleRefresh} variant="secondary" className="py-2 px-4 w-full sm:w-auto">Refresh</Button>
                </div>

                <div className="mb-4">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for any coin (e.g., Solana, Dogecoin...)"
                        className="w-full p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                </div>

                {isStale && (
                         <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 rounded-lg flex items-center gap-2">
                            <AlertTriangle size={20} />
                            <span>Could not fetch live data. Showing last saved prices.</span>
                        </div>
                )}
                
                {loading && <LoadingSpinner />}
                {error && !isStale && <p className="text-center text-red-500">{error}</p>}
                
                {!loading && !error && (
                    <div className="space-y-3">
                        {coinsToDisplay.length > 0 ? (
                            coinsToDisplay.map(coin => (
                                <div key={coin.id} onClick={() => setSelectedCoin(coin.id)} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <img src={coin.image} alt={coin.name} className="w-10 h-10"/>
                                        <div>
                                            <p className="font-bold text-lg text-gray-800 dark:text-white">{coin.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase">{coin.symbol}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg text-gray-800 dark:text-white">${coin.current_price?.toLocaleString() ?? 'N/A'}</p>
                                        <div className={`flex items-center justify-end gap-1 text-sm font-bold ${
                                            coin.price_change_percentage_24h == null ? 'text-gray-500' : (coin.price_change_percentage_24h > 0 ? 'text-green-500' : 'text-red-500')
                                        }`}>
                                           {coin.price_change_percentage_24h != null && (coin.price_change_percentage_24h > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />)}
                                            <span>
                                                {coin.price_change_percentage_24h != null ? `${coin.price_change_percentage_24h.toFixed(2)}%` : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                             <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                <p>No coins found.</p>
                                {searchQuery && <p>Try a different search term.</p>}
                            </div>
                        )}
                    </div>
                )}
            </Card>
            {selectedCoin && <CoinDetailModal coinId={selectedCoin} onClose={() => setSelectedCoin(null)} />}
        </div>
    );
};

const BusinessMaker = () => {
    // --- Gemini AI Configuration ---
    const GEMINI_API_KEY = "AIzaSyAVsgP4wvcrkhZchKlv3-5WJEqGW_i-fmU"; // <-- VSTAVITE SVOJ GEMINI API KLJUČ TUKAJ

    const useTypingEffect = (textToType, speed = 30, onComplete = () => {}) => {
        const [typedText, setTypedText] = useState('');
        const onCompleteRef = useRef(onComplete);
        onCompleteRef.current = onComplete;

        useEffect(() => {
            if (typeof textToType !== 'string') return;
            setTypedText('');
            let i = 0;
            const intervalId = setInterval(() => {
                setTypedText(prev => prev + textToType.charAt(i));
                i++;
                if (i >= textToType.length) {
                    clearInterval(intervalId);
                    onCompleteRef.current();
                }
            }, speed);
            return () => clearInterval(intervalId);
        }, [textToType, speed]);
        return typedText;
    };

    const [conversationStep, setConversationStep] = useState(0);
    const [businessData, setBusinessData] = useState({});
    const [currentAiText, setCurrentAiText] = useState('');
    const [showUserInput, setShowUserInput] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [plan, setPlan] = useState(null);
    const [apiError, setApiError] = useState('');
    const [additionalPlan, setAdditionalPlan] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const conversationFlow = useRef([
        { id: 'greeting', text: "Hello! I'm your AI business builder. Shall we begin?", action: 'button', buttonText: "Yes, let's start!" },
        { id: 'get_idea', text: "Great! What is your business idea?", action: 'input', placeholder: 'e.g., An eco-friendly subscription box...', dataKey: 'idea' },
        { id: 'get_budget', text: (data) => `"${data.idea}" sounds promising! What's your estimated starting budget?`, action: 'input', placeholder: 'e.g., $5,000...', dataKey: 'budget' },
        { id: 'get_audience', text: "Got it. Who is your target audience?", action: 'input', placeholder: 'e.g., Eco-conscious young professionals...', dataKey: 'audience' },
        { id: 'get_uniqueness', text: 'Excellent. And what makes your business unique?', action: 'input', placeholder: 'e.g., We use 100% locally sourced materials...', dataKey: 'uniqueness' },
        { id: 'generating', text: 'Perfect! Generating your business plan with Gemini AI...', action: 'generate' },
    ]);
    
    const callGeminiAPI = async (prompt, schema) => {
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
        
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody.error.message || `Request failed with status ${response.status}`);
        }

        const result = await response.json();
        const jsonText = result.candidates[0].content.parts[0].text;
        return JSON.parse(jsonText);
    };
    
    const generateBusinessPlan = async () => {
        setIsGenerating(true);
        setApiError('');
        
        if (!GEMINI_API_KEY) {
            setApiError("Gemini API key is missing. Please add it to the code.");
            setPlan({ title: "API Key Missing", expertOpinion: "Please add your Gemini API key to generate a real plan. This is a sample.", potential: "", advantages: [], disadvantages: [], budgetBreakdown: [] });
            setIsGenerating(false);
            return;
        }

        try {
            const prompt = `Generate a comprehensive business plan based on the following details. Be realistic and insightful.
            - Business Idea: ${businessData.idea}
            - Starting Budget: ${businessData.budget}
            - Target Audience: ${businessData.audience}
            - Unique Selling Proposition: ${businessData.uniqueness}`;
            
            const schema = {
                type: "OBJECT",
                properties: {
                    title: { type: "STRING" },
                    expertOpinion: { type: "STRING" },
                    potential: { type: "STRING" },
                    advantages: { type: "ARRAY", items: { type: "STRING" } },
                    disadvantages: { type: "ARRAY", items: { type: "STRING" } },
                    budgetBreakdown: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                item: { type: "STRING" },
                                cost: { type: "STRING" },
                                details: { type: "STRING" }
                            }
                        }
                    }
                }
            };

            const generatedPlan = await callGeminiAPI(prompt, schema);
            setPlan(generatedPlan);
        } catch (error) {
            console.error("Error generating plan:", error);
            setApiError(`Failed to generate plan: ${error.message}. Please check your API key and network.`);
            setPlan(null);
        } finally {
            setIsGenerating(false);
        }
    };

    const currentStepConfig = conversationFlow.current[conversationStep];
    const typedAiText = useTypingEffect(currentAiText, 30, () => {
        if (currentStepConfig.action === 'button' || currentStepConfig.action === 'input') setShowUserInput(true);
        else if (currentStepConfig.action === 'generate') generateBusinessPlan();
    });

    useEffect(() => {
        setShowUserInput(false);
        const stepConfig = conversationFlow.current[conversationStep];
        const text = typeof stepConfig.text === 'function' ? stepConfig.text(businessData) : stepConfig.text;
        setCurrentAiText(text);
    }, [conversationStep, businessData]);

    const handleAction = (e) => {
        if (e) e.preventDefault();
        const nextStep = conversationStep + 1;
        if (currentStepConfig.action === 'input') {
            if (!userInput.trim()) return;
            setBusinessData(prev => ({ ...prev, [currentStepConfig.dataKey]: userInput.trim() }));
            setUserInput('');
        }
        if (nextStep < conversationFlow.current.length) setConversationStep(nextStep);
    };
    
    const handleReset = () => {
        setPlan(null);
        setAdditionalPlan(null);
        setBusinessData({});
        setConversationStep(0);
        setApiError('');
    };

    const generateAdditionalPlan = async (type) => {
        setAdditionalPlan({ type: 'loading' });
        setApiError('');
        if (!GEMINI_API_KEY) {
             setApiError("Cannot generate additional plan without Gemini API key.");
             setAdditionalPlan(null);
             return;
        }

        try {
            const prompt = `Based on this business plan title: "${plan.title}", generate a detailed "${type}" plan. Be specific and provide actionable steps.`;
            const schema = {
                type: "OBJECT",
                properties: {
                    title: { type: "STRING" },
                    content: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                heading: { type: "STRING" },
                                details: { type: "ARRAY", items: { type: "STRING" } }
                            }
                        }
                    }
                }
            };
            const generatedPlan = await callGeminiAPI(prompt, schema);
            setAdditionalPlan({ ...generatedPlan, type });
        } catch (error) {
            console.error("Error generating additional plan:", error);
            setApiError(`Failed to generate additional plan: ${error.message}`);
            setAdditionalPlan(null);
        }
    };

    if (plan || apiError) {
        return (
            <div className="p-4 sm:p-6 space-y-6">
                 {apiError && <Card className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200"><p>{apiError}</p></Card>}
                {plan && (
                    <Card className="animate-fade-in-up space-y-6">
                        <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{plan.title}</h3>
                        <div>
                            <h4 className="flex items-center gap-2 text-xl font-bold mb-2 text-gray-800 dark:text-white"><Lightbulb className="text-yellow-500"/>Expert's Opinion</h4>
                            <p className="text-gray-600 dark:text-gray-400 italic">{plan.expertOpinion}</p>
                        </div>
                        {plan.potential && (
                            <div>
                                <h4 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">Potential</h4>
                                <p className="text-gray-600 dark:text-gray-400">{plan.potential}</p>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <h4 className="flex items-center gap-2 text-xl font-bold mb-2 text-gray-800 dark:text-white"><CheckCircle className="text-green-500"/>Advantages</h4>
                                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
                                    {plan.advantages.map((item, i) => <li key={i}>{item}</li>)}
                                </ul>
                            </div>
                             <div>
                                <h4 className="flex items-center gap-2 text-xl font-bold mb-2 text-gray-800 dark:text-white"><XCircle className="text-red-500"/>Disadvantages</h4>
                                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
                                    {plan.disadvantages.map((item, i) => <li key={i}>{item}</li>)}
                                </ul>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">Budget Breakdown</h4>
                            <div className="overflow-x-auto">
                               <table className="w-full text-left">
                                   <thead className="bg-gray-50 dark:bg-gray-700">
                                       <tr><th className="p-2">Item</th><th className="p-2">Est. Cost</th><th className="p-2">Details</th></tr>
                                   </thead>
                                   <tbody>
                                       {plan.budgetBreakdown.map((item, i) => (
                                           <tr key={i} className="border-b dark:border-gray-700">
                                               <td className="p-2 font-semibold">{item.item}</td><td className="p-2">{item.cost}</td><td className="p-2 text-sm text-gray-500 dark:text-gray-400">{item.details}</td>
                                           </tr>
                                       ))}
                                   </tbody>
                               </table>
                            </div>
                        </div>
                    </Card>
                )}
                {plan && !additionalPlan && (
                    <Card className="animate-fade-in-up">
                        <h4 className="text-xl font-bold mb-4 text-center text-gray-800 dark:text-white">Generate More with AI</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Button onClick={() => generateAdditionalPlan('promotion')} variant="secondary">Promotion Plan</Button>
                            <Button onClick={() => generateAdditionalPlan('social media')} variant="secondary">Social Media Plan</Button>
                            <Button onClick={() => generateAdditionalPlan('growth strategy')} variant="secondary">Growth Strategy</Button>
                        </div>
                    </Card>
                )}
                {additionalPlan?.type === 'loading' && <LoadingSpinner />}
                {additionalPlan && additionalPlan.type !== 'loading' && (
                    <Card className="animate-fade-in-up space-y-4">
                        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500">{additionalPlan.title}</h3>
                        {additionalPlan.content.map((section, i) => (
                            <div key={i}>
                                <h4 className="font-bold text-lg mb-2 text-gray-800 dark:text-white">{section.heading}</h4>
                                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
                                    {section.details.map((point, j) => <li key={j}>{point}</li>)}
                                </ul>
                            </div>
                        ))}
                    </Card>
                )}
                <Button onClick={handleReset} className="w-full">Start a New Plan</Button>
            </div>
        )
    }

    return (
        <div className="p-4 flex flex-col h-[calc(100vh-140px)] justify-center items-center text-center">
            <div className="max-w-2xl w-full">
                <h2 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-8">Business Builder</h2>
                <p className="text-2xl text-gray-700 dark:text-gray-300 min-h-[100px]">
                    {typedAiText}{isGenerating && <span className="animate-ping">.</span>}
                </p>
                <div className="mt-12 min-h-[100px]">
                    {showUserInput && currentStepConfig.action === 'button' && (
                        <div className="flex justify-center animate-fade-in-up">
                            <Button onClick={handleAction} className="text-lg">{currentStepConfig.buttonText}</Button>
                        </div>
                    )}
                    {showUserInput && currentStepConfig.action === 'input' && (
                        <form onSubmit={handleAction} className="flex items-center gap-4 animate-fade-in-up">
                            <input
                                type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)}
                                placeholder={currentStepConfig.placeholder}
                                className="flex-grow p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-center text-lg"
                                autoFocus
                            />
                            <Button type="submit" className="p-4 !rounded-full" disabled={!userInput.trim()}><Send size={24} /></Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};


const FinanceManager = () => {
    const user = mockUserData.adult;
    return (
         <div className="py-6 space-y-6">
             <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Finance Manager</h2>
            <Card>
                <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">Spending by Category</h3>
                 <div style={{height: 300}}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={user.spendingByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                                {user.spendingByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </Card>
            <Card>
                <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">Recent Transactions</h3>
                {user.transactions.length > 0 ? (
                    <ul className="space-y-4">
                        {user.transactions.map(tx => (
                            <li key={tx.id} className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-white">{tx.category}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{tx.date}</p>
                                </div>
                                <p className={`font-bold ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {tx.amount > 0 ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                                </p>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-gray-500 dark:text-gray-400">No transactions yet.</p>}
            </Card>
         </div>
    );
};

const InvestmentTracker = () => {
    const user = mockUserData.adult.investments;
     return (
        <div className="py-6 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Investment Portfolio</h2>
            <Card className="bg-gradient-to-r from-green-500 to-teal-600 text-white">
                <p className="opacity-80 text-lg">Portfolio Value</p>
                <p className="text-4xl font-extrabold tracking-tight">${user.portfolioValue.toLocaleString()}</p>
            </Card>
            <Card>
                <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">Portfolio Performance (30d)</h3>
                <div style={{height: 200}}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={user.performance}>
                             <XAxis dataKey="date" stroke="gray"/>
                            <YAxis stroke="gray"/>
                            <Tooltip />
                            <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>
            <Card>
                <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">Your Assets</h3>
                {user.assets.length > 0 ? (
                    <ul className="space-y-4">
                        {user.assets.map(asset => (
                            <li key={asset.id} className="flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-white">{asset.name} <span className="text-sm font-normal text-gray-500">{asset.ticker}</span></p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{asset.type}</p>
                                </div>
                                <div>
                                    <p className="font-bold text-right text-gray-800 dark:text-white">${asset.value.toLocaleString()}</p>
                                    <p className={`text-sm font-bold text-right ${asset.change > 0 ? 'text-green-500' : 'text-red-500'}`}>{asset.change.toFixed(2)}%</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-gray-500 dark:text-gray-400">No assets in your portfolio.</p>}
            </Card>
        </div>
    );
};

const GoalPlanner = () => {
    const user = mockUserData.adult;
    return (
         <div className="py-6 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Your Financial Goals</h2>
            {user.goals && user.goals.length > 0 ? user.goals.map(goal => (
                <Card key={goal.id}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                           {goal.icon === 'Car' && <Zap className="h-8 w-8 text-blue-500" />}
                           {goal.icon === 'Plane' && <Target className="h-8 w-8 text-purple-500" />}
                           {goal.icon === 'Home' && <Home className="h-8 w-8 text-green-500" />}
                           <p className="font-bold text-lg text-gray-800 dark:text-white">{goal.name}</p>
                        </div>
                        <p className="font-semibold text-gray-600 dark:text-gray-300">
                            {goal.total > 0 ? Math.round((goal.saved / goal.total) * 100) : 0}%
                        </p>
                    </div>
                    <div className="mt-4">
                         <p className="text-sm text-gray-500 dark:text-gray-400 text-right mb-1">
                            ${goal.saved.toLocaleString()} / ${goal.total.toLocaleString()}
                        </p>
                        <ProgressBar value={goal.saved} max={goal.total} colorClass="bg-green-500" />
                    </div>
                </Card>
            )) : (
                 <Card>
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        <p className="text-lg">You haven't set any goals yet.</p>
                        <p>Let's create one!</p>
                    </div>
                </Card>
            )}
             <Button className="w-full mt-4" variant="success">Add New Goal</Button>
         </div>
    );
};


const KidsDashboard = ({ setView }) => {
    const kid = mockUserData.kid;
    return (
        <div className="py-6 px-4 sm:px-6 space-y-8 bg-gradient-to-br from-yellow-50 to-pink-100 dark:from-gray-800 dark:to-indigo-900/50 min-h-screen">
            <div className="text-center">
                <h2 className="text-4xl font-extrabold text-gray-800 dark:text-white">Hi, {kid.name}!</h2>
                <p className="text-gray-600 dark:text-gray-300">Level {kid.level} - Keep going!</p>
                <div className="mt-4 px-4">
                    <ProgressBar value={kid.xp} max={kid.xpToNextLevel} colorClass="bg-pink-400"/>
                    <p className="text-sm text-pink-600 dark:text-pink-300 font-bold mt-1 text-right">{kid.xp} / {kid.xpToNextLevel} XP</p>
                </div>
            </div>

            <Card className="text-center bg-gradient-to-r from-pink-400 to-red-400 text-white">
                <p className="opacity-80 text-lg">Your Piggy Bank</p>
                <p className="text-5xl font-extrabold tracking-tight">${kid.piggyBank.toFixed(2)}</p>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div onClick={() => setView('kidsPiggyBank')} className="cursor-pointer group flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg hover:shadow-xl transition-transform transform hover:scale-105">
                     <AnimatedIllustration type="piggy" />
                    <h3 className="text-xl font-bold mt-2 text-gray-800 dark:text-white">Savings Piggy Bank</h3>
                </div>
                 <div onClick={() => setView('lemonadeStand')} className="cursor-pointer group flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg hover:shadow-xl transition-transform transform hover:scale-105">
                     <AnimatedIllustration type="lemonade" />
                    <h3 className="text-xl font-bold mt-2 text-gray-800 dark:text-white">Lemonade Stand</h3>
                </div>
            </div>

            <Card>
                <h3 className="font-bold text-xl mb-4 text-gray-800 dark:text-white">Your Quests</h3>
                {kid.quests && kid.quests.length > 0 ? (
                    <ul className="space-y-3">
                        {kid.quests.map(q => (
                            <li key={q.id} className={`flex items-center justify-between p-3 rounded-lg ${q.completed ? 'bg-green-100 dark:bg-green-900/50 opacity-60' : 'bg-yellow-100 dark:bg-yellow-900/50'}`}>
                               <div>
                                    <p className={`font-semibold ${q.completed ? 'line-through text-gray-500' : 'text-gray-800 dark:text-white'}`}>{q.text}</p>
                               </div>
                               <div className="flex items-center space-x-2 bg-yellow-200 dark:bg-yellow-700 px-2 py-1 rounded-full">
                                   <Star className="h-4 w-4 text-yellow-600 dark:text-yellow-300" />
                                   <span className="font-bold text-sm text-yellow-800 dark:text-yellow-200">{q.xp} XP</span>
                               </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                        <p>No quests at the moment. Ask your parents for a new challenge!</p>
                    </div>
                )}
            </Card>

            <div className="flex justify-center">
                <Button onClick={() => setView('parentDashboard')} variant="secondary">Parent Dashboard</Button>
            </div>
        </div>
    );
};

const KidsPiggyBankGame = () => {
    const [savings, setSavings] = useState(mockUserData.kid.piggyBank);
    const [amount, setAmount] = useState(1);

    const addMoney = () => {
        if (amount > 0) {
            setSavings(prev => prev + amount);
        }
    };

    return (
        <div className="py-6 text-center">
            <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-white">Savings Piggy Bank</h2>
            <AnimatedIllustration type="piggy" />
            <p className="text-5xl font-extrabold text-pink-500 my-8">${savings.toFixed(2)}</p>
            <div className="flex justify-center items-center gap-4">
                <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} min="1" className="w-24 p-3 text-center font-bold text-xl rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"/>
                <Button onClick={addMoney} variant="success">Add to Piggy</Button>
            </div>
        </div>
    );
};

const ParentDashboard = () => {
     return (
        <div className="py-6 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Parent Dashboard</h2>
            <Card>
                <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">Lily's Progress</h3>
                <div className="space-y-4">
                    <p><strong>Level:</strong> {mockUserData.kid.level}</p>
                    <p><strong>XP:</strong> {mockUserData.kid.xp} / {mockUserData.kid.xpToNextLevel}</p>
                    <p><strong>Savings:</strong> ${mockUserData.kid.piggyBank.toFixed(2)}</p>
                </div>
            </Card>
            <Card>
                <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">Manage Quests</h3>
                {mockUserData.kid.quests && mockUserData.kid.quests.length > 0 ? (
                    <ul className="space-y-3 mb-4">
                        {mockUserData.kid.quests.map(q => (
                             <li key={q.id} className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <span>{q.text}</span>
                               <span className={q.completed ? 'text-green-500 font-bold' : 'text-gray-500'}>{q.completed ? 'Done' : 'Pending'}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-4 mb-4">
                        <p>No quests assigned to Lily.</p>
                    </div>
                )}
                <Button className="w-full" variant="secondary">Add New Quest</Button>
            </Card>
             <Button className="w-full" variant="primary">Send Reward</Button>
        </div>
    );
}

const SubscriptionScreen = () => (
    <div className="py-6 space-y-8">
        <div className="text-center">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Unlock Your Potential</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Choose the plan that's right for you.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 border-transparent hover:border-cyan-400 transition">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Basic Premium</h3>
                <p className="text-3xl font-extrabold my-4 text-gray-900 dark:text-white">€10<span className="text-lg font-medium text-gray-500">/month</span></p>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                    <li>Unlimited Business Maker</li>
                    <li>Personalized Financial Plans</li>
                    <li>More Child Games</li>
                </ul>
                <Button className="w-full mt-6" variant="secondary">Get Started</Button>
            </Card>
             <Card className="border-2 border-blue-500 relative">
                 <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold">Most Popular</div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Pro Premium</h3>
                <p className="text-3xl font-extrabold my-4 text-gray-900 dark:text-white">€20<span className="text-lg font-medium text-gray-500">/month</span></p>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                    <li>All Basic Features</li>
                    <li>AI Investment Analysis</li>
                    <li>Advanced Business Coaching</li>
                    <li>Exclusive Webinars</li>
                </ul>
                <Button className="w-full mt-6" variant="primary">Choose Pro</Button>
            </Card>
             <Card className="border-2 border-transparent hover:border-green-400 transition">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Family/Team Plan</h3>
                <p className="text-3xl font-extrabold my-4 text-gray-900 dark:text-white">€30<span className="text-lg font-medium text-gray-500">/month</span></p>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                    <li>All Pro Features</li>
                    <li>Parent-Child Linked Accounts</li>
                    <li>Family Tasks & Rewards</li>
                    <li>Family Learning Games</li>
                </ul>
                <Button className="w-full mt-6" variant="success">Choose Family</Button>
            </Card>
        </div>
    </div>
);


const MainLayout = ({ children, view, setView, theme, toggleTheme, userMode, onLogout }) => {
    const titles = {
        adultDashboard: 'Dashboard',
        kidsDashboard: `Hi ${mockUserData.kid.name}!`,
        financeManager: 'Finance Manager',
        investmentTracker: 'Investment Tracker',
        market: 'Crypto Market',
        businessMaker: 'AI Business Maker',
        goalPlanner: 'Goal Planner',
        kidsPiggyBank: 'Piggy Bank Game',
        lemonadeStand: 'Lemonade Stand',
        parentDashboard: 'Parent Dashboard',
        subscriptions: 'Subscriptions',
        settings: 'Settings',
    };

    const isDashboard = view === 'adultDashboard' || view === 'kidsDashboard';

    return (
        <div className={`font-sans bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300`}>
             <Header 
                title={titles[view] || 'Vaulty'}
                onBack={!isDashboard ? () => setView(userMode === 'adult' ? 'adultDashboard' : 'kidsDashboard') : null}
                theme={theme} 
                toggleTheme={toggleTheme}
                userMode={userMode}
                onLogout={onLogout}
            />
            <main className="pb-24">
                {
                    ['businessMaker', 'kidsDashboard'].includes(view)
                    ? children
                    : (
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            {children}
                        </div>
                    )
                }
            </main>
            <BottomNav view={view} setView={setView} userMode={userMode} />
        </div>
    );
};

const BottomNav = ({ view, setView, userMode }) => {
    const adultNav = [
        { id: 'adultDashboard', label: 'Home', icon: Home },
        { id: 'investmentTracker', label: 'Invest', icon: BarChart2 },
        { id: 'market', label: 'Market', icon: Store },
        { id: 'businessMaker', label: 'Create', icon: Zap },
        { id: 'subscriptions', label: 'Premium', icon: Crown },
    ];
    const kidNav = [
        { id: 'kidsDashboard', label: 'Play', icon: Home },
        { id: 'kidsPiggyBank', label: 'Save', icon: PiggyBankIcon },
        { id: 'parentDashboard', label: 'Parents', icon: Users },
    ];

    const navItems = userMode === 'adult' ? adultNav : kidNav;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-[0_-2px_10px_rgba(0,0,0,0.1)] rounded-t-2xl">
            <div className="flex justify-around items-center max-w-xl mx-auto p-2">
                {navItems.map(item => (
                    <button key={item.id} onClick={() => setView(item.id)} className="flex flex-col items-center justify-center w-20 h-16 rounded-lg space-y-1 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <item.icon className={`h-6 w-6 ${view === item.id ? 'text-cyan-500' : 'text-gray-500 dark:text-gray-400'}`} />
                        <span className={`text-xs font-bold ${view === item.id ? 'text-cyan-500' : 'text-gray-600 dark:text-gray-300'}`}>{item.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
}

// --- MAIN APP COMPONENT ---
export default function App() {
    const [view, setView] = useState('splash');
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [authReady, setAuthReady] = useState(false);
    const { theme, toggleTheme } = useVaultyTheme();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    const dbUserData = userDocSnap.data();
                    setUserData(dbUserData);
                    if (dbUserData.userMode) {
                        setView(dbUserData.userMode === 'adult' ? 'adultDashboard' : 'kidsDashboard');
                    } else {
                        setView('modeSelection');
                    }
                } else {
                    setUserData(null);
                    setView('modeSelection'); // New user, doc not yet created or found
                }
                setUser(currentUser);
            } else {
                setUser(null);
                setUserData(null);
                setView('auth');
            }
            setAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    const handleModeSelect = async (mode) => {
        if (user) {
            try {
                const userDocRef = doc(db, "users", user.uid);
                await setDoc(userDocRef, { userMode: mode }, { merge: true });
                setUserData(prev => ({ ...prev, userMode: mode }));
                setView(mode === 'adult' ? 'adultDashboard' : 'kidsDashboard');
            } catch (error) {
                console.error("Error saving user mode:", error);
            }
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        setView('auth');
    };

    const renderView = () => {
        switch (view) {
            case 'auth': return <AuthScreen setView={setView} />;
            case 'login': return <LoginScreen setView={setView} />;
            case 'register': return <RegisterScreen setView={setView} />;
            case 'modeSelection': return <ModeSelectionScreen onSelect={handleModeSelect} />;
            case 'adultDashboard': return <AdultDashboard setView={setView} userName={userData?.firstName || 'User'} />;
            case 'financeManager': return <FinanceManager setView={setView} />;
            case 'investmentTracker': return <InvestmentTracker />;
            case 'market': return <MarketPage />;
            case 'businessMaker': return <BusinessMaker />;
            case 'goalPlanner': return <GoalPlanner />;
            case 'kidsDashboard': return <KidsDashboard setView={setView} />;
            case 'kidsPiggyBank': return <KidsPiggyBankGame />;
            case 'lemonadeStand': return <div className="py-6 text-center"><h2 className="text-2xl">Lemonade Stand Game - Coming Soon!</h2></div>;
            case 'parentDashboard': return <ParentDashboard />;
            case 'subscriptions': return <SubscriptionScreen />;
            default:
                return <AuthScreen setView={setView} />;
        }
    };

    if (!authReady) {
        return <div className={theme}><SplashScreen /></div>;
    }
    
    // If user is not logged in, show auth screens without main layout
    if (!user) {
         return <div className={theme}>{renderView()}</div>
    }

    return (
        <div className={theme}>
            <MainLayout
                view={view}
                setView={setView}
                theme={theme}
                toggleTheme={toggleTheme}
                userMode={userData?.userMode}
                onLogout={handleLogout}
            >
               {renderView()}
            </MainLayout>
        </div>
    );
}

