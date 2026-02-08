
import React, { useState, useRef, useEffect } from 'react';
import { Message, AppStatus, UserProfile, SUPPORTED_LANGUAGES, ELECTRICAL_TEMPLATES, Theme, AppLang, Attachment, UI_TRANSLATIONS, PrimaryColor, COLOR_THEMES } from './types';
import Logo from './components/Logo';
import { getGeminiChatResponse, generateSpeech } from './services/geminiService';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [theme, setTheme] = useState<Theme>('dark');
  const [primaryColor, setPrimaryColor] = useState<PrimaryColor>('blue');
  const [appLang, setAppLang] = useState<AppLang>('English');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  
  const [tempProfile, setTempProfile] = useState<Partial<UserProfile>>({
    name: '', city: '', email: '', idNumber: 'GCT-' + Math.floor(1000 + Math.random() * 9000)
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = UI_TRANSLATIONS[appLang];
  const activeColor = COLOR_THEMES[primaryColor];

  const scrollToBottom = () => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  useEffect(scrollToBottom, [messages, status]);

  const handleSendMessage = async (text: string = inputValue) => {
    if (!text.trim() && pendingAttachments.length === 0) return;
    if (status === AppStatus.THINKING) return;
    
    const currentAttachments = [...pendingAttachments];
    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: text, 
      timestamp: Date.now(),
      attachments: currentAttachments
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setPendingAttachments([]);
    setStatus(AppStatus.THINKING);

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const result = await getGeminiChatResponse(text || "Diagnostic analysis.", history, currentAttachments);
      
      const botMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: result.content, 
        timestamp: Date.now(),
        isImage: result.isImage,
        attachments: result.imageData ? [{ data: result.imageData, mimeType: 'image/png' }] : undefined
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setStatus(AppStatus.IDLE);
    }
  };

  return (
    <div 
      className={`flex flex-col h-screen max-w-md mx-auto relative overflow-hidden transition-all duration-700 ${theme === 'dark' ? 'bg-[#020204]' : 'bg-[#fafafa]'}`}
      style={{ '--theme-color': activeColor.hex, '--theme-glow': activeColor.shadow } as any}
    >
      
      {/* Background Energy HUD */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className={`absolute -top-40 -left-40 w-96 h-96 opacity-[0.04] blur-[100px] rounded-full animate-pulse`} style={{ backgroundColor: activeColor.hex }}></div>
        <div className={`absolute -bottom-40 -right-40 w-96 h-96 opacity-[0.04] blur-[100px] rounded-full animate-pulse`} style={{ backgroundColor: activeColor.hex }}></div>
      </div>

      {/* Professional Nav */}
      <header className={`relative z-20 px-6 py-4 flex items-center justify-between border-b transition-all duration-500 ${theme === 'dark' ? 'border-white/5 bg-black/60' : 'border-gray-200 bg-white/80'} backdrop-blur-2xl`}>
        <Logo color={primaryColor} />
        <div className="flex items-center gap-4">
           <button onClick={() => setShowSettings(true)} className="p-2 transition-all hover:scale-110 active:scale-95" style={{ color: activeColor.hex }}>
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" strokeWidth={1.5}/></svg>
           </button>
           <button onClick={() => setShowProfileModal(true)} className={`p-0.5 rounded-xl border transition-all hover:bg-white/5 shadow-inner`} style={{ borderColor: `${activeColor.hex}22` }}>
            {profile?.profilePic ? <img src={profile.profilePic} className="w-9 h-9 rounded-lg object-cover" /> : <svg className="w-6 h-6" style={{ color: activeColor.hex }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
           </button>
        </div>
      </header>

      {/* Main Terminal Experience */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto z-10 px-6 py-8 space-y-10 scroll-smooth pb-24">
        {messages.length === 0 && (
          <div className="py-10 space-y-12 animate-in fade-in duration-1000">
            <div className="text-center space-y-3">
              <h2 className="font-futuristic text-xl font-bold tracking-[0.5em] uppercase opacity-90 drop-shadow-2xl" style={{ color: activeColor.hex }}>{t.status}</h2>
              <p className="text-[10px] uppercase tracking-[0.7em] font-bold opacity-20">{t.subStatus}</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {ELECTRICAL_TEMPLATES.map((tmpl, idx) => (
                <button key={idx} onClick={() => handleSendMessage(tmpl)} className={`text-left p-5 rounded-[2rem] border transition-all hover:bg-white/5 active:scale-[0.97] group ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-xl'}`}>
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all bg-black/40 shadow-inner" style={{ color: activeColor.hex }}>⚡</div>
                    <span className="font-bold text-[14px] opacity-60 group-hover:opacity-100 tracking-wide">{tmpl}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
            <div className={`max-w-[88%] p-6 rounded-[2rem] shadow-2xl relative transition-all ${msg.role === 'user' ? (theme === 'dark' ? 'bg-white/5 border border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]' : 'bg-blue-50/50 border-blue-100 border text-blue-900') : (theme === 'dark' ? 'bg-black/30 border border-white/5 backdrop-blur-md' : 'bg-white border-gray-100')}`}>
              {msg.attachments?.map((att, i) => (
                <img key={i} src={att.data} className={`w-full rounded-2xl mb-4 border border-white/5 shadow-2xl ${msg.isImage ? 'h-auto max-h-[300px]' : 'h-32 object-cover'}`} />
              ))}
              <div className={`bot-message text-[15px] leading-relaxed tracking-wide ${msg.role === 'assistant' ? '' : 'font-medium'}`} 
                   dangerouslySetInnerHTML={{ __html: msg.content }}>
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* Professional HUD Input Module */}
      <div className={`relative z-30 px-6 pt-2 pb-14 transition-all`}>
        <div className={`flex items-center gap-4 p-2 pl-5 rounded-[2.2rem] transition-all duration-700 input-container ${theme === 'dark' ? 'bg-[#08080a]' : 'bg-white shadow-2xl'}`}>
          <button onClick={() => fileInputRef.current?.click()} className="p-2.5 transition-all opacity-30 hover:opacity-100 hover:rotate-12" style={{ color: activeColor.hex }}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" strokeWidth={1.5}/></svg>
            <input type="file" ref={fileInputRef} onChange={(e) => {
               const f = e.target.files?.[0];
               if(f) { const r = new FileReader(); r.onloadend = () => setPendingAttachments(p => [...p, { data: r.result as string, mimeType: f.type }]); r.readAsDataURL(f); }
            }} hidden />
          </button>

          <input 
            value={inputValue} 
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            placeholder={t.inputHint}
            className={`flex-1 py-3 bg-transparent text-[15px] outline-none placeholder:opacity-10 font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
          />

          <button 
            onClick={() => handleSendMessage()}
            className={`w-12 h-12 flex items-center justify-center rounded-[1.8rem] transition-all duration-500 group shadow-2xl active:scale-90`}
            style={{ backgroundColor: activeColor.hex, boxShadow: `0 0 25px ${activeColor.shadow}` }}
            disabled={status === AppStatus.THINKING}
          >
            {status === AppStatus.THINKING ? (
               <div className="orbital-loader"></div>
            ) : (
               <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth={3}/></svg>
            )}
          </button>
        </div>
      </div>

      {/* Ultra-Slim HUD Footer */}
      <footer className={`absolute bottom-0 left-0 w-full z-40 px-8 py-2 flex items-center justify-between border-t transition-all ${theme === 'dark' ? 'bg-black/95 border-white/5' : 'bg-white border-gray-100 shadow-2xl'}`}>
         <div className="flex items-center gap-3 opacity-30 hover:opacity-100 transition-opacity">
            <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: activeColor.hex, boxShadow: `0 0 10px ${activeColor.hex}` }}></div>
            <span className="text-[8px] font-bold tracking-[0.5em] uppercase">{t.created}</span>
         </div>
         <div className="flex items-center gap-4">
            <div className="text-[7px] font-bold tracking-[0.3em] opacity-10 uppercase font-futuristic">Neural System Active</div>
            <a 
                href="https://www.facebook.com/share/1HnU5FCMGs/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="opacity-20 hover:opacity-100 transition-all hover:scale-125"
                style={{ color: activeColor.hex }}
            >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
         </div>
      </footer>

      {/* Enhanced Config Overlay */}
      {showSettings && (
        <div className="absolute inset-0 z-[120] flex items-end animate-in slide-in-from-bottom-full duration-700 backdrop-blur-sm bg-black/40">
          <div className="w-full h-3/4 bg-[#050508] rounded-t-[4rem] p-10 border-t border-white/10 shadow-[0_-40px_100px_rgba(0,0,0,1)] overflow-y-auto">
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-10"></div>
            <div className="flex justify-between items-center mb-12">
              <h3 className="font-futuristic tracking-[0.4em] text-xs uppercase font-bold" style={{ color: activeColor.hex }}>System Configuration</h3>
              <button onClick={() => setShowSettings(false)} className="opacity-30 hover:opacity-100 transition-all"><svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={1.5}/></svg></button>
            </div>
            
            <div className="space-y-12">
              <div className="space-y-5">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">{t.color} Energy</span>
                <div className="flex justify-between items-center bg-white/5 p-5 rounded-[2rem] border border-white/5">
                  {(Object.keys(COLOR_THEMES) as PrimaryColor[]).map(c => (
                    <button 
                      key={c}
                      onClick={() => setPrimaryColor(c)}
                      className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-125 ${primaryColor === c ? 'border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: COLOR_THEMES[c].hex, boxShadow: primaryColor === c ? `0 0 20px ${COLOR_THEMES[c].hex}` : '' }}
                    ></button>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">{t.theme} Modality</span>
                <div className="grid grid-cols-2 bg-white/5 p-2 rounded-2xl border border-white/5">
                  <button onClick={() => setTheme('dark')} className={`py-4 rounded-xl text-[11px] font-bold tracking-widest transition-all ${theme === 'dark' ? 'bg-white/10 text-white shadow-xl' : 'opacity-20'}`}>NEURAL DARK</button>
                  <button onClick={() => setTheme('light')} className={`py-4 rounded-xl text-[11px] font-bold tracking-widest transition-all ${theme === 'light' ? 'bg-white text-black shadow-xl' : 'opacity-20'}`}>TECH LIGHT</button>
                </div>
              </div>

              <div className="space-y-5">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">Calibration Logic</span>
                <div className="grid grid-cols-3 gap-3">
                   {['GPT-4', 'GEMINI 3', 'KIMI K2'].map(model => (
                      <div key={model} className="p-4 bg-white/5 rounded-2xl border border-white/5 text-[10px] font-bold text-center opacity-30 hover:opacity-100 transition-all cursor-pointer hover:border-white/20 tracking-tighter">
                         {model}
                      </div>
                   ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Identity Profile Overlay */}
      {showProfileModal && (
        <div className="absolute inset-0 z-[150] flex items-center justify-center p-8 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-500">
           <div className="bg-[#08080a] p-10 rounded-[3rem] border border-white/10 w-full max-w-sm space-y-8 shadow-[0_50px_100px_rgba(0,0,0,0.8)]">
              {!profile ? (
                <>
                  <h2 className="font-futuristic text-center text-xs tracking-[0.4em] uppercase font-bold" style={{ color: activeColor.hex }}>Engineer Identity Portal</h2>
                  <div className="space-y-4">
                    <input placeholder="NEURAL USERNAME" className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl text-[13px] outline-none font-semibold focus:border-white/20 transition-all" onChange={e => setTempProfile(p => ({...p, name: e.target.value}))} />
                    <input placeholder="CALIBRATION EMAIL" className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl text-[13px] outline-none font-semibold focus:border-white/20 transition-all" onChange={e => setTempProfile(p => ({...p, email: e.target.value}))} />
                    <div className="flex justify-center py-4">
                      <label className="cursor-pointer group flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center transition-all group-hover:border-white/30 overflow-hidden shadow-2xl">
                          {tempProfile.profilePic ? <img src={tempProfile.profilePic} className="w-full h-full object-cover" /> : <svg className="w-7 h-7 opacity-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={1}/></svg>}
                        </div>
                        <span className="text-[10px] font-bold opacity-20 uppercase tracking-[0.2em]">Scan Profile Pic</span>
                        <input type="file" accept="image/*" hidden onChange={(e) => {
                          const f = e.target.files?.[0];
                          if(f) { const r = new FileReader(); r.onloadend = () => setTempProfile(p => ({...p, profilePic: r.result as string})); r.readAsDataURL(f); }
                        }} />
                      </label>
                    </div>
                    <button onClick={() => {if(tempProfile.name) setProfile(tempProfile as UserProfile)}} className="w-full p-5 rounded-[1.8rem] font-futuristic text-[11px] text-black font-bold tracking-[0.5em] transition-all hover:opacity-90 active:scale-95 shadow-2xl" style={{ backgroundColor: activeColor.hex }}>LINK IDENTITY</button>
                  </div>
                  <button onClick={() => setShowProfileModal(false)} className="w-full text-[10px] opacity-20 hover:opacity-100 font-bold uppercase tracking-widest text-center pt-2">Close Portal</button>
                </>
              ) : (
                <div className="relative p-8 rounded-[2.5rem] bg-gradient-to-br from-[#0e0e12] to-black border border-white/10 flex flex-col items-center shadow-2xl overflow-hidden">
                   <div className="absolute top-0 right-0 w-20 h-20 opacity-10" style={{ color: activeColor.hex }}>
                     <svg fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 13a1 1 0 112 0 1 1 0 01-2 0zm1-9a1 1 0 100 2 1 1 0 000-2z" /></svg>
                   </div>
                   <div className="w-24 h-24 rounded-2xl border-2 mb-6 overflow-hidden shadow-2xl" style={{ borderColor: activeColor.hex }}>
                     {profile.profilePic ? <img src={profile.profilePic} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-10" style={{ color: activeColor.hex }}><svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" /></svg></div>}
                   </div>
                   <h3 className="font-futuristic text-white text-[18px] uppercase tracking-[0.2em] font-bold mb-1 drop-shadow-lg">{profile.name}</h3>
                   <p className="text-[11px] opacity-40 font-bold tracking-[0.3em] mb-8">{profile.idNumber}</p>
                   <div className="w-full border-t border-white/5 pt-8 flex justify-between items-center">
                      <div className="text-[9px] uppercase tracking-widest font-bold opacity-30">Sector 12 Diagnostics</div>
                      <div className="w-3 h-3 rounded-full animate-ping shadow-[0_0_15px_currentColor]" style={{ backgroundColor: activeColor.hex, color: activeColor.hex }}></div>
                   </div>
                   <button onClick={() => setShowProfileModal(false)} className="mt-10 text-[10px] opacity-10 font-bold uppercase tracking-widest hover:opacity-100 transition-all">Close Profile</button>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Professional Neural Status Overlay */}
      {status === AppStatus.THINKING && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-4 animate-in fade-in zoom-in-95">
           <div className="relative flex items-center justify-center">
              <div className="absolute w-16 h-16 rounded-full border-2 border-white/5 animate-ping opacity-10"></div>
              <div className="w-12 h-12 border-4 border-white/5 border-t-white rounded-full animate-spin" style={{ borderColor: `${activeColor.hex}11`, borderTopColor: activeColor.hex }}></div>
           </div>
           <span className="text-[10px] font-bold tracking-[0.8em] uppercase opacity-40 animate-pulse ml-2" style={{ color: activeColor.hex }}>Analyzing Signal</span>
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;
