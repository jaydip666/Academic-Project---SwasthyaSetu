import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import BookingModal from "../../components/BookingModal";
import { Activity, RefreshCw, Send, AlertTriangle, CheckCircle2, Hospital, User, ShieldAlert, ChevronRight, Calendar } from 'lucide-react';

const STYLES = `
.sc-page-container {
  min-height: calc(100vh - 80px);
  padding: 2rem;
  background: radial-gradient(circle at top right, hsl(var(--primary) / 0.05), transparent),
              radial-gradient(circle at bottom left, hsl(var(--secondary) / 0.05), transparent);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sc-shell {
  width: 100%;
  max-width: 1200px;
  height: 800px;
  background: var(--glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: row;
  overflow: hidden;
  position: relative;
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.sc-main-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    border-right: 1px solid hsl(var(--border) / 0.3);
    position: relative;
    background: transparent;
}

.sc-sidebar {
    width: 320px;
    background: hsl(var(--card) / 0.4);
    backdrop-filter: blur(4px);
    display: flex;
    flex-direction: column;
    padding: 100px 1.5rem 2rem;
    gap: 2rem;
    overflow-y: auto;
}

@media (max-width: 1024px) {
    .sc-sidebar {
        display: none;
    }
    .sc-shell {
        max-width: 100%;
        height: calc(100vh - 80px);
    }
}

.sc-sidebar-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.sc-sidebar-title {
    font-size: 0.75rem;
    font-weight: 800;
    color: hsl(var(--primary));
    text-transform: uppercase;
    letter-spacing: 0.1em;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.sc-instruction-item {
    display: flex;
    gap: 0.75rem;
    font-size: 0.85rem;
    color: hsl(var(--muted-foreground));
    line-height: 1.4;
}

.sc-instruction-icon {
    width: 28px;
    height: 28px;
    background: hsl(var(--primary) / 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: hsl(var(--primary));
    flex-shrink: 0;
}

.sc-safety-banner {
    background: hsl(var(--destructive) / 0.05);
    border: 1px solid hsl(var(--destructive) / 0.2);
    border-radius: var(--radius-sm);
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

/* ... (rest of the styles) ... */

.sc-header-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 70px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(to bottom, hsl(var(--card) / 0.9), transparent);
  z-index: 20;
  border-bottom: 1px solid hsl(var(--border) / 0.3);
}

.sc-title {
  font-family: 'Outfit', sans-serif;
  font-size: 1.25rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sc-title-icon {
    background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)));
    padding: 0.4rem;
    border-radius: 0.6rem;
    color: white;
    display: flex;
    box-shadow: 0 4px 12px hsl(var(--primary) / 0.3);
}

.sc-restart-btn {
  background: hsl(var(--muted));
  border: 1px solid hsl(var(--border));
  border-radius: 2rem;
  padding: 0.5rem 1.25rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: var(--transition);
}

.sc-restart-btn:hover {
  background: hsl(var(--destructive) / 0.1);
  color: hsl(var(--destructive));
  border-color: hsl(var(--destructive) / 0.2);
}

.sc-progress-container {
  height: 4px;
  background: hsl(var(--border) / 0.3);
  overflow: hidden;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 30;
}

.sc-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)));
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 10px hsl(var(--primary) / 0.5);
}

.sc-messages {
  flex: 1;
  overflow-y: auto;
  padding: 100px 2.5rem 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  scroll-behavior: smooth;
}

.sc-messages::-webkit-scrollbar { width: 5px; }
.sc-messages::-webkit-scrollbar-track { background: transparent; }
.sc-messages::-webkit-scrollbar-thumb { 
  background: hsl(var(--border)); 
  border-radius: 10px;
}

.sc-row { display: flex; flex-direction: column; width: 100%; }
.sc-row--user { align-items: flex-end; }
.sc-row--bot { align-items: flex-start; }

.sc-bubble {
  max-width: 80%;
  padding: 1.25rem 1.5rem;
  border-radius: 1.5rem;
  font-size: 0.95rem;
  line-height: 1.6;
  position: relative;
  animation: bubbleAppear 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}

@keyframes bubbleAppear {
  from { opacity: 0; transform: translateY(10px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.sc-bubble--user {
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8));
  color: white;
  border-bottom-right-radius: 0.25rem;
  box-shadow: 0 10px 25px -5px hsl(var(--primary) / 0.4);
}

.sc-bubble--bot {
  background: hsl(var(--card));
  color: hsl(var(--foreground));
  border: 1px solid hsl(var(--border) / 0.5);
  border-bottom-left-radius: 0.25rem;
  box-shadow: var(--shadow-sm);
}

.sc-bubble--welcome {
  background: linear-gradient(135deg, hsl(var(--primary) / 0.05), hsl(var(--secondary) / 0.05));
  border: 1px dashed hsl(var(--primary) / 0.4);
  text-align: center;
  max-width: 100%;
  margin-bottom: 1rem;
}

.sc-bubble--emergency {
  background: hsl(var(--destructive) / 0.08);
  border: 2px solid hsl(var(--destructive) / 0.3);
  color: hsl(var(--destructive));
}

.sc-data-card {
  margin-top: 1.25rem;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border) / 0.5);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  width: 100%;
}

.sc-card-header {
  padding: 0.75rem 1.25rem;
  background: hsl(var(--primary) / 0.05);
  border-bottom: 1px solid hsl(var(--border) / 0.5);
  color: hsl(var(--primary));
  font-weight: 800;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sc-card-body { padding: 1.25rem; }

.sc-bottom-container {
  padding: 1.5rem 2.5rem 2rem;
  background: hsl(var(--card) / 0.8);
  backdrop-filter: blur(8px);
  border-top: 1px solid hsl(var(--border) / 0.5);
}

.sc-starter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.sc-starter {
  padding: 0.6rem 1.25rem;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 2rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  transition: var(--transition);
}

.sc-starter:hover {
  background: hsl(var(--primary) / 0.05);
  border-color: hsl(var(--primary));
  color: hsl(var(--primary));
  transform: translateY(-2px);
}

.sc-input-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: hsl(var(--muted));
  padding: 0.5rem 0.5rem 0.5rem 1.5rem;
  border-radius: 1.5rem;
  border: 1px solid hsl(var(--border));
  transition: var(--transition);
}

.sc-input-wrapper:focus-within {
  border-color: hsl(var(--primary));
  background: hsl(var(--card));
  box-shadow: 0 0 0 4px hsl(var(--primary) / 0.1);
}

.sc-input {
  flex: 1;
  background: transparent;
  border: none;
  font-size: 1rem;
  color: hsl(var(--foreground));
  outline: none;
  padding: 0.75rem 0;
  font-family: inherit;
}

.sc-send-btn {
  width: 48px;
  height: 48px;
  background: hsl(var(--primary));
  color: white;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
  transition: var(--transition);
  box-shadow: 0 4px 12px hsl(var(--primary) / 0.3);
}

.sc-send-btn:hover:not(:disabled) {
  background: hsl(var(--primary) / 0.9);
  transform: scale(1.05) rotate(-10deg);
}

.sc-send-btn:disabled {
  background: hsl(var(--muted-foreground) / 0.3);
  cursor: not-allowed;
  box-shadow: none;
}

.rt-para { margin-bottom: 0.75rem; }
.rt-para:last-child { margin-bottom: 0; }
.rt-item { display: flex; gap: 0.75rem; align-items: flex-start; margin-bottom: 0.5rem; }
.rt-bullet { width: 6px; height: 6px; border-radius: 50%; background: hsl(var(--primary)); margin-top: 0.6rem; flex-shrink: 0; }

.sc-doc-card {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: hsl(var(--muted) / 0.3);
    border-radius: var(--radius-sm);
    border: 1px solid hsl(var(--border) / 0.5);
    margin-bottom: 1rem;
    transition: var(--transition);
}

.sc-doc-card:hover {
    background: hsl(var(--primary) / 0.05);
    border-color: hsl(var(--primary) / 0.3);
}
`;

