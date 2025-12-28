
import React, { useState } from 'react';

interface LoginFormProps {
  onLogin: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') onLogin();
    else { setError(true); setTimeout(() => setError(false), 2000); }
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-12 border border-slate-100 shadow-2xl max-w-md mx-auto text-center">
      <div className="w-20 h-20 bg-[#F9F4ED] rounded-3xl flex items-center justify-center mx-auto mb-8 text-[#A61919]">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
          <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
        </svg>
      </div>
      <h2 className="text-3xl font-bold text-slate-800 mb-2">Acesso Restrito</h2>
      <p className="text-slate-400 text-sm font-medium mb-10">Identificação administrativa Matelli</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <input 
          type="password"
          placeholder="SENHA"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className={`w-full bg-[#F9F4ED] border-2 rounded-2xl px-6 py-5 outline-none transition-all text-center font-black tracking-[0.5em] ${error ? 'border-red-500 animate-shake' : 'border-transparent focus:border-[#A61919]'}`}
        />
        <button type="submit" className="w-full bg-[#A61919] text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-[#A61919]/20 hover:scale-105 transition-all">ENTRAR NO PAINEL</button>
      </form>
    </div>
  );
};

export default LoginForm;
