import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useInView } from "motion/react";
import { 
  Trophy, 
  Users, 
  Target, 
  Zap, 
  ChevronRight, 
  Loader2,
  AlertCircle,
  ChevronLeft,
  Crosshair,
  Shield,
  Flame,
  Skull,
  Medal,
  Settings,
  Trash2,
  Lock,
  Unlock,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const registrationSchema = z.object({
  teamName: z.string().min(3, "Team name must be at least 3 characters"),
  player1Pseudo: z.string().min(2, "Pseudo required"),
  player1Email: z.string().email("Invalid email"),
  player1Whatsapp: z.string().min(8, "Valid WhatsApp number required"),
  player2Pseudo: z.string().min(2, "Pseudo required"),
  player2Email: z.string().email("Invalid email"),
  player2Whatsapp: z.string().min(8, "Valid WhatsApp number required"),
});

type RegistrationData = z.infer<typeof registrationSchema>;

const GAME_IMAGES = [
  "/images/COD1.jpg",
  "/images/COD2.jpg",
  "/images/COD3.jpg",
  "/images/COD4.jpg",
  "/images/COD5.jpg",
  "/images/COD6.jpg",
];

const GAME_MAPS = [
  "/images/Crossfire.jpg",
  "/images/Firing_Range.jpg",
  "/images/HIGHRISE.jpg",
  "/images/Nuketown.jpg",
  "/images/RAID.jpg",
  "/images/Shipment.jpg",
  "/images/Shoot house.jpg",
  "/images/TAKEOFF.jpg",
  "/images/Cage.jpg",
  "/images/COASTAL.jpg",
  "/images/CRASH.jpg",
  "/images/STANDOFF.jpg",
];

const SectionHeading = ({ title, subtitle, light = false }: { title: string, subtitle: string, light?: boolean }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, x: -50 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      className="mb-16"
    >
      <h2 className={cn("font-display text-6xl md:text-8xl leading-none uppercase tracking-tighter", light ? "text-white" : "text-cod-orange")}>
        {title}
      </h2>
      <p className="text-white/40 font-mono text-sm tracking-[0.3em] uppercase mt-2">
        {subtitle}
      </p>
    </motion.div>
  );
};