function RichText({ text }) {
    if (!text) return null;
    return (
        <div className="rt">
            {text.split('\n').map((line, i) => {
                const t = line.trim();
                if (!t) return <div key={i} style={{ height: '0.5rem' }} />;
                
                const parts = [];
                const re = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
                let last = 0, m, k = 0;
                while ((m = re.exec(t)) !== null) {
                    if (m.index > last) parts.push(<span key={k++}>{t.slice(last, m.index)}</span>);
                    if (m[0].startsWith('**')) parts.push(<strong key={k++} style={{color: 'hsl(var(--primary))', fontWeight: 800}}>{m[2]}</strong>);
                    else parts.push(<em key={k++} style={{fontStyle: 'italic'}}>{m[3]}</em>);
                    last = re.lastIndex;
                }
                if (last < t.length) parts.push(<span key={k++}>{t.slice(last)}</span>);
                
                const content = parts.length ? parts : t;

                if (t.startsWith('- ') || t.startsWith('• ')) {
                    return <div key={i} className="rt-item"><span className="rt-bullet" /><div>{content}</div></div>;
                }
                return <p key={i} className="rt-para">{content}</p>;
            })}
        </div>
    );
}

const SymptomChecker = () => {
    const [messages, setMessages] = useState([{
        id: 0, type: 'bot', isWelcome: true,
        text: "Hey there! 👋 I'm **Swasthya AI** — your health assistant.\n\nTell me what you're feeling and I'll help you find the right care.",
    }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [diagnosis, setDiagnosis] = useState(null);
    const [isEmergency, setIsEmergency] = useState(false);
    const [inputError, setInputError] = useState('');
    const [showStarters, setShowStarters] = useState(true);
    const [isFollowUp, setIsFollowUp] = useState(false);
    const [streamingText, setStreamingText] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [bookingDoctor, setBookingDoctor] = useState(null);

    const msgRef = useRef(null);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Purge backend session on mount so page refreshes/re-visits always start fresh
        const clearChatOnLoad = async () => {
            try { await api.post('/predict-symptoms/clear/'); } catch { }
        };
        clearChatOnLoad();
    }, []);

    useEffect(() => {
        if (msgRef.current) msgRef.current.scrollTop = msgRef.current.scrollHeight;
    }, [messages, loading, diagnosis, isEmergency, streamingText]);

    const hasEmergency = (t = '') =>
        t.includes('🚨') || t.includes('emergency medicine') || t.toLowerCase().includes('call 112');

    const simulateStreaming = async (text) => {
        if (!text) return;
        setIsStreaming(true);
        setStreamingText('');
        const words = text.split(' ');
        for (let i = 0; i < words.length; i++) {
            await new Promise(r => setTimeout(r, 5)); // Sped up the fake typing effect
            setStreamingText(words.slice(0, i + 1).join(' '));
        }
        setIsStreaming(false);
    };

    const handleSend = async (text) => {
        const trimmed = (text ?? input).trim();
        if (!trimmed || loading || isEmergency) return;

        const SHORT_VALID = new Set([
            'yes', 'no', 'nope', 'yep', 'yeah', 'none', 'nothing', 'not', 'maybe',
            'left', 'right', 'both', 'better', 'worse', 'same', 'mild', 'severe',
            'today', 'yesterday', 'week', 'days', 'always', 'sometimes', 'never',
        ]);
        const isShortValid = SHORT_VALID.has(trimmed.toLowerCase());

        if (!isFollowUp && !isShortValid && trimmed.length < 4) {
            setInputError('Please describe what you\'re feeling — e.g. "I have a headache".');
            return;
        }

        setInputError('');
        setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: trimmed }]);
        setInput('');
        setLoading(true);
        setShowStarters(false);

        try {
            const result = await api.post('/predict-symptoms/', { message: trimmed });
            await simulateStreaming(result.response);

            const botMsg = {
                id: Date.now(), type: 'bot',
                text: result.response,
                results: {},
            };

            if (result.doctors?.length) botMsg.results.doctors = result.doctors;
            if (result.hospitals?.length) botMsg.results.hospitals = result.hospitals;

            setMessages(prev => [...prev, botMsg]);
            setStreamingText('');

            // Status Handling
            if (result.status === 'need_more_info') {
                setIsFollowUp(true);
                setProgress(p => Math.min(p + 15, 90));
            } else if (result.status === 'complete') {
                const assessment = result.result;
                setDiagnosis({
                    diagnosis: assessment.primary_disease,
                    specialist: assessment.recommended_doctor,
                    severity: assessment.severity,
                    action: assessment.recommended_action,
                    explanation: assessment.explanation,
                    alternatives: assessment.possible_diseases,
                    confidence: 95 // Gemini 1.5 baseline
                });
                setProgress(100);
                setIsFollowUp(false);
                
                if (assessment.severity === 'Emergency') {
                    setIsEmergency(true);
                }
            }

        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, {
                id: Date.now(), type: 'bot',
                text: "I'm having a little trouble connecting. Please try again.",
            }]);
        } finally {
            setLoading(false);
            setIsStreaming(false);
        }
    };

    const handleRestart = async () => {
        try { await api.post('/predict-symptoms/clear/'); } catch { }
        setMessages([{
            id: 0, type: 'bot', isWelcome: true,
            text: "Hey there! 👋 I'm **Swasthya AI** — your health assistant.\n\nTell me what you're feeling and I'll help you find the right care.",
        }]);
        setInput(''); setLoading(false); setShowStarters(true);
        setDiagnosis(null); setIsEmergency(false);
        setInputError(''); setProgress(0); setIsFollowUp(false);
        setStreamingText(''); setIsStreaming(false);
    };

    return (
        <section className="sc-page-container">
            <style>{STYLES}</style>

            <div className="sc-shell">
                {/* Left Area: Chat */}
                <div className="sc-main-area">
                    {/* Progress Bar */}
                    <div className="sc-progress-container">
                        <div className="sc-progress-fill" style={{ width: `${progress}%` }} />
                    </div>

                    {/* Header Area */}
                    <div className="sc-header-overlay">
                        <div className="sc-title">
                            <div className="sc-title-icon"><Activity size={20} /></div>
                            Swasthya <span className="gradient-text">AI</span>
                        </div>
                        <button className="sc-restart-btn" onClick={handleRestart}>
                            <RefreshCw size={14} /> New Session
                        </button>
                    </div>

                    {/* Messages Container */}
                    <div className="sc-messages" ref={msgRef}>
                        {messages.map((m) => (
                            <div key={m.id} className={`sc-row sc-row--${m.type}`}>
                                <div className={`sc-bubble sc-bubble--${m.type} ${m.isWelcome ? 'sc-bubble--welcome' : ''} ${m.isEmergency ? 'sc-bubble--emergency' : ''}`}>
                                    {m.isEmergency && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: 800 }}>
                                            <AlertTriangle size={20} /> URGENT MEDICAL ADVICE
                                        </div>
                                    )}
                                    <RichText text={m.text} />

                                    {/* Assessment Results Card */}
                                    {m.type === 'bot' && diagnosis && messages[messages.length - 1]?.id === m.id && (
                                        <div className="sc-data-card" style={{borderColor: diagnosis.severity === 'Emergency' ? 'hsl(var(--destructive) / 0.5)' : 'hsl(var(--primary) / 0.3)'}}>
                                            <div className="sc-card-header" style={{ background: diagnosis.severity === 'Emergency' ? 'hsl(var(--destructive) / 0.1)' : 'hsl(var(--primary) / 0.05)', color: diagnosis.severity === 'Emergency' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))' }}>
                                                <span>Clinical Assessment Summary</span>
                                                <CheckCircle2 size={16} />
                                            </div>
                                            <div className="sc-card-body">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                    <div>
                                                        <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))', fontWeight: '700', textTransform: 'uppercase' }}>Primary Assessment</div>
                                                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'hsl(var(--foreground))' }}>{diagnosis.diagnosis}</div>
                                                    </div>
                                                    <div style={{ 
                                                        padding: '0.25rem 0.75rem', 
                                                        borderRadius: '1rem', 
                                                        fontSize: '0.7rem', 
                                                        fontWeight: 800,
                                                        background: diagnosis.severity === 'Emergency' ? 'hsl(var(--destructive))' : 
                                                                    diagnosis.severity === 'High' ? 'orange' :
                                                                    diagnosis.severity === 'Medium' ? 'hsl(var(--primary))' : 'green',
                                                        color: 'white'
                                                    }}>
                                                        {diagnosis.severity}
                                                    </div>
                                                </div>

                                                <div style={{ marginBottom: '1rem' }}>
                                                    <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Explanation</div>
                                                    <div style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>{diagnosis.explanation}</div>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                                    <div>
                                                        <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Recommended Specialist</div>
                                                        <div className="sc-spec-badge" style={{ margin: 0, width: 'fit-content' }}>{diagnosis.specialist}</div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Action</div>
                                                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: diagnosis.severity === 'Emergency' ? 'hsl(var(--destructive))' : 'inherit' }}>{diagnosis.action}</div>
                                                    </div>
                                                </div>

                                                {diagnosis.alternatives?.length > 0 && (
                                                    <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'hsl(var(--muted) / 0.3)', borderRadius: 'var(--radius-sm)' }}>
                                                        <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Alternative Possibilities</div>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                            {diagnosis.alternatives.map(alt => (
                                                                <span key={alt} style={{ padding: '0.2rem 0.6rem', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 600 }}>{alt}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 800 }}>
                                                        <span>AI Confidence Score</span>
                                                        <span>{diagnosis.confidence}%</span>
                                                    </div>
                                                    <div style={{ height: '6px', background: 'hsl(var(--border) / 0.5)', borderRadius: '3px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${diagnosis.confidence}%`, height: '100%', background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)))' }} />
                                                    </div>
                                                </div>

                                                <button 
                                                    onClick={() => navigate('/patient/search', { state: { specialization: diagnosis.specialist } })}
                                                    style={{ 
                                                        marginTop: '1.5rem', 
                                                        width: '100%', 
                                                        padding: '1rem', 
                                                        background: 'hsl(var(--primary))', 
                                                        color: 'white', 
                                                        border: 'none', 
                                                        borderRadius: '0.75rem', 
                                                        fontSize: '0.9rem', 
                                                        fontWeight: 800, 
                                                        cursor: 'pointer', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center', 
                                                        gap: '0.5rem',
                                                        boxShadow: '0 4px 12px hsl(var(--primary) / 0.3)'
                                                    }}
                                                >
                                                    <Calendar size={18} /> Book Appointment with {diagnosis.specialist}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Doctor Recommendations */}
                                    {m.results?.doctors?.length > 0 && (
                                        <div className="sc-data-card">
                                            <div className="sc-card-header">
                                                <span>Available Specialists</span>
                                                <User size={16} />
                                            </div>
                                            <div className="sc-card-body">
                                                {m.results.doctors.map(doc => (
                                                    <div key={doc._id} className="sc-doc-card">
                                                        <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'hsl(var(--primary) / 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                                                            {doc.profile_picture ? <img src={api.getMediaUrl(doc.profile_picture)} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <User size={24} color="hsl(var(--primary))" />}
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>Dr. {doc.doctor_name}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--primary))', fontWeight: 700 }}>{doc.specialization}</div>
                                                            <button 
                                                                onClick={() => setBookingDoctor(doc)}
                                                                style={{ marginTop: '0.5rem', padding: '0.35rem 0.75rem', background: 'hsl(var(--primary))', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                                            >
                                                                Book Now <ChevronRight size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Hospitals Recommendations */}
                                    {m.results?.hospitals?.length > 0 && (
                                        <div className="sc-data-card">
                                            <div className="sc-card-header">
                                                <span>Nearest Hospitals</span>
                                                <Hospital size={16} />
                                            </div>
                                            <div className="sc-card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                                {m.results.hospitals.map(hosp => (
                                                    <div key={hosp._id} style={{ padding: '0.75rem', background: 'hsl(var(--muted)/0.3)', borderRadius: '0.75rem', border: '1px solid hsl(var(--border)/0.5)' }}>
                                                        <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>{hosp.name}</div>
                                                        <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))' }}>{hosp.address}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Streaming / Loading States */}
                        {isStreaming && (
                            <div className="sc-row sc-row--bot">
                                <div className="sc-bubble sc-bubble--bot">
                                    <RichText text={streamingText} />
                                    <span style={{ display: 'inline-block', width: '2px', height: '1em', background: 'hsl(var(--primary))', marginLeft: '4px', animation: 'blink 1s infinite' }} />
                                </div>
                            </div>
                        )}

                        {loading && !isStreaming && (
                            <div className="sc-row sc-row--bot">
                                <div className="sc-bubble sc-bubble--bot" style={{ padding: '0.75rem 1.25rem' }}>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        {[0, 0.2, 0.4].map(d => (
                                            <div key={d} style={{ width: '6px', height: '6px', background: 'hsl(var(--primary))', borderRadius: '50%', animation: 'bounce 1s infinite', animationDelay: `${d}s` }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Input Area */}
                    <div className="sc-bottom-container">
                        {showStarters && (
                            <div className="sc-starter-row">
                                {[
                                    "Severe headache for 2 days",
                                    "Stomach cramps & nausea",
                                    "Sudden skin rash",
                                    "Feeling breathless"
                                ].map(s => (
                                    <button key={s} className="sc-starter" onClick={() => handleSend(s)}>{s}</button>
                                ))}
                            </div>
                        )}

                        <div className="sc-input-wrapper">
                            <input
                                ref={inputRef}
                                type="text"
                                className="sc-input"
                                placeholder={isEmergency ? "Emergency: Call local medical services" : "Tell me your symptoms..."}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                                disabled={loading || isEmergency}
                            />
                            <button
                                className="sc-send-btn"
                                onClick={() => handleSend()}
                                disabled={loading || !input.trim() || isEmergency}
                            >
                                <Send size={20} />
                            </button>
                        </div>

                        {inputError && (
                            <div style={{ color: 'hsl(var(--destructive))', fontSize: '0.8rem', fontWeight: 700, textAlign: 'center', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <ShieldAlert size={14} /> {inputError}
                            </div>
                        )}
                        
                        <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))', textAlign: 'center', marginTop: '1rem', fontStyle: 'italic' }}>
                            Notice: Swasthya AI is for information only. For clinical diagnosis, consult a doctor.
                        </div>
                    </div>
                </div>

                {/* Right Area: Sidebar Instructions */}
                <aside className="sc-sidebar">
                    <div className="sc-sidebar-section">
                        <h3 className="sc-sidebar-title"><Activity size={14} /> How to Use Swasthya AI</h3>
                        <div className="sc-instruction-item">
                            <div className="sc-instruction-icon">1</div>
                            <p><strong>Describe Symptoms:</strong> Tell the AI what you're feeling in simple words.</p>
                        </div>
                        <div className="sc-instruction-item">
                            <div className="sc-instruction-icon">2</div>
                            <p><strong>Provide Details:</strong> Answer the AI's questions about duration and severity.</p>
                        </div>
                        <div className="sc-instruction-item">
                            <div className="sc-instruction-icon">3</div>
                            <p><strong>Get Care:</strong> Receive a specialist recommendation and book an appointment.</p>
                        </div>
                    </div>

                    <div className="sc-sidebar-section">
                        <h3 className="sc-sidebar-title"><CheckCircle2 size={14} /> Conversational Tips</h3>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <li className="sc-instruction-item" style={{gap: '0.5rem'}}>• Mention how long you've felt symptoms.</li>
                            <li className="sc-instruction-item" style={{gap: '0.5rem'}}>• Be specific about the location of pain.</li>
                            <li className="sc-instruction-item" style={{gap: '0.5rem'}}>• Mention any other health conditions.</li>
                        </ul>
                    </div>

                    <div className="sc-sidebar-section" style={{marginTop: 'auto'}}>
                        <div className="sc-safety-banner">
                            <h4 style={{ fontSize: '0.7rem', fontWeight: 900, color: 'hsl(var(--destructive))', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <ShieldAlert size={14} /> SAFETY FIRST
                            </h4>
                            <p style={{ fontSize: '0.75rem', color: 'hsl(var(--destructive))', opacity: 0.8, lineHeight: 1.4 }}>
                                If you are experiencing sudden chest pain or breathing issues, stop and call medical emergency services immediately.
                            </p>
                        </div>
                    </div>
                </aside>
            </div>
            
            {bookingDoctor && (
                <BookingModal 
                    doctor={bookingDoctor}
                    onClose={() => setBookingDoctor(null)}
                />
            )}

            <style>{`
                @keyframes bounce { 0%, 100% { transform: translateY(0); opacity: 0.4; } 50% { transform: translateY(-5px); opacity: 1; } }
                @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
            `}</style>
        </section>
    );
};

export default SymptomChecker;
