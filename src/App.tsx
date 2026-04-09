import { motion, AnimatePresence } from "motion/react";
import { 
  Vote, 
  User, 
  ShieldCheck, 
  Code, 
  AlertTriangle, 
  Calendar, 
  ExternalLink,
  Users,
  Eye,
  ChevronRight,
  Trophy,
  Settings,
  Save,
  Image as ImageIcon,
  X,
  Plus,
  Trash2,
  ClipboardCheck,
  Link as LinkIcon,
  LogOut,
  LogIn
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

// Firebase Imports
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { getFirestore, doc, onSnapshot, setDoc, updateDoc, increment, getDoc } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const googleProvider = new GoogleAuthProvider();

// Error Handling Utility
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // We don't throw here to avoid crashing the whole app, but we log it clearly
}

// Types
interface Candidate {
  id: string;
  name: string;
  party: string;
  slogan: string;
  logo: string;
  photo: string;
  socialLink: string;
}

interface SiteData {
  logo: string;
  hero: {
    date: string;
    title: string;
    accent: string;
    description: string;
  };
  candidates: Candidate[];
  commissioner: {
    name: string;
    role: string;
    quote: string;
    photo: string;
  };
  designer: {
    name: string;
    role: string;
    bio: string;
    photo: string;
  };
  hallOfShame: {
    year2024: { title: string; details: string }[];
    year2025: { title: string; details: string }[];
  };
}

const INITIAL_DATA: SiteData = {
  logo: "https://res.cloudinary.com/speed-searches/image/upload/v1775643609/FINAL_20260408_154719_0000_nkldtb.png",
  hero: {
    date: "Election Day: 16th March 2026",
    title: "VOTE FOR",
    accent: "CHANGE",
    description: "The festival of democracy is here. Choose your representative wisely. Explore the candidates, their visions, and their commitment to Raiganj."
  },
  candidates: [
    {
      id: "1",
      name: "Utsab Saha",
      party: "People's Communist Party of Raiganj (PCPR)",
      slogan: "Empowering the Working Class for a Brighter Raiganj.",
      logo: "https://res.cloudinary.com/speed-searches/image/upload/v1775664480/IMG-20260408-WA0012_skjn4g.jpg",
      photo: "https://picsum.photos/seed/utsab/400/500",
      socialLink: ""
    },
    {
      id: "2",
      name: "Sayan Basak",
      party: "Public Servant of Raiganj (PSR)",
      slogan: "স্বাধীন জীবন সবার অধিকার।",
      logo: "https://res.cloudinary.com/speed-searches/image/upload/v1775664479/IMG-20260408-WA0015_pjwokv.jpg",
      photo: "https://picsum.photos/seed/sayan/400/500",
      socialLink: ""
    },
    {
      id: "3",
      name: "Saprativ Ghosh",
      party: "Patriotic Vanguard Alliance (PVA)",
      slogan: "Power of the People, Call of a New Age. A United Nation, Building a New Future.",
      logo: "https://res.cloudinary.com/speed-searches/image/upload/v1775702251/a29c18df-495d-46ba-9c8f-4c67502a9a7e.png",
      photo: "https://picsum.photos/seed/saprativ/400/500",
      socialLink: "https://www.instagram.com/_pva2.0?igsh=ZHJ1MGd4dDlycGR6"
    },
    {
      id: "4",
      name: "Soumajit Biswas",
      party: "Unfiltered Opinion Party (UOP)",
      slogan: "কাওকে ভয় না করে অপরিবর্তিত মতামত প্রকাশ।",
      logo: "https://res.cloudinary.com/speed-searches/image/upload/v1775702568/208ba945-61b9-42b4-968a-7b39e0049992.png",
      photo: "https://picsum.photos/seed/soumajit/400/500",
      socialLink: ""
    },
    {
      id: "5",
      name: "Souparno Chowdhury",
      party: "Raiganj Republic Rebels",
      slogan: "Roudram Ranam Rudhiram",
      logo: "https://res.cloudinary.com/speed-searches/image/upload/v1775702401/2be78db7-5fce-4cf7-af83-3387ca207ed4.png",
      photo: "https://picsum.photos/seed/souparno/400/500",
      socialLink: ""
    },
    {
      id: "6",
      name: "Samriddha Paul",
      party: "Independent Visionary",
      slogan: "Innovation and Integrity for the Future.",
      logo: "https://picsum.photos/seed/samriddha-logo/200/200",
      photo: "https://picsum.photos/seed/samriddha/400/500",
      socialLink: ""
    },
  ],
  commissioner: {
    name: "Hon. Rajesh Kumar",
    role: "Chief Election Officer",
    quote: "Our mission is to uphold the sanctity of the democratic process. We are committed to providing every citizen with a safe and accessible environment to cast their vote. Transparency is our foundation, and integrity is our guide.",
    photo: "https://picsum.photos/seed/commissioner/600/800"
  },
  designer: {
    name: "Arpan Chowdhury",
    role: "Full Stack Developer & UI/UX Designer",
    bio: "Specialized in building high-performance web applications with a focus on user experience and modern aesthetics.",
    photo: "https://picsum.photos/seed/designer/200/200"
  },
  hallOfShame: {
    year2024: [
      { title: "The Great Budget Disappearance", details: "Details pending investigation..." },
      { title: "Unfulfilled Infrastructure Promises", details: "Details pending investigation..." }
    ],
    year2025: [
      { title: "The Great Budget Disappearance", details: "Details pending investigation..." },
      { title: "Unfulfilled Infrastructure Promises", details: "Details pending investigation..." }
    ]
  }
};

