import React, { useState, useEffect } from 'react';
import { 
  Menu, X, Plus, Calendar, User as UserIcon, 
  Home, ArrowRight, Trash2, Camera,
  Hammer, Trees, Monitor, FileText, Wrench, ChevronLeft,
  MapPin, Phone, Mail, Info, PaintRoller, Droplets, Loader2, Lock
} from 'lucide-react';
import { NeoButton, NeoCard, NeoInput, NeoTextArea } from './components/NeoComponents';
import { SERVICES, MOCK_SLOTS } from './constants';
import { ServiceCategory, ServiceRequest, User, ContactDetails } from './types';
import { ApiService } from './services/api';

const IconMap: Record<string, React.ElementType> = {
  Hammer, Trees, Monitor, FileText, Wrench, PaintRoller, Droplets
};

type ViewState = 
  | 'SPLASH' 
  | 'HOME' 
  | 'SERVICE_INFO'
  | 'LOGIN' 
  | 'FORGOT_PASSWORD'
  | 'WIZARD_CAT' 
  | 'WIZARD_DETAILS' 
  | 'WIZARD_CONTACT' 
  | 'WIZARD_PLANNING' 
  | 'DASHBOARD';

export default function App() {
  const [view, setView] = useState<ViewState>('SPLASH');
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  
  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  // Auth Forms
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  
  // Wizard Data
  const [draftRequest, setDraftRequest] = useState<Partial<ServiceRequest>>({});
  const [previewPhotos, setPreviewPhotos] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [contactForm, setContactForm] = useState<ContactDetails>({
    name: '', phone: '', zip: '', address: '', email: ''
  });

  useEffect(() => {
    const storedUser = ApiService.getUser();
    if (storedUser) {
      setUser(storedUser);
      setContactForm(prev => ({...prev, name: storedUser.name, email: storedUser.email, phone: storedUser.phone}));
      refreshRequests();
    }
    const timer = setTimeout(() => setView('HOME'), 2500); 
    return () => clearTimeout(timer);
  }, []);

  const refreshRequests = async () => {
    const reqs = await ApiService.getRequests();
    setRequests(reqs);
  };

  const handleLogout = () => {
    ApiService.logout();
    setUser(null);
    setRequests([]);
    setView('HOME');
    setIsMenuOpen(false);
  };

  const startRequest = () => {
    setDraftRequest({});
    setPreviewPhotos([]);
    setSelectedFiles([]);
    setSelectedDate('');
    setSelectedTime('');
    if (!user) setContactForm({name: '', phone: '', zip: '', address: '', email: ''});
    setView('WIZARD_CAT');
  };

  const handleDelete = async (id: string) => {
    if(window.confirm("Supprimer cette demande ?")) {
      try {
        await ApiService.deleteRequest(id);
        refreshRequests();
      } catch (e: any) { alert(e.message); }
    }
  };

  // --- RENDERERS ---

  const renderSplash = () => (
    <div className="fixed inset-0 bg-neo-yellow flex flex-col items-center justify-center z-50 overflow-hidden">
      <div className="bg-white border-4 border-black p-8 shadow-neo-lg animate-[bounceIn_0.8s_ease-out_forwards] relative flex flex-col items-center">
        <h1 className="text-5xl font-black uppercase tracking-tighter text-black mb-1 animate-[slideUp_0.6s_ease-out_forwards]">Pastore</h1>
        <div className="bg-black text-white px-3 py-1 -rotate-3 animate-[fadeIn_0.5s_ease-out_0.5s_both]">
          <span className="font-bold text-xl tracking-widest">SERVICES</span>
        </div>
      </div>
      <div className="mt-12 flex gap-2 animate-[pulse_1.5s_infinite]">
        <div className="w-3 h-3 bg-black rounded-full"></div>
        <div className="w-3 h-3 bg-black rounded-full"></div>
        <div className="w-3 h-3 bg-black rounded-full"></div>
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="space-y-8">
      <section className="bg-neo-blue border-2 border-black shadow-neo p-6 rounded-sm relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white rounded-full border-2 border-black opacity-50 transition-transform group-hover:scale-125"></div>
        <h2 className="text-3xl font-black mb-2 relative z-10">Besoin d'un coup de main ?</h2>
        <p className="font-medium mb-6 relative z-10">Bricolage, Jardin, Info... On s'occupe de tout.</p>
        <NeoButton onClick={startRequest} size="lg" className="w-full relative z-10">
          Réserver un service <ArrowRight size={20} />
        </NeoButton>
      </section>

      <section>
        <h3 className="text-xl font-black uppercase mb-4 border-b-4 border-neo-yellow inline-block">Nos Services</h3>
        <div className="grid gap-4">
          {SERVICES.map((service) => {
            const Icon = IconMap[service.icon];
            return (
              <NeoCard key={service.id} className="flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer active:translate-y-1" 
                onClick={() => { setSelectedServiceId(service.id); setView('SERVICE_INFO'); }}
              >
                <div className={`p-3 border-2 border-black ${service.color}`}><Icon size={24} strokeWidth={2.5} /></div>
                <div>
                  <h4 className="font-bold text-lg">{service.title}</h4>
                  <p className="text-sm text-gray-600 leading-tight">En savoir plus...</p>
                </div>
              </NeoCard>
            )
          })}
        </div>
      </section>
    </div>
  );

  const renderLogin = () => (
    <div className="flex flex-col min-h-[60vh] justify-center animate-[fadeIn_0.3s]">
      <NeoCard className="space-y-6 bg-white py-8">
        <div className="text-center">
          <h2 className="text-2xl font-black uppercase">{isRegistering ? 'Créer un compte' : 'Connexion'}</h2>
          <p className="text-gray-500">{isRegistering ? 'Rejoignez Pastore Services' : 'Pour gérer vos demandes'}</p>
        </div>
        
        {authError && <div className="bg-red-100 border-2 border-red-500 text-red-700 p-2 font-bold text-sm text-center">{authError}</div>}

        <form onSubmit={async (e) => {
          e.preventDefault();
          setAuthError('');
          setIsLoading(true);
          const formData = new FormData(e.currentTarget);
          
          try {
            if (isRegistering) {
              const newUser = await ApiService.register(
                formData.get('name') as string,
                formData.get('email') as string,
                formData.get('phone') as string,
                formData.get('password') as string
              );
              setUser(newUser);
            } else {
              const loggedUser = await ApiService.login(
                formData.get('email') as string,
                formData.get('password') as string
              );
              setUser(loggedUser);
            }
            refreshRequests();
            setView('HOME');
          } catch (err: any) {
            setAuthError(err.message || 'Une erreur est survenue');
          } finally {
            setIsLoading(false);
          }
        }} className="space-y-4">
          {isRegistering && <NeoInput name="name" label="Nom complet" placeholder="Jean Dupont" required />}
          <NeoInput name="email" label="Email" type="email" placeholder="jean@exemple.com" required />
          {isRegistering && <NeoInput name="phone" label="Téléphone" type="tel" placeholder="0470..." required />}
          <NeoInput name="password" label="Mot de passe" type="password" placeholder="******" required />
          
          {!isRegistering && (
             <div className="text-right">
                 <button type="button" onClick={() => {setAuthError(''); setAuthSuccess(''); setView('FORGOT_PASSWORD')}} className="text-xs text-gray-500 underline hover:text-black">Mot de passe oublié ?</button>
             </div>
          )}

          <NeoButton type="submit" size="lg" className="w-full mt-4" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : (isRegistering ? "S'inscrire" : "Accéder à l'espace")}
          </NeoButton>
        </form>
        
        <div className="text-center space-y-2 pt-2 border-t-2 border-gray-100">
          <button onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }} className="text-sm font-bold text-neo-blue hover:underline block w-full">
            {isRegistering ? "J'ai déjà un compte" : "Créer un compte"}
          </button>
          <button onClick={() => setView('HOME')} className="text-xs underline text-gray-500">Retour accueil</button>
        </div>
      </NeoCard>
    </div>
  );

  const renderForgotPassword = () => (
      <div className="flex flex-col min-h-[60vh] justify-center animate-[fadeIn_0.3s]">
        <NeoCard className="space-y-6 bg-white py-8">
            <div className="text-center">
                <Lock size={48} className="mx-auto mb-4 text-neo-black" />
                <h2 className="text-2xl font-black uppercase">Récupération</h2>
                <p className="text-gray-500 text-sm">Entrez votre email pour recevoir un mot de passe temporaire.</p>
            </div>

            {authError && <div className="bg-red-100 border border-red-500 text-red-700 p-2 text-sm text-center">{authError}</div>}
            {authSuccess && <div className="bg-green-100 border border-green-500 text-green-700 p-2 text-sm text-center">{authSuccess}</div>}

            <form onSubmit={async (e) => {
                e.preventDefault();
                setAuthError('');
                setAuthSuccess('');
                setIsLoading(true);
                const email = (new FormData(e.currentTarget)).get('email') as string;
                try {
                    const res = await ApiService.forgotPassword(email);
                    setAuthSuccess(res.message || "Si le compte existe, un email a été envoyé.");
                } catch(err:any) {
                    setAuthError(err.message);
                } finally { setIsLoading(false); }
            }}>
                <NeoInput name="email" label="Email associé" type="email" required placeholder="votre@email.com" />
                <NeoButton type="submit" size="lg" className="w-full mt-4" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : "Envoyer"}
                </NeoButton>
            </form>
            <button onClick={() => {setView('LOGIN'); setAuthSuccess('');}} className="w-full text-center text-sm font-bold underline">Retour connexion</button>
        </NeoCard>
      </div>
  );

  const renderServiceInfo = () => {
    const service = SERVICES.find(s => s.id === selectedServiceId);
    if (!service) return null;
    const Icon = IconMap[service.icon];
    return (
      <div className="space-y-6 animate-[slideInView_0.3s]">
        <button onClick={() => setView('HOME')} className="flex items-center gap-2 font-bold hover:underline mb-2"><ChevronLeft size={20} /> Retour</button>
        <div className={`border-2 border-black shadow-neo p-6 ${service.color} flex flex-col items-center text-center gap-4`}>
          <div className="bg-white p-4 border-2 border-black rounded-full shadow-neo-sm"><Icon size={48} /></div>
          <h2 className="text-3xl font-black uppercase">{service.title}</h2>
        </div>
        <NeoCard>
          <h3 className="font-bold text-lg mb-2 uppercase border-b-2 border-gray-200 pb-2">Détails du service</h3>
          <p className="text-gray-800 leading-relaxed font-medium">{service.longDescription || service.description}</p>
          <div className="mt-6 p-4 bg-gray-100 border-2 border-dashed border-gray-300">
             <h4 className="font-bold text-sm mb-2 uppercase flex items-center gap-2"><Info size={16}/> Inclus :</h4>
             <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">✅ Déplacement inclus (zone standard)</li>
                <li className="flex items-center gap-2">✅ Petit outillage fourni</li>
                <li className="flex items-center gap-2">✅ Assurance responsabilité civile</li>
             </ul>
          </div>
        </NeoCard>
        <NeoButton size="lg" className="w-full" onClick={() => {
            setDraftRequest({ category: service.id });
            if (!user) setContactForm({name: '', phone: '', zip: '', address: '', email: ''});
            setView('WIZARD_DETAILS');
        }}>Commander ce service</NeoButton>
      </div>
    );
  };

  const renderWizardDetails = () => (
    <div className="space-y-6 animate-[slideInView_0.3s]">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setView('WIZARD_CAT')} className="p-1 border-2 border-black bg-white shadow-neo-sm"><ChevronLeft/></button>
        <h2 className="font-black text-xl uppercase">Étape 2/4: Détails</h2>
      </div>
      <NeoTextArea 
        label="Description du besoin" placeholder="Ex: Mon robinet fuit, il faut remplacer le joint..."
        value={draftRequest.description || ''}
        onChange={(e) => setDraftRequest({...draftRequest, description: e.target.value})}
      />
      <div>
        <label className="font-bold text-sm uppercase block mb-2">Photos (Optionnel)</label>
        <div className="flex gap-2 overflow-x-auto pb-4">
          <label className="flex-shrink-0 w-24 h-24 border-2 border-dashed border-black bg-gray-100 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
            <Camera size={24} /><span className="text-xs font-bold mt-1">Ajouter</span>
            <input type="file" className="hidden" accept="image/*" multiple onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              if(e.target.files) {
                const newFiles = Array.from(e.target.files) as File[];
                setSelectedFiles([...selectedFiles, ...newFiles]);
                const newUrls: string[] = [];
                newFiles.forEach((file) => newUrls.push(URL.createObjectURL(file)));
                setPreviewPhotos([...previewPhotos, ...newUrls]);
              }
            }} />
          </label>
          {previewPhotos.map((photo, idx) => (
            <div key={idx} className="relative flex-shrink-0 w-24 h-24 border-2 border-black shadow-neo-sm">
              <img src={photo} alt="Preview" className="w-full h-full object-cover" />
              <button onClick={() => {
                    setPreviewPhotos(previewPhotos.filter((_, i) => i !== idx));
                    setSelectedFiles(selectedFiles.filter((_, i) => i !== idx));
                }} className="absolute -top-2 -right-2 bg-red-500 border-2 border-black text-white p-0.5 rounded-full"><X size={12} /></button>
            </div>
          ))}
        </div>
      </div>
      <NeoButton className="w-full" disabled={!draftRequest.description} onClick={() => setView('WIZARD_CONTACT')}>Suivant <ArrowRight size={18} /></NeoButton>
    </div>
  );

  const renderWizardContact = () => (
    <div className="space-y-6 animate-[slideInView_0.3s]">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setView('WIZARD_DETAILS')} className="p-1 border-2 border-black bg-white shadow-neo-sm"><ChevronLeft/></button>
        <h2 className="font-black text-xl uppercase">Étape 3/4: Contact</h2>
      </div>
      <NeoCard>
        <div className="space-y-4">
            <NeoInput label="Nom *" placeholder="Votre nom" value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})}/>
            <NeoInput label="Téléphone *" placeholder="0470..." type="tel" value={contactForm.phone} onChange={e => setContactForm({...contactForm, phone: e.target.value})}/>
            <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1"><NeoInput label="CP" placeholder="1000" value={contactForm.zip} onChange={e => setContactForm({...contactForm, zip: e.target.value})}/></div>
                <div className="col-span-2"><NeoInput label="Adresse" placeholder="Rue de la Loi 16" value={contactForm.address} onChange={e => setContactForm({...contactForm, address: e.target.value})}/></div>
            </div>
            <NeoInput label="Email" placeholder="email@exemple.com" type="email" value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})}/>
        </div>
      </NeoCard>
      <NeoButton className="w-full" disabled={!contactForm.name || !contactForm.phone} onClick={() => setView('WIZARD_PLANNING')}>Suivant <ArrowRight size={18} /></NeoButton>
    </div>
  );

  const renderWizardPlanning = () => (
    <div className="space-y-6 animate-[slideInView_0.3s]">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setView('WIZARD_CONTACT')} className="p-1 border-2 border-black bg-white shadow-neo-sm"><ChevronLeft/></button>
        <h2 className="font-black text-xl uppercase">Étape 4/4: Planning</h2>
      </div>
      <NeoCard color="bg-white">
        <div className="flex items-center gap-2 mb-4 border-b-2 border-gray-200 pb-2"><Calendar size={20} /><h3 className="font-bold">Vos disponibilités</h3></div>
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {Array.from({length: 10}).map((_, i) => {
            const d = new Date(); d.setDate(d.getDate() + i + 1);
            const isoDate = d.toISOString().split('T')[0];
            const isSelected = selectedDate === isoDate;
            return (
              <button key={i} onClick={() => setSelectedDate(isoDate)}
                className={`flex-shrink-0 w-14 h-20 border-2 border-black flex flex-col items-center justify-center transition-all ${isSelected ? 'bg-neo-black text-white shadow-none translate-y-1' : 'bg-white shadow-neo-sm hover:translate-y-[-2px]'}`}>
                <span className="text-xs font-bold uppercase">{d.toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
                <span className="text-xl font-black">{d.getDate()}</span>
              </button>
            );
          })}
        </div>
        {selectedDate && (
          <div className="grid grid-cols-3 gap-2 animate-[fadeIn_0.3s]">
            {MOCK_SLOTS.map(slot => (
              <button key={slot} onClick={() => setSelectedTime(slot)}
                className={`py-2 px-1 text-sm font-bold border-2 border-black transition-all ${selectedTime === slot ? 'bg-neo-green shadow-none' : 'bg-white hover:bg-gray-50'}`}>
                {slot}
              </button>
            ))}
          </div>
        )}
      </NeoCard>
      <NeoButton className="w-full" variant="primary" size="lg" disabled={!selectedDate || !selectedTime || isLoading}
        onClick={async () => {
          setIsLoading(true);
          try {
              await ApiService.createRequest({
                userId: user ? user.id : 'guest',
                category: draftRequest.category as ServiceCategory,
                description: draftRequest.description!,
                booking: { date: selectedDate, time: selectedTime },
                contact: contactForm
              }, selectedFiles);
              refreshRequests();
              setView('DASHBOARD');
          } catch(e) { alert("Erreur envoi demande."); } finally { setIsLoading(false); }
        }}>
        {isLoading ? <Loader2 className="animate-spin mx-auto" /> : "Envoyer ma demande"}
      </NeoButton>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6 animate-[slideInView_0.3s]">
      <h2 className="font-black text-3xl uppercase">Mes Demandes</h2>
      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="text-center py-10 opacity-60">
            <FileText size={48} className="mx-auto mb-2" />
            <p>Aucune demande en cours</p>
            {!user && <p className="text-xs text-red-500 mt-2 cursor-pointer hover:underline" onClick={() => setView('LOGIN')}>Connectez-vous pour voir l'historique.</p>}
          </div>
        ) : (
          requests.map(req => {
            const serviceDef = SERVICES.find(s => s.id === req.category);
            const Icon = serviceDef ? IconMap[serviceDef.icon] : FileText;
            return (
              <NeoCard key={req.id} className="relative overflow-hidden group hover:shadow-neo-lg transition-shadow">
                <div className="flex justify-between items-start mb-2">
                   <div className="flex items-center gap-2">
                     <div className={`p-2 border-2 border-black ${serviceDef?.color || 'bg-gray-200'}`}><Icon size={18} /></div>
                     <div>
                       <h3 className="font-bold uppercase text-sm">{serviceDef?.title}</h3>
                       <p className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleDateString('fr-FR')}</p>
                     </div>
                   </div>
                   <span className="px-2 py-0.5 bg-yellow-200 border-2 border-black text-xs font-bold uppercase rounded-full">{req.status === 'pending' ? 'En attente' : req.status}</span>
                </div>
                <p className="text-sm border-l-4 border-gray-300 pl-2 mb-3 bg-gray-50 p-2 italic">"{req.description}"</p>
                <div className="flex flex-col gap-1 text-xs text-gray-600 mb-3 border-t border-gray-200 pt-2">
                    <div className="flex items-center gap-1"><UserIcon size={12}/> {req.contact.name} ({req.contact.phone})</div>
                    {req.contact.address && <div className="flex items-center gap-1"><MapPin size={12}/> {req.contact.address}, {req.contact.zip}</div>}
                </div>
                <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2 text-sm font-bold bg-black text-white p-2"><Calendar size={14} />{new Date(req.booking.date).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'})} à {req.booking.time}</div>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(req.id); }} className="bg-red-500 text-white p-2 border-2 border-black shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer z-10"><Trash2 size={18} /></button>
                </div>
              </NeoCard>
            )
          })
        )}
      </div>
      <NeoButton onClick={startRequest} variant="outline" className="w-full border-dashed"><Plus size={20} /> Nouvelle demande</NeoButton>
    </div>
  );

  if (view === 'SPLASH') return renderSplash();

  return (
    <div className="min-h-screen bg-[#f0f0f0] pb-24 font-sans text-neo-black relative overflow-x-hidden">
      <header className="sticky top-0 z-40 bg-white border-b-2 border-black px-4 py-3 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('HOME')}>
          <div className="w-8 h-8 bg-neo-yellow border-2 border-black flex items-center justify-center"><span className="font-black text-sm">P</span></div>
          <span className="font-bold text-lg uppercase tracking-tight">Pastore</span>
        </div>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 hover:bg-gray-100 rounded-md transition-colors">{isMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
      </header>
      {isMenuOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}>
          <div className="absolute top-[60px] right-0 w-64 bg-white border-l-2 border-b-2 border-black shadow-neo p-4 flex flex-col gap-4 animate-[slideInView_0.2s_ease-out]">
             {user ? <div className="border-b-2 border-black pb-2 mb-2"><p className="text-xs text-gray-500 font-bold uppercase">Bonjour</p><p className="font-bold truncate">{user.name}</p></div> : <NeoButton size="sm" onClick={() => { setView('LOGIN'); setIsMenuOpen(false); }}>Se connecter</NeoButton>}
             <button onClick={() => { setView('HOME'); setIsMenuOpen(false); }} className="flex items-center gap-2 font-bold hover:text-neo-blue"><Home size={20} /> Accueil</button>
             <button onClick={() => { refreshRequests(); setView('DASHBOARD'); setIsMenuOpen(false); }} className="flex items-center gap-2 font-bold hover:text-neo-blue"><FileText size={20} /> Mes Demandes</button>
             {user && <button onClick={handleLogout} className="text-red-500 font-bold mt-auto pt-4 border-t-2 border-gray-100">Déconnexion</button>}
          </div>
        </div>
      )}
      <main className="p-4 max-w-md mx-auto min-h-[80vh]">
        {view === 'HOME' && renderHome()}
        {view === 'SERVICE_INFO' && renderServiceInfo()}
        {view === 'LOGIN' && renderLogin()}
        {view === 'FORGOT_PASSWORD' && renderForgotPassword()}
        {view === 'WIZARD_CAT' && startRequest && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4"><button onClick={() => setView('HOME')} className="p-1 border-2 border-black bg-white shadow-neo-sm"><ChevronLeft/></button><h2 className="font-black text-xl uppercase">Étape 1/4: Service</h2></div>
              <p className="font-bold mb-2">De quoi avez-vous besoin ?</p>
              <div className="grid grid-cols-2 gap-4">
                {SERVICES.map((s) => { const Icon = IconMap[s.icon]; return (<button key={s.id} onClick={() => { setDraftRequest({ ...draftRequest, category: s.id }); setView('WIZARD_DETAILS'); }} className={`p-4 border-2 border-black shadow-neo flex flex-col items-center gap-2 transition-transform active:scale-95 hover:bg-opacity-80 ${s.color}`}><Icon size={32} /><span className="font-bold text-sm text-center">{s.title}</span></button>)})}
              </div>
            </div>
        )}
        {view === 'WIZARD_DETAILS' && renderWizardDetails()}
        {view === 'WIZARD_CONTACT' && renderWizardContact()}
        {view === 'WIZARD_PLANNING' && renderWizardPlanning()}
        {view === 'DASHBOARD' && renderDashboard()}
      </main>
      <footer className="bg-neo-black text-white p-6 pb-24 mt-8 border-t-4 border-neo-yellow">
        <div className="max-w-md mx-auto text-center space-y-4">
            <h4 className="font-black uppercase text-xl text-neo-yellow">Pastore Services</h4>
            <div className="flex justify-center gap-4 text-sm font-medium text-gray-300"><span>Conditions Générales</span><span>Politique de Confidentialité</span></div>
            <p className="text-xs text-gray-500 mt-4 font-mono">&reg; 2024 Pastore Services MRH. <br/> Tous droits réservés.</p>
        </div>
      </footer>
      {view === 'HOME' && (<div className="fixed bottom-6 right-6 z-40"><button onClick={startRequest} className="bg-neo-black text-white w-14 h-14 rounded-full border-2 border-white shadow-neo-lg flex items-center justify-center animate-[bounce_2s_infinite]"><Plus size={32} /></button></div>)}
    </div>
  );
}