export default function App() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [matchWinners, setMatchWinners] = useState<Record<string, number>>({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeBracketBlock, setActiveBracketBlock] = useState<'ALPHA' | 'BRAVO' | 'FINALE'>('ALPHA');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 1.1]);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema)
  });

  const teamNameWatch = watch("teamName");
  const p1PseudoWatch = watch("player1Pseudo");
  const p2PseudoWatch = watch("player2Pseudo");

  useEffect(() => {
    fetchRegistrations();
    fetchMatches();
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % GAME_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchRegistrations = async () => {
    try {
      const res = await fetch("/api/registrations");
      const data = await res.json();
      setRegistrations(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMatches = async () => {
    try {
      const res = await fetch("/api/matches");
      const data = await res.json();
      const winnersMap = data.reduce((acc: any, curr: any) => {
        acc[curr.id] = curr.winnerId;
        return acc;
      }, {});
      setMatchWinners(winnersMap);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === "admin_jei_2026") {
      setIsAdmin(true);
      setShowAdminLogin(false);
    } else {
      alert("Mot de passe incorrect");
    }
  };

  const updateTeamPaid = async (id: number, isPaid: boolean) => {
    try {
      await fetch(`/api/admin/teams/${id}/paid`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "admin-password": adminPassword
        },
        body: JSON.stringify({ isPaid }),
      });
      fetchRegistrations();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteTeam = async (id: number) => {
    if (!confirm("Supprimer cette équipe ?")) return;
    try {
      await fetch(`/api/admin/teams/${id}`, {
        method: "DELETE",
        headers: { "admin-password": adminPassword },
      });
      fetchRegistrations();
    } catch (e) {
      console.error(e);
    }
  };

  const setMatchWinner = async (matchId: string, winnerId: number) => {
    if (!isAdmin) return;
    try {
      await fetch("/api/admin/matches", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "admin-password": adminPassword
        },
        body: JSON.stringify({ matchId, winnerId }),
      });
      fetchMatches();
    } catch (e) {
      console.error(e);
    }
  };

  const clearMatches = async () => {
    if (!confirm("Réinitialiser tous les résultats du bracket ?")) return;
    try {
      await fetch("/api/admin/matches", {
        method: "DELETE",
        headers: { "admin-password": adminPassword },
      });
      fetchMatches();
    } catch (e) {
      console.error(e);
    }
  };

  const getTeamForMatch = (matchId: string, fallback?: any) => {
    const winnerId = matchWinners[matchId];
    if (winnerId) return registrations.find(r => r.id === winnerId);
    return fallback;
  };

  const BracketSlot = ({ matchId, team, side = 'left', label }: { matchId: string, team?: any, side?: 'left' | 'right', label?: string }) => {
    const winnerId = matchWinners[matchId];
    const isWinner = winnerId && team && winnerId === team.id;
    
    return (
      <div 
        onClick={() => isAdmin && team && setMatchWinner(matchId, team.id)}
        className={cn(
          "p-2 text-[10px] font-bold bg-white flex items-center gap-2 rounded-sm shadow-md transition-all relative group",
          team ? "text-black" : "text-gray-300 italic",
          isAdmin && team && "cursor-pointer hover:ring-2 hover:ring-cod-orange",
          isWinner && "ring-2 ring-green-500 bg-green-50",
          side === 'right' && "flex-row-reverse text-right"
        )}
      >
        <div className={cn("w-2 h-2 rounded-full shrink-0", side === 'left' ? "bg-red-500" : "bg-blue-500")} />
        <span className="truncate">{team ? team.teamName.toUpperCase() : (label || "EN ATTENTE")}</span>
        {isAdmin && team && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
            CLIQUER POUR DÉSIGNER VAINQUEUR
          </div>
        )}
      </div>
    );
  };

  const onSubmit = async (data: RegistrationData) => {
    setIsSubmitting(true);
    setSubmitStatus(null);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (response.ok) {
        setSubmitStatus({ type: 'success', message: result.message });
        reset();
        fetchRegistrations();
      } else {
        setSubmitStatus({ type: 'error', message: result.error });
      }
    } catch (error) {
      setSubmitStatus({ type: 'error', message: "Something went wrong. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cod-dark selection:bg-cod-orange selection:text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 px-6 py-8 flex justify-between items-center bg-linear-to-b from-black/80 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-cod-orange rounded-sm flex items-center justify-center font-display text-2xl">C</div>
          <span className="font-display text-xl tracking-tighter">THE CALL OF THE CODERS</span>
        </div>
        <div className="hidden md:flex gap-8 text-xs font-bold tracking-widest uppercase items-center">
          <a href="#details" className="hover:text-cod-orange transition-colors">Détails</a>
          <a href="#rules" className="hover:text-cod-orange transition-colors">Règlement</a>
          <a href="#gallery" className="hover:text-cod-orange transition-colors">Galerie</a>
          <a href="#register" className="hover:text-cod-orange transition-colors">S'inscrire</a>
          <a href="#teams" className="hover:text-cod-orange transition-colors">Équipes</a>
          <button 
            onClick={() => isAdmin ? setIsAdmin(false) : setShowAdminLogin(true)}
            className={cn("p-2 rounded-full transition-all", isAdmin ? "text-cod-orange bg-cod-orange/10" : "text-white/40 hover:text-white")}
          >
            {isAdmin ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* Admin Login Modal */}
      <AnimatePresence>
        {showAdminLogin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 backdrop-blur-sm p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md bg-cod-gray border border-white/10 p-10 rounded-sm space-y-8"
            >
              <div className="text-center space-y-2">
                <Settings className="w-12 h-12 text-cod-orange mx-auto mb-4" />
                <h3 className="font-display text-3xl">ACCÈS ADMIN</h3>
                <p className="text-white/40 text-xs font-mono uppercase tracking-widest">IDENTIFICATION REQUISE</p>
              </div>
              <form onSubmit={handleAdminLogin} className="space-y-6">
                <input 
                  type="password" 
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="MOT DE PASSE..."
                  className="w-full bg-white/5 border border-white/10 p-4 text-sm focus:border-cod-orange outline-none transition-all text-center tracking-[0.5em]"
                  autoFocus
                />
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowAdminLogin(false)}
                    className="flex-1 py-4 border border-white/10 text-xs font-bold tracking-widest uppercase hover:bg-white/5 transition-all"
                  >
                    ANNULER
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-cod-orange text-white text-xs font-bold tracking-widest uppercase hover:bg-white hover:text-cod-orange transition-all"
                  >
                    ENTRER
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Panel */}
      <AnimatePresence>
        {isAdmin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-150 bg-cod-dark overflow-y-auto"
          >
            {/* Admin Header */}
            <header className="sticky top-0 z-50 bg-cod-gray border-b border-white/10 px-8 py-6 flex items-center justify-between backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-cod-orange rounded-sm flex items-center justify-center font-display text-2xl text-white">A</div>
                <div>
                  <h2 className="font-display text-2xl uppercase tracking-tighter text-white">CENTRE DE COMMANDEMENT</h2>
                  <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">MODE ADMINISTRATEUR ACTIF</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <button 
                  onClick={clearMatches}
                  className="px-6 py-2 border border-white/10 text-white text-[10px] font-bold tracking-widest uppercase hover:bg-white hover:text-black transition-all rounded-sm"
                >
                  RÉINITIALISER BRACKET
                </button>
                <button 
                  onClick={() => setIsAdmin(false)}
                  className="px-6 py-2 bg-cod-orange text-white text-[10px] font-bold tracking-widest uppercase hover:bg-white hover:text-cod-orange transition-all rounded-sm"
                >
                  QUITTER LE PANEL
                </button>
              </div>
            </header>

            <main className="max-w-7xl mx-auto px-8 py-12 space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-cod-gray p-8 border border-white/5 rounded-sm">
                  <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">Équipes Inscrites</p>
                  <h3 className="font-display text-5xl text-white">{registrations.length} <span className="text-xl text-white/20">/ 16</span></h3>
                </div>
                <div className="bg-cod-gray p-8 border border-white/5 rounded-sm">
                  <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">Paiements Confirmés</p>
                  <h3 className="font-display text-5xl text-green-500">{registrations.filter(r => r.isPaid).length}</h3>
                </div>
                <div className="bg-cod-gray p-8 border border-white/5 rounded-sm">
                  <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">Matchs Joués</p>
                  <h3 className="font-display text-5xl text-cod-orange">{Object.keys(matchWinners).length}</h3>
                </div>
              </div>

              <div className="bg-cod-gray rounded-sm overflow-hidden border border-white/10">
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/2">
                  <h3 className="font-display text-xl uppercase tracking-widest text-white">GESTION DES UNITÉS</h3>
                  <Users className="w-5 h-5 text-white/20" />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="bg-white/5 text-white/40 uppercase tracking-widest">
                        <th className="p-6">ID</th>
                        <th className="p-6">Équipe</th>
                        <th className="p-6">Joueurs</th>
                        <th className="p-6">Contact</th>
                        <th className="p-6">Statut</th>
                        <th className="p-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {registrations.map((reg) => (
                        <tr key={reg.id} className="hover:bg-white/2 transition-colors text-white">
                          <td className="p-6 text-white/20 font-mono">{String(reg.id).padStart(3, '0')}</td>
                          <td className="p-6 font-bold text-cod-orange">{reg.teamName}</td>
                          <td className="p-6 text-[10px] text-white/60">
                            <div className="flex flex-col gap-1">
                              <span>{reg.player1Pseudo}</span>
                              <span className="text-white/20">{reg.player2Pseudo}</span>
                            </div>
                          </td>
                          <td className="p-6 text-[10px] text-white/60">{reg.player1Whatsapp}</td>
                          <td className="p-6">
                            <button 
                              onClick={() => updateTeamPaid(reg.id, !reg.isPaid)}
                              className={cn(
                                "px-4 py-1.5 rounded-sm text-[9px] font-bold tracking-widest uppercase transition-all border",
                                reg.isPaid 
                                  ? "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500 hover:text-white" 
                                  : "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white"
                              )}
                            >
                              {reg.isPaid ? "PAYÉ" : "IMPAYÉ"}
                            </button>
                          </td>
                          <td className="p-6 text-right">
                            <button 
                              onClick={() => deleteTeam(reg.id)}
                              className="p-2 text-white/20 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {!isAdmin && (
          <motion.div
            key="client-site"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.img 
              key={currentImageIndex}
              src={GAME_IMAGES[currentImageIndex]} 
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 0.4, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 2 }}
              className="w-full h-full object-cover"
              alt="Background"
              referrerPolicy="no-referrer"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-cod-dark/50 to-cod-dark" />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative z-10 text-center px-4"
        >
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="inline-block px-6 py-2 mb-8 border-2 border-cod-orange rounded-sm text-cod-orange text-sm font-mono font-bold tracking-[0.4em] uppercase bg-cod-orange/10"
          >
            JEI 2026 • IFRI BENIN
          </motion.div>
          <h1 className="font-display text-[15vw] md:text-[12vw] leading-[0.8] mb-6 tracking-tighter uppercase glitch">
            BATTLE <br />
            <span className="text-cod-orange">READY</span>
          </h1>
          <p className="text-lg md:text-2xl text-white/60 font-mono max-w-3xl mx-auto mb-12 tracking-wide">
            "16 ÉQUIPES. 32 JOUEURS. UN SEUL CHAMPION."
          </p>
          
          <div className="flex flex-wrap justify-center gap-6">
            <motion.a 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="#register" 
              className="px-12 py-5 bg-cod-orange text-white font-bold rounded-sm hover:bg-white hover:text-cod-orange transition-all flex items-center gap-3 group relative overflow-hidden"
            >
              <span className="relative z-10">REJOINDRE LE COMBAT</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
              <motion.div 
                className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300"
              />
            </motion.a>
          </div>
        </motion.div>

        {/* Floating Elements */}
        <div className="absolute bottom-20 left-10 hidden lg:block text-left opacity-30 font-mono text-[10px] space-y-2">
          <p>SYSTEM_STATUS: ONLINE</p>
          <p>TOURNAMENT_ID: JEI_IFRI_2026</p>
          <p>LOCATION: COTONOU, BENIN</p>
        </div>
      </section>

      {/* Marquee */}
      <div className="bg-cod-orange py-4 overflow-hidden whitespace-nowrap border-y-4 border-black">
        <motion.div 
          animate={{ x: [0, -1000] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="flex gap-20 items-center"
        >
          {[...Array(10)].map((_, i) => (
            <span key={i} className="text-black font-display text-4xl tracking-tighter">
              THE CALL OF THE CODERS • THE CALL OF THE CODERS • THE CALL OF THE CODERS
            </span>
          ))}
        </motion.div>
      </div>

      {/* Features Grid */}
      <section id="details" className="py-32 bg-cod-gray relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-5 pointer-events-none">
          <img src="https://picsum.photos/seed/tech/800/800" className="w-full h-full object-cover grayscale" alt="" />
        </div>
        
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading title="MISSION" subtitle="Objectifs du tournoi" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <Users />, title: "2V2 DUO", desc: "Formez votre binôme tactique et dominez l'arène." },
              { icon: <Crosshair />, title: "PRÉCISION", desc: "Chaque balle compte. Le skill est votre seule arme." },
              { icon: <Shield />, title: "PAIEMENT", desc: "Payez vos 2000 FCFA via le groupe WhatsApp pour valider." },
              { icon: <Flame />, title: "INTENSITÉ", desc: "Des matchs rapides, brutaux et mémorables." }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-10 bg-white/5 border border-white/5 hover:border-cod-orange/50 transition-all group card-3d"
              >
                <div className="w-12 h-12 text-cod-orange mb-6 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="font-display text-3xl mb-4 tracking-tighter">{item.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Image Gallery / Carousel */}
      <section id="gallery" className="py-32 bg-cod-dark">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading title="GALERIE" subtitle="Aperçu du champ de bataille" light />
          
          <div className="relative aspect-video w-full overflow-hidden rounded-sm group">
            <AnimatePresence mode="wait">
              <motion.img 
                key={currentImageIndex}
                src={GAME_MAPS[currentImageIndex]}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="w-full h-full object-cover"
                alt="Gallery"
              />
            </AnimatePresence>
            
            <div className="absolute inset-0 flex items-center justify-between px-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => setCurrentImageIndex((prev) => (prev - 1 + GAME_MAPS.length) % GAME_MAPS.length)}
                className="w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-cod-orange transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={() => setCurrentImageIndex((prev) => (prev + 1) % GAME_MAPS.length)}
                className="w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-cod-orange transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {GAME_MAPS.map((_, i) => (
                <div 
                  key={i} 
                  className={cn("w-12 h-1 bg-white/20 transition-all", i === currentImageIndex && "bg-cod-orange w-20")}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Rules Section */}
      <section id="rules" className="py-32 bg-cod-dark relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-cod-orange/5 -skew-x-12 translate-x-1/2 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <SectionHeading title="RÈGLEMENT" subtitle="Protocole officiel du tournoi" light />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Users className="w-6 h-6" />,
                title: "1. ORGANISATION",
                content: "Le tournoi est organisé par la JEI. Phase 1 en ligne (Qualifs + Quarts), Phase 2 en présentiel (Demi + Finale) lors de la JEI 2026."
              },
              {
                icon: <Target className="w-6 h-6" />,
                title: "2. FORMAT DUOS",
                content: "16 équipes de 2 joueurs. Phase de poules (8ièmes) : 4 poules de 4, format Round Robin (BO3). Top 2 qualifiés par poule."
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: "3. PHASE ÉLIMINATOIRE",
                content: "Quarts en ligne (BO3). Phase finale à la JEI en LAN : Demi-finales (BO5) et Finale (BO5)."
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "4. MODES & PARAMÈTRES",
                content: "Recherche & Destruction, Hardpoint, Deathmatch. Cartes et restrictions d'armes communiquées avant le début."
              },
              {
                icon: <AlertCircle className="w-6 h-6" />,
                title: "5. ANTI-TRICHE",
                content: "Triche = disqualification immédiate. Logiciels tiers interdits. Obligation d'enregistrer les matchs en ligne pour preuve."
              },
              {
                icon: <Flame className="w-6 h-6" />,
                title: "6. COMPORTEMENT",
                content: "Respect obligatoire. Comportement toxique sanctionné. Retard max 15min (forfait). 2 forfaits = élimination."
              }
            ].map((rule, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-8 bg-white/5 border border-white/10 rounded-sm hover:border-cod-orange/50 transition-all group"
              >
                <div className="w-12 h-12 bg-cod-orange/20 rounded-full flex items-center justify-center text-cod-orange mb-6 group-hover:scale-110 transition-transform">
                  {rule.icon}
                </div>
                <h4 className="font-display text-xl mb-4 text-white uppercase tracking-tighter">{rule.title}</h4>
                <p className="text-white/40 text-xs font-mono leading-relaxed uppercase tracking-wider">
                  {rule.content}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 p-8 bg-cod-orange/10 border-l-4 border-cod-orange rounded-sm">
            <h5 className="font-display text-xl text-white mb-4 uppercase">CLASSEMENT EN POULES</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] font-mono text-white/60 uppercase tracking-widest">
              <div className="flex items-center gap-2"><div className="w-1 h-1 bg-cod-orange" /> Matchs gagnés</div>
              <div className="flex items-center gap-2"><div className="w-1 h-1 bg-cod-orange" /> Diff. manches</div>
              <div className="flex items-center gap-2"><div className="w-1 h-1 bg-cod-orange" /> Confrontation directe</div>
              <div className="flex items-center gap-2"><div className="w-1 h-1 bg-cod-orange" /> Match de départage</div>
            </div>
          </div>
        </div>
      </section>

      {/* Registration & AI Section */}
      <section id="register" className="py-32 bg-cod-gray relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
            {/* Form */}
            <div className="lg:col-span-7 space-y-12">
              <SectionHeading title="REJOINDRE" subtitle="Formulaire d'enrôlement" />
              
              <div className="flex items-center gap-2 text-cod-orange font-mono text-sm mb-6">
                <span className="w-2 h-2 rounded-full bg-cod-orange animate-pulse" />
                {16 - registrations.length} PLACES RESTANTES SUR 16
              </div>

              <div className="p-6 bg-cod-orange/10 border border-cod-orange/20 rounded-sm mb-8">
                <p className="text-cod-orange font-bold text-sm mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> FRAIS D'INSCRIPTION : 2000 FCFA / ÉQUIPE
                </p>
                <p className="text-white/60 text-xs leading-relaxed">
                  L'inscription initiale est gratuite. Une fois votre formulaire soumis, vous serez ajouté à un groupe WhatsApp où vous recevrez les instructions pour le paiement des 2000 FCFA afin de valider définitivement votre participation.
                </p>
              </div>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-[0.3em] text-white/30">Nom de l'escouade</label>
                  <input 
                    {...register("teamName")}
                    className={cn(
                      "w-full bg-white/5 border-b-2 border-white/10 p-6 text-2xl font-display focus:outline-none focus:border-cod-orange transition-all placeholder:text-white/10",
                      errors.teamName && "border-red-500"
                    )}
                    placeholder="ENTREZ LE NOM..."
                  />
                  {errors.teamName && <p className="text-red-500 text-xs font-mono">{errors.teamName.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Player 1 */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-cod-orange font-display text-xl">
                      <Skull className="w-5 h-5" /> JOUEUR ALPHA
                    </div>
                    <div className="space-y-4">
                      <input {...register("player1Pseudo")} className="w-full bg-white/5 border border-white/5 p-4 text-sm focus:border-cod-orange outline-none transition-all" placeholder="PSEUDO COD" />
                      <input {...register("player1Email")} className="w-full bg-white/5 border border-white/5 p-4 text-sm focus:border-cod-orange outline-none transition-all" placeholder="EMAIL" />
                      <input {...register("player1Whatsapp")} className="w-full bg-white/5 border border-white/5 p-4 text-sm focus:border-cod-orange outline-none transition-all" placeholder="WHATSAPP" />
                    </div>
                  </div>

                  {/* Player 2 */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-cod-orange font-display text-xl">
                      <Skull className="w-5 h-5" /> JOUEUR BRAVO
                    </div>
                    <div className="space-y-4">
                      <input {...register("player2Pseudo")} className="w-full bg-white/5 border border-white/5 p-4 text-sm focus:border-cod-orange outline-none transition-all" placeholder="PSEUDO COD" />
                      <input {...register("player2Email")} className="w-full bg-white/5 border border-white/5 p-4 text-sm focus:border-cod-orange outline-none transition-all" placeholder="EMAIL" />
                      <input {...register("player2Whatsapp")} className="w-full bg-white/5 border border-white/5 p-4 text-sm focus:border-cod-orange outline-none transition-all" placeholder="WHATSAPP" />
                    </div>
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={isSubmitting || registrations.length >= 16}
                  className="w-full py-6 bg-cod-orange text-white font-display text-2xl tracking-widest hover:bg-white hover:text-cod-orange transition-all disabled:opacity-50 flex items-center justify-center gap-4"
                >
                  {isSubmitting ? <Loader2 className="w-8 h-8 animate-spin" /> : "DÉPLOYER L'ÉQUIPE"}
                </motion.button>

                {submitStatus && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-6 border-l-4 font-mono text-sm",
                      submitStatus.type === 'success' ? "bg-green-500/10 border-green-500 text-green-500" : "bg-red-500/10 border-red-500 text-red-500"
                    )}
                  >
                    {submitStatus.message}
                  </motion.div>
                )}
              </form>
            </div>

            {/* Prizes Section */}
            <div className="lg:col-span-5">
              <div className="p-10 bg-black border-2 border-cod-orange/20 rounded-sm space-y-8 relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Trophy className="w-20 h-20" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-display text-4xl">RÉCOMPENSES</h3>
                  <p className="text-white/40 text-xs font-mono tracking-widest uppercase">LE BUTIN DES VAINQUEURS</p>
                </div>

                <div className="space-y-6">
                  {/* 1st Place */}
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="p-6 bg-cod-orange/10 border border-cod-orange rounded-sm flex items-center gap-6 group"
                  >
                    <div className="w-16 h-16 bg-cod-orange rounded-full flex items-center justify-center text-black">
                      <Trophy className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-cod-orange font-mono text-[10px] tracking-widest uppercase">1ÈRE PLACE</p>
                      <h4 className="font-display text-3xl tracking-tighter">20.000 FCFA</h4>
                      <p className="text-white/40 text-[10px] uppercase tracking-widest">+ MANCHONS + TROPHÉE JEI</p>
                    </div>
                  </motion.div>

                  {/* 2nd Place */}
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="p-6 bg-white/5 border border-white/10 rounded-sm flex items-center gap-6 group"
                  >
                    <div className="w-16 h-16 bg-slate-400/20 rounded-full flex items-center justify-center text-slate-400">
                      <Medal className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-slate-400 font-mono text-[10px] tracking-widest uppercase">2ÈME PLACE</p>
                      <h4 className="font-display text-3xl tracking-tighter">10.000 FCFA</h4>
                      <p className="text-white/40 text-[10px] uppercase tracking-widest">+ MANCHONS + MÉDAILLE</p>
                    </div>
                  </motion.div>

                  {/* 3rd Place */}
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="p-6 bg-white/5 border border-white/10 rounded-sm flex items-center gap-6 group"
                  >
                    <div className="w-16 h-16 bg-amber-700/20 rounded-full flex items-center justify-center text-amber-700">
                      <Medal className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-amber-700 font-mono text-[10px] tracking-widest uppercase">3ÈME PLACE</p>
                      <h4 className="font-display text-3xl tracking-tighter">5.000 FCFA</h4>
                      <p className="text-white/40 text-[10px] uppercase tracking-widest">+ MANCHONS + MÉDAILLE</p>
                    </div>
                  </motion.div>
                </div>

                <div className="pt-6 border-t border-white/5">
                  <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em] leading-relaxed">
                    * Les prix seront remis lors de la cérémonie de clôture des JEI 2026.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Full Width Tournament Data */}
          <div className="mt-32 space-y-32">
            {/* Registered Teams */}
            <div id="teams" className="space-y-12">
              <SectionHeading title="DÉPLOIEMENT" subtitle="Liste des escouades enrôlées" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {registrations.length === 0 ? (
                  <div className="col-span-full p-12 border border-white/5 text-center text-white/20 font-mono text-sm uppercase tracking-[0.4em] bg-white/2">
                    EN ATTENTE DE DÉPLOIEMENT DES UNITÉS...
                  </div>
                ) : (
                  registrations.map((reg, i) => (
                    <motion.div 
                      key={reg.id}
                      initial={{ y: 20, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      transition={{ delay: (i % 4) * 0.1 }}
                      className="p-6 bg-white/5 border-r-4 border-cod-orange flex items-center justify-between group hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-center gap-6">
                        <span className="font-display text-4xl text-white/10 group-hover:text-cod-orange/20 transition-colors">{String(i + 1).padStart(2, '0')}</span>
                        <div>
                          <p className="font-display text-2xl tracking-tighter uppercase">{reg.teamName}</p>
                          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{reg.player1Pseudo} // {reg.player2Pseudo}</p>
                        </div>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-cod-orange animate-pulse" />
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Tournament Poules */}
            <div className="space-y-12 pt-12 border-t border-white/5">
              <SectionHeading title="POULES" subtitle="Répartition tactique des groupes" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {['A', 'B', 'C', 'D'].map((pouleName, idx) => {
                  const pouleTeams = registrations.slice(idx * 4, (idx + 1) * 4);
                  return (
                    <div key={pouleName} className="p-8 bg-black border border-white/5 rounded-sm space-y-6 hover:border-cod-orange/30 transition-colors">
                      <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <h4 className="font-display text-3xl text-cod-orange tracking-tighter">POULE {pouleName}</h4>
                        <span className="text-xs font-mono text-white/30">{pouleTeams.length}/4 UNITÉS</span>
                      </div>
                      <div className="space-y-3">
                        {[...Array(4)].map((_, i) => {
                          const team = pouleTeams[i];
                          return (
                            <div 
                              key={i} 
                              className={cn(
                                "p-3 text-xs font-mono flex items-center justify-between rounded-sm transition-all",
                                team ? "bg-white/5 text-white border-l-2 border-cod-orange" : "bg-white/2 text-white/10 border-l-2 border-transparent"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <span className="opacity-30">{String(i + 1).padStart(2, '0')}</span>
                                <span className={cn(team ? "font-bold" : "italic")}>
                                  {team ? team.teamName.toUpperCase() : "EN ATTENTE..."}
                                </span>
                              </div>
                              {team && <Zap className="w-3 h-3 text-cod-orange animate-pulse" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tournament Bracket */}
            <div className="space-y-12 pt-12 border-t border-white/5">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <SectionHeading title="BRACKET" subtitle="Phase éliminatoire globale" />
                <div className="flex bg-white/5 p-1 rounded-sm border border-white/10 mb-16">
                  {[
                    { id: 'ALPHA', label: 'BLOC ALPHA (A vs B)' },
                    { id: 'BRAVO', label: 'BLOC BRAVO (C vs D)' },
                    { id: 'FINALE', label: 'GRANDE FINALE' }
                  ].map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setActiveBracketBlock(b.id as any)}
                      className={cn(
                        "px-6 py-3 text-[10px] font-bold transition-all rounded-sm tracking-widest uppercase",
                        activeBracketBlock === b.id ? "bg-cod-orange text-white shadow-lg shadow-cod-orange/20" : "text-white/40 hover:text-white"
                      )}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative bg-[#0a1128] border-4 border-[#1a2b4b] p-12 overflow-x-auto rounded-sm min-h-225 shadow-2xl">
                {/* Header Decoration */}
                <div className="absolute top-0 left-0 w-full h-20 bg-linear-to-b from-[#1a2b4b] to-transparent opacity-50 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col items-center gap-12 min-w-350">
                  <div className="text-center space-y-2">
                    <h4 className="font-display text-5xl text-white tracking-widest uppercase">
                      {activeBracketBlock === 'FINALE' ? 'LE CHOC DES TITANS' : 'TOURNOI ENTRE CROCHETS'}
                    </h4>
                    <p className="text-white/40 font-mono text-[10px] tracking-[0.5em] uppercase">
                      JEI IFRI 2026 • {activeBracketBlock === 'FINALE' ? 'ULTIME BATAILLE' : `BLOC ${activeBracketBlock}`}
                    </p>
                  </div>

                  {activeBracketBlock === 'FINALE' ? (
                    /* GRAND FINALE VIEW */
                    <div className="flex flex-col items-center justify-center gap-20 py-20">
                      <div className="flex flex-col items-center gap-12">
                        {/* Grand Final */}
                        <div className="relative">
                          <div className="text-center space-y-6 mb-12">
                            <h5 className="font-display text-8xl text-white tracking-tighter">GRANDE FINALE</h5>
                            <div className="flex justify-center gap-4">
                              <div className="w-24 h-1 bg-cod-orange" />
                              <div className="w-24 h-1 bg-cod-orange" />
                            </div>
                          </div>
                          
                          <div className="flex gap-12 items-center">
                            {(() => {
                              const matchId = "GRAND-FINAL";
                              const t1 = getTeamForMatch("ALPHA-FINAL");
                              const t2 = getTeamForMatch("BRAVO-FINAL");
                              return (
                                <>
                                  <div className="w-80">
                                    <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-4 text-center">CHAMPION BLOC ALPHA</div>
                                    <BracketSlot matchId={matchId} team={t1} label="VAINQUEUR ALPHA" />
                                  </div>
                                  <div className="font-display text-6xl text-white animate-pulse">VS</div>
                                  <div className="w-80">
                                    <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-4 text-center">CHAMPION BLOC BRAVO</div>
                                    <BracketSlot matchId={matchId} team={t2} side="right" label="VAINQUEUR BRAVO" />
                                  </div>
                                </>
                              );
                            })()}
                          </div>

                          <div className="flex justify-center mt-32">
                            {(() => {
                              const winner = getTeamForMatch("GRAND-FINAL");
                              return (
                                <div className="relative">
                                  <div className={cn(
                                    "w-64 h-80 rounded-sm flex flex-col items-center justify-center shadow-[0_0_100px_rgba(242,125,38,0.2)] border-4 transition-all",
                                    winner ? "bg-cod-orange border-white/40" : "bg-white/5 border-white/10"
                                  )}>
                                    <Trophy className={cn("w-32 h-32 mb-6", winner ? "text-white" : "text-white/10")} />
                                    <div className="w-24 h-2 bg-black/20 rounded-full mb-6" />
                                    <span className={cn("font-display text-4xl text-center px-4 uppercase leading-none", winner ? "text-white" : "text-white/10")}>
                                      {winner ? winner.teamName : "ULTIME"}
                                    </span>
                                    <span className={cn("font-display text-2xl mt-2", winner ? "text-white/60" : "text-white/10")}>CHAMPION</span>
                                  </div>
                                  {winner && (
                                    <motion.div 
                                      animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
                                      transition={{ duration: 2, repeat: Infinity }}
                                      className="absolute inset-0 bg-cod-orange blur-[120px] -z-10"
                                    />
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* POULE BLOCKS VIEW (A vs C or B vs D) */
                    <div className="flex w-full items-center justify-between gap-4 py-20">
                      {/* LEFT SIDE - POULE A or B */}
                      <div className="flex flex-1 flex-col items-center gap-8">
                        <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest text-center mb-4">QUART DE FINALE 1</p>
                        <div className="relative">
                          <div className="space-y-1 w-64">
                            {(() => {
                              const pouleIdx = activeBracketBlock === 'ALPHA' ? 0 : 2; // Poule A or C
                              const opponentPouleIdx = activeBracketBlock === 'ALPHA' ? 1 : 3; // Poule B or D
                              const teams = registrations.slice(pouleIdx * 4, (pouleIdx + 1) * 4);
                              const opponentTeams = registrations.slice(opponentPouleIdx * 4, (opponentPouleIdx + 1) * 4);
                              
                              const t1 = teams[0]; // 1er A/C
                              const t2 = opponentTeams[1]; // 2ème B/D
                              const matchId = `${activeBracketBlock}-L-QF`;
                              
                              return (
                                <>
                                  <BracketSlot matchId={matchId} team={t1} label={`1ER POULE ${activeBracketBlock === 'ALPHA' ? 'A' : 'C'}`} />
                                  <BracketSlot matchId={matchId} team={t2} label={`2ÈME POULE ${activeBracketBlock === 'ALPHA' ? 'B' : 'D'}`} />
                                </>
                              );
                            })()}
                          </div>
                          <div className="absolute top-1/2 -right-12 w-12 h-px bg-white/20" />
                        </div>
                      </div>

                      {/* CENTER - POULE FINAL CLASH */}
                      <div className="flex flex-col items-center gap-12 px-8">
                        <div className="text-center space-y-4">
                          <h5 className="font-display text-4xl text-white">DEMI-FINALE</h5>
                          <h5 className="font-display text-2xl text-cod-orange tracking-widest uppercase">
                            {activeBracketBlock === 'ALPHA' ? 'BLOC ALPHA' : 'BLOC BRAVO'}
                          </h5>
                        </div>

                        <div className="relative">
                          <div className="flex gap-4 items-center">
                            {(() => {
                              const matchId = `${activeBracketBlock}-FINAL`;
                              const t1 = getTeamForMatch(`${activeBracketBlock}-L-QF`);
                              const t2 = getTeamForMatch(`${activeBracketBlock}-R-QF`);
                              return (
                                <>
                                  <div className="w-64">
                                    <BracketSlot matchId={matchId} team={t1} label="VAINQUEUR QF1" />
                                  </div>
                                  <div className="text-white font-display text-2xl">VS</div>
                                  <div className="w-64">
                                    <BracketSlot matchId={matchId} team={t2} side="right" label="VAINQUEUR QF2" />
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        <div className="relative mt-8">
                          {(() => {
                            const winner = getTeamForMatch(`${activeBracketBlock}-FINAL`);
                            return (
                              <div className={cn(
                                "w-48 h-64 rounded-sm flex flex-col items-center justify-center border-2 transition-all",
                                winner ? "bg-cod-orange border-white/20 shadow-[0_0_30px_rgba(242,125,38,0.3)]" : "bg-white/5 border-white/10"
                              )}>
                                {winner ? (
                                  <>
                                    <Trophy className="w-16 h-16 text-white mb-4" />
                                    <span className="font-display text-xl text-white uppercase text-center px-4">{winner.teamName}</span>
                                    <span className="font-display text-xs text-white/60 uppercase mt-2">QUALIFIÉ FINALE</span>
                                  </>
                                ) : (
                                  <>
                                    <Medal className="w-16 h-16 text-white/20 mb-4" />
                                    <span className="font-display text-sm text-white/20 uppercase">PLACE EN</span>
                                    <span className="font-display text-sm text-white/20 uppercase">FINALE</span>
                                  </>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* RIGHT SIDE - POULE C or D */}
                      <div className="flex flex-1 flex-col items-center gap-8">
                        <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest text-center mb-4">QUART DE FINALE 2</p>
                        <div className="relative">
                          <div className="absolute top-1/2 -left-12 w-12 h-px bg-white/20" />
                          <div className="space-y-1 w-64">
                            {(() => {
                              const pouleIdx = activeBracketBlock === 'ALPHA' ? 1 : 3; // Poule B or D
                              const opponentPouleIdx = activeBracketBlock === 'ALPHA' ? 0 : 2; // Poule A or C
                              const teams = registrations.slice(pouleIdx * 4, (pouleIdx + 1) * 4);
                              const opponentTeams = registrations.slice(opponentPouleIdx * 4, (opponentPouleIdx + 1) * 4);
                              
                              const t1 = teams[0]; // 1er B/D
                              const t2 = opponentTeams[1]; // 2ème A/C
                              const matchId = `${activeBracketBlock}-R-QF`;
                              
                              return (
                                <>
                                  <BracketSlot matchId={matchId} team={t1} side="right" label={`1ER POULE ${activeBracketBlock === 'ALPHA' ? 'B' : 'D'}`} />
                                  <BracketSlot matchId={matchId} team={t2} side="right" label={`2ÈME POULE ${activeBracketBlock === 'ALPHA' ? 'A' : 'C'}`} />
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Decoration */}
                <div className="absolute bottom-0 left-0 w-full h-20 bg-linear-to-t from-[#1a2b4b] to-transparent opacity-50 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      {!isAdmin && (
        <footer className="py-20 bg-black border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <div className="w-8 h-8 bg-cod-orange rounded-sm flex items-center justify-center font-display text-xl">C</div>
              <span className="font-display text-lg tracking-tighter">THE CALL OF THE CODERS</span>
            </div>
            <p className="text-white/20 text-[10px] font-mono tracking-[0.2em] uppercase">
              © 2026 JEI IFRI BENIN • TOUS DROITS RÉSERVÉS
            </p>
          </div>
          
          <div className="flex gap-12">
            <div className="text-center md:text-right">
              <p className="text-white/30 text-[10px] font-mono uppercase tracking-widest mb-2">Contact</p>
              <p className="font-bold text-sm">kpogeovic20@gmail.com</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-white/30 text-[10px] font-mono uppercase tracking-widest mb-2">Lieu</p>
              <p className="font-bold text-sm">IFRI, UAC, BENIN</p>
            </div>
          </div>
        </div>
      </footer>
      )}
    </div>
  );
}
