import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Lock, Chrome, Mail, ArrowRight, Rocket } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BrandPanel from "@/components/BrandPanel";
import { Separator } from "@/components/ui/separator";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Entrar na Conta | RelatórioFlow";
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
    } else {
      navigate("/dashboard");
    }
  };

  const handleGoogleLogin = async () => {
    setSocialLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      }
    });

    if (error) {
      if (error.message.includes("provider is not enabled")) {
        toast({ 
          title: "Configuração Pendente", 
          description: "O login com Google precisa ser ativado no Dashboard do Supabase pelo administrador.", 
          variant: "destructive" 
        });
      } else {
        toast({ title: "Erro no Login Social", description: error.message, variant: "destructive" });
      }
      setSocialLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0A0B14] selection:bg-blue-500/20 relative overflow-hidden">
      {/* Animated Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none delay-1000" />
      
      <BrandPanel />
      
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent pointer-events-none" />

        <div className="w-full max-w-md space-y-8 relative z-10 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
          <div className="text-center space-y-4">
            <div className="lg:hidden flex flex-col items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20 rotate-3">
                <Rocket className="h-6 w-6" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-white">RelatórioFlow</span>
            </div>

            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-white tracking-tight">Bem-vindo de volta</h1>
              <p className="text-gray-500 font-medium">Acesse sua central de inteligência técnica</p>
            </div>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/5 p-8 shadow-2xl space-y-6">
            
            {/* Social Login */}
            <Button 
              variant="outline" 
              className="w-full h-12 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-gray-200 transition-all font-semibold gap-3 group relative overflow-hidden shadow-lg hover:shadow-blue-500/10 hover:scale-[1.01] active:scale-[0.99]"
              onClick={handleGoogleLogin}
              disabled={socialLoading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <Chrome className="h-5 w-5 text-blue-400" />
              Continuar com Google
            </Button>

            <div className="flex items-center gap-4 py-2">
              <Separator className="flex-1 bg-white/10" />
              <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest leading-none">OU E-MAIL</span>
              <Separator className="flex-1 bg-white/10" />
            </div>

            <form className="space-y-5" onSubmit={handleLogin}>
              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-gray-400 font-semibold text-xs uppercase tracking-wider">E-mail Corporativo</Label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="ex: voce@empresa.com.br" 
                    className="h-12 pl-10 bg-white/5 border-white/10 focus-visible:border-blue-500/50 transition-all text-white placeholder:text-gray-700" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-gray-400 font-semibold text-xs uppercase tracking-wider">Senha</Label>
                  <Link to="/forgot-password" title="Recuperar acesso" className="text-[11px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-tighter transition-colors">Esqueceu a senha?</Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="h-12 pl-10 pr-10 bg-white/5 border-white/10 focus-visible:border-blue-500/50 transition-all text-white placeholder:text-gray-700" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-blue-400 transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all gap-2" disabled={loading}>
                {loading ? "Autenticando..." : "Entrar na plataforma"}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </form>
          </div>

          <div className="text-center space-y-4">
            <p className="text-sm text-gray-500">
              Novo no RelatórioFlow?{" "}
              <Link to="/register" className="text-blue-400 font-bold hover:text-blue-300 transition-colors underline underline-offset-4">Criar conta analista grátis</Link>
            </p>
            <div className="flex items-center justify-center gap-6 opacity-30 grayscale saturate-0 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
              <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400">CERTIFIED SECURITY</span>
              <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400">ABNT COMPLIANT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;