import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function AiChat() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Chào nàng! ✨ Mình là trợ lý thời trang thông minh Vestra đây. Nàng đang tìm trang phục cho dịp nào thế? Hãy chia sẻ để mình gợi ý những combo hợp nhất cho nàng nha! 👗💖',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll to the bottom of the chat list
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { id: `msg_${Date.now()}`, sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Build brief history matching controllers expect:
      // Array<{ sender: 'user'|'assistant', text: string }>
      const history = messages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      let data;
      try {
        data = await api.post('/chat', { message: userMsg.text, history });
      } catch (err) {
        console.warn("⚠️ API Chat Error, using mock fallback response", err);
        // Fallback demo response
        data = {
          reply: `Ái chà, gu thời trang của nàng cá tính quá đi! ✨ Với phong cách đó, mình khuyên nàng thử phối em Áo thun Y2K Baby Tee cực hot bên mình cùng Chân váy bò túi hộp xẻ tà năng động nha. Nàng có thể vào mục "Thử đồ 3D" để ướm thử trực quan ngay lập tức đấy! 💖`
        };
      }

      setMessages((prev) => [
        ...prev,
        { id: `reply_${Date.now()}`, sender: 'assistant', text: data.reply },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: `err_${Date.now()}`, sender: 'assistant', text: 'Hệ thống AI đang quá tải. Nàng vui lòng thử lại sau chút nha!' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4 h-[calc(100vh-140px)] flex flex-col">
      
      {/* Title Header */}
      <div className="flex items-center gap-3 border-b border-brand-100 dark:border-slate-800 pb-4 shrink-0">
        <div className="w-10 h-10 bg-brand-500 text-white rounded-2xl flex items-center justify-center shadow-md">
          <Sparkles size={20} className="animate-pulse" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-brand-900 dark:text-slate-100 leading-tight">Trợ Lý Ảo Vestra AI</h1>
          <p className="text-xs text-brand-400 dark:text-slate-400">Tư vấn phong cách thời trang, gợi ý size và phối đồ Gen Z</p>
        </div>
      </div>

      {/* Messages Window */}
      <div className="flex-grow bg-white dark:bg-slate-900 border border-brand-100 dark:border-slate-800/80 rounded-3xl p-5 md:p-6 overflow-y-auto space-y-4 shadow-inner">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
            
            {/* Avatar Bubble */}
            <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white ${msg.sender === 'user' ? 'bg-indigo-500' : 'bg-brand-500'}`}>
              {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>

            {/* Bubble Bubble */}
            <div className={`rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${msg.sender === 'user' ? 'bg-indigo-500 text-white rounded-tr-none' : 'bg-brand-50/50 dark:bg-slate-950/40 text-brand-900 dark:text-slate-100 border border-brand-100 dark:border-slate-800 rounded-tl-none'}`}>
              {msg.text}
            </div>

          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex gap-3 max-w-[80%] mr-auto items-center animate-pulse">
            <div className="w-8 h-8 rounded-full bg-brand-200 dark:bg-slate-800 shrink-0 flex items-center justify-center text-brand-400 dark:text-slate-500">
              <Bot size={14} />
            </div>
            <div className="bg-brand-50 dark:bg-slate-950/40 border border-brand-100 dark:border-slate-800 rounded-2xl rounded-tl-none p-4 text-xs text-brand-400 dark:text-slate-400 italic">
              Vestra đang tìm sản phẩm phù hợp...
            </div>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>

      {/* Input Box form */}
      <form onSubmit={handleSend} className="bg-white dark:bg-slate-900 border border-brand-100 dark:border-slate-800/80 rounded-2xl p-2 shadow-sm flex items-center gap-2 shrink-0">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Nhập câu hỏi của bạn (Ví dụ: mình cao 1m6 mặc gì đi biển tôn dáng)..." className="flex-grow bg-transparent text-brand-900 dark:text-slate-100 pl-4 pr-2 py-3 text-sm focus:outline-none placeholder-brand-300 dark:placeholder-slate-550" disabled={loading} />
        <button type="submit" disabled={loading || !input.trim()} className="p-3 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-200 text-white rounded-xl shadow-md transition-all shrink-0">
          <Send size={16} />
        </button>
      </form>

    </div>
  );
}
