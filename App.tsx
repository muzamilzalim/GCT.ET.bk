
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
    setStatus(AppStatus.IDLE);
  };

  return (
    <div 
      className={`flex flex-col h-screen max-w-md mx-auto relative overflow-hidden transition-all duration-700 ${theme === 'dark' ? 'bg-[#010102]' : 'bg-[#fafafa]'}`}
      style={{ '--theme-color': activeColor.hex, '--theme-glow': activeColor.shadow } as any}
    >
      
      {/* HUD Atmosphere */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className={`absolute -inset-[30%] opacity-[0.05] animate-[pulse_20s_infinite] rounded-full`} style={{ background: `radial-gradient(circle, ${activeColor.hex}, transparent)` }}></div>
        <div className="absolute top-0 w-full h-[2px] animated-border opacity-30"></div>
      </div>

      {/* Header */}
      <header className={`relative z-20 px-6 py-2.5 flex items-center justify-between border-b transition-all duration-500 ${theme === 'dark' ? 'border-white/5 bg-black/60' : 'border-gray-200 bg-white/80'} backdrop-blur-xl`}>
        <Logo color={primaryColor} />
        <div className="flex items-center gap-3">
           <button onClick={() => setShowSettings(true)} className="p-2 transition-all hover:scale-110 active:scale-90" style={{ color: activeColor.hex }}>
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" strokeWidth={1.5}/></svg>
           </button>
           <button onClick={() => setShowProfileModal(true)} className={`p-0.5 rounded-lg border transition-all hover:bg-white/5`} style={{ borderColor: `${activeColor.hex}33` }}>
            {profile?.profilePic ? <img src={profile.profilePic} className="w-8 h-8 rounded-md object-cover" /> : <svg className="w-5 h-5" style={{ color: activeColor.hex }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
           </button>
        </div>
      </header>

      {/* Chat Area */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto z-10 p-5 space-y-7 scroll-smooth pb-20">
        {messages.length === 0 && (
          <div className="py-8 space-y-10 animate-in fade-in slide-in-from-top-4 duration-1000">
            <div className="text-center space-y-2">
              <h2 className="font-futuristic text-xl font-bold tracking-[0.5em] uppercase opacity-90" style={{ color: activeColor.hex }}>{t.status}</h2>
              <div className="flex items-center justify-center gap-4">
                 <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-white/10"></div>
                 <p className="text-[9px] uppercase tracking-[0.6em] font-medium opacity-30">{t.subStatus}</p>
                 <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-white/10"></div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3 px-4">
              {ELECTRICAL_TEMPLATES.map((tmpl, idx) => (
                <button key={idx} onClick={() => handleSendMessage(tmpl)} className={`text-left p-4 rounded-2xl border transition-all hover:bg-white/5 active:scale-[0.98] group ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-black shadow-inner" style={{ color: activeColor.hex }}>⚡</div>
                    <span className="font-medium text-[13px] opacity-70 group-hover:opacity-100 transition-opacity">{tmpl}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-400`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-xl relative transition-all ${msg.role === 'user' ? (theme === 'dark' ? 'bg-white/5 border border-white/5' : 'bg-gray-50 border-gray-200 border') : (theme === 'dark' ? 'bg-black/30 border border-white/5' : 'bg-white border-gray-100')}`}>
              {msg.attachments?.map((att, i) => (
                <img key={i} src={att.data} className={`w-full rounded-xl mb-4 border border-white/5 shadow-2xl ${msg.isImage ? 'h-auto max-h-[250px]' : 'h-32 object-cover'}`} />
              ))}
              
              <div className={`bot-message text-[14.5px] leading-relaxed ${msg.role === 'assistant' ? '' : 'font-medium opacity-90'}`} 
                   dangerouslySetInnerHTML={{ __html: msg.content }}>
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* Input Module with GOD BUTTON */}
      <div className={`relative z-30 px-6 pt-2 pb-12 transition-all`}>
        <div className={`flex items-center gap-4 p-1 rounded-[1.5rem] transition-all duration-500 input-container ${theme === 'dark' ? 'bg-black/60' : 'bg-white shadow-xl'}`}>
          <button onClick={() => fileInputRef.current?.click()} className="p-3 transition-all opacity-40 hover:opacity-100 hover:rotate-12" style={{ color: activeColor.hex }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" strokeWidth={1.5}/></svg>
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
            className={`flex-1 py-2 bg-transparent text-[14px] outline-none placeholder:opacity-20 font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}
          />

          {/* THE GOD BUTTON */}
          <button 
            onClick={() => handleSendMessage()}
            className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 group shadow-lg active:scale-95 god-button mr-1`}
            style={{ 
              boxShadow: `0 0 20px ${activeColor.shadow}`,
              background: `linear-gradient(135deg, ${activeColor.hex}, #fff)`
            }}
            disabled={status === AppStatus.THINKING}
          >
            {status === AppStatus.THINKING ? (
               <div className="relative w-6 h-6 flex items-center justify-center">
                 <div className="absolute inset-0 border-2 border-black/30 rounded-full"></div>
                 <div className="absolute inset-0 border-2 border-t-black rounded-full animate-spin"></div>
               </div>
            ) : (
               <div className="relative flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {/* Energy Sparkle */}
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping opacity-70"></div>
               </div>
            )}
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className={`absolute bottom-0 left-0 w-full z-40 px-6 py-2 flex items-center justify-between border-t transition-all ${theme === 'dark' ? 'bg-black border-white/5' : 'bg-white border-gray-100'}`}>
         <div className="flex items-center gap-2.5 opacity-30 hover:opacity-100 transition-opacity">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeColor.hex, boxShadow: `0 0 8px ${activeColor.hex}` }}></div>
            <span className="text-[7.5px] font-bold tracking-[0.4em] uppercase">{t.created}</span>
         </div>
         <div className="flex items-center gap-3">
            <div className="text-[6.5px] font-bold tracking-[0.3em] opacity-15 uppercase font-futuristic">Core X9.0</div>
            <a 
                href="https://www.facebook.com/share/1HnU5FCMGs/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="opacity-20 hover:opacity-100 transition-all hover:scale-110"
                style={{ color: activeColor.hex }}
            >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
         </div>
      </footer>

      {/* Settings */}
      {showSettings && (
        <div className="absolute inset-0 z-[120] flex items-end animate-in slide-in-from-bottom-full duration-500">
          <div className="w-full h-3/4 bg-[#050508] rounded-t-[2.5rem] p-8 border-t border-white/10 shadow-[0_-30px_100px_rgba(0,0,0,0.9)] overflow-y-auto">
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-8"></div>
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-futuristic tracking-[0.2em] text-[10px] uppercase font-bold" style={{ color: activeColor.hex }}>System Core Config</h3>
              <button onClick={() => setShowSettings(false)} className="opacity-40 hover:opacity-100 transition-all"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={1.5}/></svg></button>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-3">
                <span className="text-[8px] font-bold uppercase tracking-widest opacity-30">{t.color}</span>
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                  {(Object.keys(COLOR_THEMES) as PrimaryColor[]).map(c => (
                    <button 
                      key={c}
                      onClick={() => setPrimaryColor(c)}
                      className={`w-9 h-9 rounded-full border-2 transition-all hover:scale-125 ${primaryColor === c ? 'border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: COLOR_THEMES[c].hex, boxShadow: primaryColor === c ? `0 0 15px ${COLOR_THEMES[c].hex}` : '' }}
                    ></button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-[8px] font-bold uppercase tracking-widest opacity-30">{t.theme}</span>
                <div className="grid grid-cols-2 bg-white/5 p-1 rounded-xl border border-white/5">
                  <button onClick={() => setTheme('dark')} className={`py-3 rounded-lg text-[9px] font-bold transition-all ${theme === 'dark' ? 'bg-white/10 text-white' : 'opacity-20'}`}>DEEP NEON</button>
                  <button onClick={() => setTheme('light')} className={`py-3 rounded-lg text-[9px] font-bold transition-all ${theme === 'light' ? 'bg-white text-black' : 'opacity-20'}`}>PURE TECH</button>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-[8px] font-bold uppercase tracking-widest opacity-30">Calibration Models</span>
                <div className="grid grid-cols-3 gap-2">
                   {['ChatGPT-4o', 'Gemini 3.0', 'Kimi K2 Turbo'].map(model => (
                      <div key={model} className="p-3 bg-white/5 rounded-xl border border-white/5 text-[8px] font-bold text-center opacity-30 hover:opacity-100 transition-all cursor-pointer hover:border-white/20">
                         {model}
                      </div>
                   ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ID Profile */}
      {showProfileModal && (
        <div className="absolute inset-0 z-[150] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl animate-in fade-in duration-500">
           <div className="bg-[#0a0a0c] p-7 rounded-[2.5rem] border border-white/10 w-full max-w-sm space-y-5 shadow-2xl">
              {!profile ? (
                <>
                  <h2 className="font-futuristic text-center text-[11px] tracking-[0.3em] uppercase font-bold" style={{ color: activeColor.hex }}>Neural Registration</h2>
                  <div className="space-y-3">
                    <input placeholder="ENGINEER NAME" className="w-full bg-white/5 border border-white/5 p-4 rounded-xl text-[12px] outline-none font-medium focus:border-white/20 transition-all" onChange={e => setTempProfile(p => ({...p, name: e.target.value}))} />
                    <input placeholder="NEURAL EMAIL" className="w-full bg-white/5 border border-white/5 p-4 rounded-xl text-[12px] outline-none font-medium focus:border-white/20 transition-all" onChange={e => setTempProfile(p => ({...p, email: e.target.value}))} />
                    <div className="flex justify-center py-4">
                      <label className="cursor-pointer group flex flex-col items-center gap-2">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center transition-all group-hover:border-white/40 overflow-hidden shadow-inner">
                          {tempProfile.profilePic ? <img src={tempProfile.profilePic} className="w-full h-full object-cover" /> : <svg className="w-6 h-6 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={1.5}/></svg>}
                        </div>
                        <span className="text-[8px] font-bold opacity-20 uppercase tracking-widest">Neural Link Pic</span>
                        <input type="file" accept="image/*" hidden onChange={(e) => {
                          const f = e.target.files?.[0];
                          if(f) { const r = new FileReader(); r.onloadend = () => setTempProfile(p => ({...p, profilePic: r.result as string})); r.readAsDataURL(f); }
                        }} />
                      </label>
                    </div>
                    <button onClick={() => {if(tempProfile.name) setProfile(tempProfile as UserProfile)}} className="w-full p-4 rounded-xl font-futuristic text-[11px] text-black font-bold tracking-[0.5em] transition-all hover:opacity-90 active:scale-95" style={{ backgroundColor: activeColor.hex }}>SYNC IDENTITY</button>
                  </div>
                  <button onClick={() => setShowProfileModal(false)} className="w-full text-[9px] opacity-20 hover:opacity-100 font-bold uppercase tracking-widest text-center">Abort</button>
                </>
              ) : (
                <div className="relative p-7 rounded-[2.5rem] bg-gradient-to-br from-[#0c0c10] to-black border border-white/10 flex flex-col items-center shadow-2xl">
                   <div className="w-20 h-20 rounded-2xl border-2 mb-4 overflow-hidden shadow-2xl" style={{ borderColor: activeColor.hex }}>
                     {profile.profilePic ? <img src={profile.profilePic} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-10" style={{ color: activeColor.hex }}><svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" /></svg></div>}
                   </div>
                   <div className="text-center">
                     <h3 className="font-futuristic text-white text-[16px] uppercase tracking-[0.2em] font-bold mb-0.5">{profile.name}</h3>
                     <p className="text-[9px] font-bold tracking-[0.4em] mb-4 uppercase" style={{ color: activeColor.hex }}>Electrical Engineer</p>
                   </div>
                   <p className="text-[10px] opacity-40 font-bold tracking-[0.2em] mb-8 font-mono">{profile.idNumber}</p>
                   <div className="w-full border-t border-white/5 pt-6 flex justify-between items-center">
                      <div className="text-[9px] uppercase tracking-widest font-bold opacity-30">Zone 07 Alpha</div>
                      <div className="w-2 h-2 rounded-full animate-pulse shadow-[0_0_12px_currentColor]" style={{ backgroundColor: activeColor.hex, color: activeColor.hex }}></div>
                   </div>
                   <button onClick={() => setShowProfileModal(false)} className="mt-10 text-[9px] opacity-20 font-bold uppercase tracking-widest hover:opacity-100 transition-all">Terminate Portal</button>
                </div>
              )}
           </div>
        </div>
      )}

      {/* GOD MODE Thinking HUD */}
      {status === AppStatus.THINKING && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-3 animate-in fade-in zoom-in-95">
           <div className="relative flex items-center justify-center">
              <div className="absolute w-12 h-12 rounded-full border-2 border-white/5 animate-ping"></div>
              <div className="w-10 h-10 border-2 border-white/10 border-t-white rounded-full animate-spin" style={{ borderTopColor: activeColor.hex }}></div>
              <div className="absolute w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_15px_white]"></div>
           </div>
           <span className="text-[9px] font-bold tracking-[0.7em] uppercase opacity-60 animate-pulse" style={{ color: activeColor.hex }}>Synthesizing...</span>
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