// Components
function EditableText({ 
  value, 
  onSave, 
  isEditing, 
  className = "", 
  multiline = false,
  as: Component = "span" 
}: { 
  value: string; 
  onSave: (val: string) => void; 
  isEditing: boolean; 
  className?: string;
  multiline?: boolean;
  as?: any;
}) {
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  if (isEditing) {
    return multiline ? (
      <textarea
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={() => onSave(tempValue)}
        className={`w-full bg-white/10 border border-orange-500/50 rounded px-2 py-1 outline-none focus:ring-2 ring-orange-500/20 ${className}`}
        rows={3}
      />
    ) : (
      <input
        type="text"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={() => onSave(tempValue)}
        className={`bg-white/10 border border-orange-500/50 rounded px-2 py-1 outline-none focus:ring-2 ring-orange-500/20 ${className}`}
      />
    );
  }

  return <Component className={className}>{value}</Component>;
}

function EditableImage({ 
  src, 
  onSave, 
  isEditing, 
  className = "",
  alt = ""
}: { 
  src: string; 
  onSave: (val: string) => void; 
  isEditing: boolean; 
  className?: string;
  alt?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onSave(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`relative group ${className}`}>
      <img src={src} alt={alt} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      {isEditing && (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20"
        >
          <div className="flex flex-col items-center gap-1 text-white p-1 text-center">
            <ImageIcon className="w-4 h-4 sm:w-6 sm:h-6" />
            <span className="text-[8px] sm:text-[10px] font-bold uppercase leading-tight">Change</span>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title, subtitle, icon: Icon }: { title: string; subtitle?: string; icon?: any }) {
  return (
    <div className="mb-12 text-center">
      {Icon && (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
          <Icon size={24} />
        </div>
      )}
      <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
        {title}
      </h2>
      {subtitle && <p className="mt-4 text-sm text-gray-400 sm:text-base">{subtitle}</p>}
      <div className="mx-auto mt-6 h-1 w-20 bg-gradient-to-r from-orange-500 to-red-600 rounded-full" />
    </div>
  );
}

function CandidateCard({ 
  candidate, 
  isEditing, 
  onUpdate,
  onDelete
}: { 
  candidate: Candidate; 
  isEditing: boolean;
  onUpdate: (id: string, updates: Partial<Candidate>) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={!isEditing ? { y: -10 } : {}}
      className="group relative overflow-hidden rounded-2xl glass p-4 sm:p-6 transition-all hover:border-orange-500/50"
    >
      {isEditing && (
        <button 
          onClick={() => onDelete(candidate.id)}
          className="absolute top-4 right-4 z-30 p-2 bg-red-600 rounded-full text-white hover:bg-red-500 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      )}
      <div className="relative mb-6 aspect-[4/5] overflow-hidden rounded-xl">
        <EditableImage 
          src={candidate.photo} 
          onSave={(val) => onUpdate(candidate.id, { photo: val })}
          isEditing={isEditing}
          alt={candidate.name}
          className="h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-4 left-4 z-30">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-white p-2 shadow-lg overflow-hidden">
            <EditableImage 
              src={candidate.logo} 
              onSave={(val) => onUpdate(candidate.id, { logo: val })}
              isEditing={isEditing}
              alt={`${candidate.party} logo`}
              className="h-full w-full"
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <EditableText 
          value={candidate.name} 
          onSave={(val) => onUpdate(candidate.id, { name: val })}
          isEditing={isEditing}
          as="h3"
          className="font-display text-xl sm:text-2xl font-bold text-white block"
        />
        <EditableText 
          value={candidate.party} 
          onSave={(val) => onUpdate(candidate.id, { party: val })}
          isEditing={isEditing}
          className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-orange-500/80 block"
        />
        <EditableText 
          value={candidate.slogan} 
          onSave={(val) => onUpdate(candidate.id, { slogan: val })}
          isEditing={isEditing}
          multiline
          className="text-sm text-gray-400 italic leading-relaxed block"
        />
        {isEditing && (
          <div className="mt-2">
            <span className="text-[10px] uppercase font-bold text-white/40 block mb-1">Social Link</span>
            <EditableText 
              value={candidate.socialLink} 
              onSave={(val) => onUpdate(candidate.id, { socialLink: val })}
              isEditing={isEditing}
              className="text-[10px] text-blue-400 block underline truncate"
            />
          </div>
        )}
      </div>
      
      {!isEditing && (
        <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
          {candidate.socialLink ? (
            <a 
              href={candidate.socialLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
            >
              View Social Media <ExternalLink size={16} />
            </a>
          ) : (
            <span className="text-sm font-medium text-white/20">No Social Media</span>
          )}
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-orange-500/20 transition-colors cursor-pointer">
              <Users size={14} className="text-white/40" />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function App() {
  const [data, setData] = useState<SiteData>(INITIAL_DATA);
  const [isEditing, setIsEditing] = useState(false);
  const [visitCount, setVisitCount] = useState(0);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // Only the specific user email is admin
      setIsAdmin(currentUser?.email === "geoguesserproplayer@gmail.com");
    });
    return () => unsubscribe();
  }, []);

  // Firestore Real-time Listener for Site Data
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "site", "content"), (docSnap) => {
      if (docSnap.exists()) {
        const remoteData = docSnap.data() as SiteData;
        setData(remoteData);
      } else {
        // If it doesn't exist, we just use INITIAL_DATA locally.
        // We only attempt to initialize in Firestore if the user is an admin.
        setData(INITIAL_DATA);
      }
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "site/content");
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Initialize content if admin and it doesn't exist
  useEffect(() => {
    if (isAdmin && !isLoading) {
      getDoc(doc(db, "site", "content")).then(docSnap => {
        if (!docSnap.exists()) {
          setDoc(doc(db, "site", "content"), INITIAL_DATA)
            .catch(err => handleFirestoreError(err, OperationType.CREATE, "site/content"));
        }
      });
    }
  }, [isAdmin, isLoading]);

  // Firestore Real-time Listener for Visit Count
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "site", "stats"), (docSnap) => {
      if (docSnap.exists()) {
        setVisitCount(docSnap.data().visitCount || 0);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "site/stats");
    });
    return () => unsubscribe();
  }, []);

  // Increment visit count on load (client-side only, once per session)
  useEffect(() => {
    const sessionKey = "has_visited_session";
    if (!sessionStorage.getItem(sessionKey)) {
      const statsRef = doc(db, "site", "stats");
      updateDoc(statsRef, {
        visitCount: increment(1)
      }).catch((error) => {
        // If doc doesn't exist, try to create it (anyone can create stats doc)
        if (error.code === 'not-found' || error.message.includes('not-found')) {
          setDoc(statsRef, { visitCount: 12459 }, { merge: true })
            .catch(err => handleFirestoreError(err, OperationType.CREATE, "site/stats"));
        } else {
          handleFirestoreError(error, OperationType.UPDATE, "site/stats");
        }
      });
      sessionStorage.setItem(sessionKey, "true");
    }
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = () => signOut(auth);

  const updateVisitCount = async (newCount: string) => {
    if (!isAdmin) return;
    const val = parseInt(newCount.replace(/,/g, ""));
    if (!isNaN(val)) {
      await updateDoc(doc(db, "site", "stats"), { visitCount: val });
    }
  };

  const resetSiteData = async () => {
    if (!isAdmin) return;
    if (window.confirm("Are you sure you want to reset all site content to defaults? This cannot be undone.")) {
      await setDoc(doc(db, "site", "content"), INITIAL_DATA);
    }
  };

  const saveToFirestore = async (newData: SiteData) => {
    if (!isAdmin) return;
    setData(newData);
    await setDoc(doc(db, "site", "content"), newData);
  };

  const updateLogo = (newLogo: string) => {
    saveToFirestore({ ...data, logo: newLogo });
  };

  const updateHero = (updates: Partial<SiteData["hero"]>) => {
    saveToFirestore({ ...data, hero: { ...data.hero, ...updates } });
  };

  const updateCandidate = (id: string, updates: Partial<Candidate>) => {
    const newCandidates = data.candidates.map(c => c.id === id ? { ...c, ...updates } : c);
    saveToFirestore({ ...data, candidates: newCandidates });
  };

  const addCandidate = () => {
    const newCandidate: Candidate = {
      id: Date.now().toString(),
      name: "New Candidate",
      party: "New Party",
      slogan: "New Slogan",
      logo: "https://picsum.photos/seed/newlogo/200/200",
      photo: "https://picsum.photos/seed/newphoto/400/500",
      socialLink: ""
    };
    saveToFirestore({ ...data, candidates: [...data.candidates, newCandidate] });
  };

  const deleteCandidate = (id: string) => {
    saveToFirestore({ ...data, candidates: data.candidates.filter(c => c.id !== id) });
  };

  const updateCommissioner = (updates: Partial<SiteData["commissioner"]>) => {
    saveToFirestore({ ...data, commissioner: { ...data.commissioner, ...updates } });
  };

  const updateDesigner = (updates: Partial<SiteData["designer"]>) => {
    saveToFirestore({ ...data, designer: { ...data.designer, ...updates } });
  };

  const updateHallOfShame = (year: "year2024" | "year2025", index: number, updates: Partial<{ title: string; details: string }>) => {
    const newYearData = [...data.hallOfShame[year]];
    newYearData[index] = { ...newYearData[index], ...updates };
    saveToFirestore({ ...data, hallOfShame: { ...data.hallOfShame, [year]: newYearData } });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-orange-500">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-orange-500/30">
      {/* Admin Toggle */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
        {isAdmin && isEditing && (
          <button 
            onClick={resetSiteData}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 shadow-lg transition-all hover:bg-red-500 text-white"
            title="Reset Site Data"
          >
            <Trash2 size={24} />
          </button>
        )}
        
        {isAdmin ? (
          <div className="flex flex-col gap-3">
            <button 
              onClick={logout}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 shadow-lg transition-all hover:bg-white/20 text-white"
              title="Logout"
            >
              <LogOut size={24} />
            </button>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all ${isEditing ? 'bg-green-600 hover:bg-green-500 rotate-90' : 'bg-orange-600 hover:bg-orange-500'}`}
              title={isEditing ? "Save Changes" : "Enter Edit Mode"}
            >
              {isEditing ? <Save size={24} /> : <Settings size={24} />}
            </button>
          </div>
        ) : (
          <button 
            onClick={login}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-600 shadow-lg transition-all hover:bg-orange-500 text-white"
            title="Admin Login"
          >
            <LogIn size={24} />
          </button>
        )}
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 overflow-hidden">
              <EditableImage 
                src={data.logo} 
                onSave={updateLogo}
                isEditing={isEditing}
                alt="Logo"
                className="h-full w-full"
              />
            </div>
            <span className="font-display text-lg sm:text-xl font-bold tracking-tight">
              ChunabKeParva <span className="text-orange-500">v3.0</span>
            </span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            {["Candidates", "Commissioner", "Designer", "Hall of Shame", "Register"].map((item) => (
              <a 
                key={item} 
                href={item === "Register" ? "https://chunabkeparva-panel.vercel.app/" : `#${item.toLowerCase().replace(/\s+/g, "-")}`}
                target={item === "Register" ? "_blank" : undefined}
                rel={item === "Register" ? "noopener noreferrer" : undefined}
                className="text-sm font-medium text-white/60 hover:text-white transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
          <a 
            href="https://chunabkeparva-panel.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-orange-600 px-4 sm:px-6 py-2 text-xs sm:text-sm font-bold transition-all hover:bg-orange-500"
          >
            Register Now
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 h-64 w-64 sm:h-96 sm:w-96 rounded-full bg-orange-600/20 blur-[80px] sm:blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 h-64 w-64 sm:h-96 sm:w-96 rounded-full bg-red-600/10 blur-[80px] sm:blur-[120px]" />
        </div>
        
        <div className="container relative z-10 mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/5 px-4 py-1.5 text-xs sm:text-sm font-medium text-orange-500">
              <Calendar size={14} />
              <EditableText 
                value={data.hero.date} 
                onSave={(val) => updateHero({ date: val })} 
                isEditing={isEditing} 
              />
            </div>
            <h1 className="font-display text-5xl font-black leading-[1.1] sm:text-8xl lg:text-9xl">
              <EditableText 
                value={data.hero.title} 
                onSave={(val) => updateHero({ title: val })} 
                isEditing={isEditing} 
              /> <br />
              <span className="accent-gradient">
                <EditableText 
                  value={data.hero.accent} 
                  onSave={(val) => updateHero({ accent: val })} 
                  isEditing={isEditing} 
                />
              </span>
            </h1>
            <div className="mx-auto mt-8 max-w-2xl text-base sm:text-lg text-gray-400">
              <EditableText 
                value={data.hero.description} 
                onSave={(val) => updateHero({ description: val })} 
                isEditing={isEditing} 
                multiline
              />
            </div>
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a 
                href="https://chunabkeparva-panel.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="group w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base sm:text-lg font-bold text-black transition-all hover:bg-orange-500 hover:text-white"
              >
                Register to Vote <ChevronRight className="transition-transform group-hover:translate-x-1" />
              </a>
              <a 
                href="#candidates"
                className="w-full sm:w-auto flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-8 py-4 text-base sm:text-lg font-bold backdrop-blur-sm transition-all hover:bg-white/10"
              >
                View Candidates
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Voter Registration Section */}
      <section id="register" className="py-24 border-y border-white/5 bg-gradient-to-b from-transparent to-orange-500/5">
        <div className="container mx-auto px-6">
          <SectionHeader 
            title="Voter Registration" 
            subtitle="Your voice matters. Ensure you are registered to participate in the upcoming election."
            icon={ClipboardCheck}
          />
          <div className="mx-auto max-w-2xl text-center">
            <div className="rounded-3xl glass p-8 sm:p-12 border border-orange-500/20">
              <h3 className="text-2xl font-bold mb-6">Ready to make a difference?</h3>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Registration is the first step towards active citizenship. Click the link below to access the official registration portal and secure your vote for March 16th.
              </p>
              <div className="flex flex-col gap-4">
                <a 
                  href="https://chunabkeparva-panel.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/50 hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-orange-600/20 flex items-center justify-center text-orange-500">
                      <LinkIcon size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold">Official Registration Portal</p>
                      <p className="text-xs text-gray-500">chunabkeparva-panel.vercel.app</p>
                    </div>
                  </div>
                  <ExternalLink size={18} className="text-white/20 group-hover:text-orange-500 transition-colors" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Candidates Section */}
      <section id="candidates" className="py-24">
        <div className="container mx-auto px-6">
          <SectionHeader 
            title="The Candidates" 
            subtitle="Meet the visionaries competing to lead Raiganj into a new era."
            icon={Users}
          />
          <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {data.candidates.map((candidate) => (
              <CandidateCard 
                key={candidate.id} 
                candidate={candidate} 
                isEditing={isEditing}
                onUpdate={updateCandidate}
                onDelete={deleteCandidate}
              />
            ))}
            {isEditing && (
              <button 
                onClick={addCandidate}
                className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-white/10 p-12 hover:border-orange-500/50 hover:bg-white/5 transition-all"
              >
                <Plus size={48} className="text-white/20" />
                <span className="font-bold text-white/40">Add Candidate</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Election Commissioner Section */}
      <section id="commissioner" className="py-24 bg-white/[0.02]">
        <div className="container mx-auto px-6">
          <SectionHeader 
            title="Election Commissioner" 
            subtitle="Ensuring a fair, transparent, and democratic process."
            icon={ShieldCheck}
          />
          <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl glass">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/3 h-64 md:h-auto">
                <EditableImage 
                  src={data.commissioner.photo} 
                  onSave={(val) => updateCommissioner({ photo: val })}
                  isEditing={isEditing}
                  className="h-full w-full"
                />
              </div>
              <div className="flex flex-col justify-center p-8 md:w-2/3 md:p-12">
                <EditableText 
                  value={data.commissioner.name} 
                  onSave={(val) => updateCommissioner({ name: val })}
                  isEditing={isEditing}
                  as="h3"
                  className="font-display text-2xl sm:text-3xl font-bold block"
                />
                <EditableText 
                  value={data.commissioner.role} 
                  onSave={(val) => updateCommissioner({ role: val })}
                  isEditing={isEditing}
                  className="mt-2 text-orange-500 font-medium block"
                />
                <EditableText 
                  value={data.commissioner.quote} 
                  onSave={(val) => updateCommissioner({ quote: val })}
                  isEditing={isEditing}
                  multiline
                  className="mt-6 text-gray-400 leading-relaxed italic block"
                />
                <div className="mt-8 flex gap-4">
                  <div className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-xs sm:text-sm text-white/60">
                    <ShieldCheck size={16} /> Verified Official
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Website Designer Section */}
      <section id="designer" className="py-24">
        <div className="container mx-auto px-6">
          <SectionHeader 
            title="Website Designer" 
            subtitle="Crafting the digital gateway for democracy."
            icon={Code}
          />
          <div className="mx-auto max-w-2xl text-center">
            <motion.div 
              whileHover={!isEditing ? { scale: 1.02 } : {}}
              className="group relative overflow-hidden rounded-3xl glass p-8 sm:p-12"
            >
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl group-hover:bg-orange-500/20 transition-colors" />
              <div className="mx-auto mb-6 h-24 w-24 overflow-hidden rounded-full border-2 border-orange-500 p-1">
                <EditableImage 
                  src={data.designer.photo} 
                  onSave={(val) => updateDesigner({ photo: val })}
                  isEditing={isEditing}
                  className="h-full w-full rounded-full"
                />
              </div>
              <EditableText 
                value={data.designer.name} 
                onSave={(val) => updateDesigner({ name: val })}
                isEditing={isEditing}
                as="h3"
                className="font-display text-2xl sm:text-3xl font-bold block"
              />
              <EditableText 
                value={data.designer.role} 
                onSave={(val) => updateDesigner({ role: val })}
                isEditing={isEditing}
                className="mt-2 text-gray-400 block"
              />
              <EditableText 
                value={data.designer.bio} 
                onSave={(val) => updateDesigner({ bio: val })}
                isEditing={isEditing}
                multiline
                className="mt-6 text-sm text-white/60 block"
              />
              {!isEditing && (
                <div className="mt-8 flex justify-center gap-4">
                  <a 
                    href="https://about-me-barnik.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-2 text-sm font-medium hover:bg-white/10 transition-all"
                  >
                    Portfolio <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Hall of Shame Section */}
      <section id="hall-of-shame" className="py-24 bg-red-950/10">
        <div className="container mx-auto px-6">
          <SectionHeader 
            title="Hall of Shame" 
            subtitle="Reflecting on the controversies and broken promises of the past."
            icon={AlertTriangle}
          />
          <div className="grid gap-8 md:grid-cols-2">
            {(["year2024", "year2025"] as const).map((year) => (
              <motion.div
                key={year}
                whileHover={!isEditing ? { y: -5 } : {}}
                className="rounded-3xl border border-red-500/10 bg-red-500/5 p-6 sm:p-8 backdrop-blur-sm"
              >
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="font-display text-3xl sm:text-4xl font-black text-red-500/50">{year.replace("year", "")}</h3>
                  <Trophy size={32} className="text-red-500/20" />
                </div>
                <div className="space-y-4">
                  {data.hallOfShame[year].map((item, idx) => (
                    <div key={idx} className="rounded-xl bg-black/40 p-4 border border-red-500/5">
                      <EditableText 
                        value={item.title} 
                        onSave={(val) => updateHallOfShame(year, idx, { title: val })}
                        isEditing={isEditing}
                        className="text-sm font-bold text-red-400 block"
                      />
                      <EditableText 
                        value={item.details} 
                        onSave={(val) => updateHallOfShame(year, idx, { details: val })}
                        isEditing={isEditing}
                        multiline
                        className="mt-1 text-xs text-white/40 block"
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-8 text-center text-xs font-medium uppercase tracking-widest text-red-500/40">
                  Lest We Forget
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="flex items-center gap-3">
              <img 
                src={data.logo} 
                alt="Logo" 
                className="h-8 w-8 object-contain"
                referrerPolicy="no-referrer"
              />
              <span className="font-display text-lg font-bold">ChunabKeParva v3.0</span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-mono text-orange-500">
                <Eye size={14} />
                <span>TOTAL VISITS: </span>
                <EditableText 
                  value={visitCount.toLocaleString()} 
                  onSave={updateVisitCount}
                  isEditing={isEditing}
                  className="inline-block"
                />
              </div>
              <p className="text-xs text-white/20">© 2026 ChunabKeParva. All rights reserved.</p>
            </div>

            <div className="flex gap-6">
              {/* Social links removed as requested */}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
