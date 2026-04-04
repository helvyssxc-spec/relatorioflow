import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Users, Mail, Lock, User, Briefcase, Chrome, ArrowRight, Rocket } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BrandPanel from "@/components/BrandPanel";
import { Separator } from "@/components/ui/separator";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const inviteToken = searchParams.get("invite");
  const [inviteData, setInviteData] = useState<any>(null);
  const [loadingInvite, setLoadingInvite] = useState(!!inviteToken);

  useEffect(() => {
    document.title = "Criar Conta | RelatórioFlow";
    if (!inviteToken) return;
    
    const loadInvite = async () => {
      setLoadingInvite(true);
      const { data, error } = await supabase
        .from("team_invitations" as any)
        .select("*, organizations:org_id(name)")
        .eq("token", inviteToken)
        .eq("status", "pending")
        .single();
      if (!error && data) {
        setInviteData(data);
        setEmail((data as any).email || "");
      }
      setLoadingInvite(false);
    };
    loadInvite();
  }, [inviteToken]);

  const [honeypot, setHoneypot] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) {
      console.log("Bot detected via honeypot");
      return; // Silent fail for bots
    }
    if (!accepted) return;
    if (password !== confirmPassword) {
      toast({ title: "Senhas não coincidem", description: "Verifique e tente novamente.", variant: "destructive" });
      return;
    }
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, company_name: inviteData ? "" : company },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    toast({ title: "Conta criada!", description: inviteData ? `Bem-vindo à equipe ${(inviteData as any).organizations?.name || ""}!` : "Bem-vindo ao RelatórioFlow!" });
    setLoading(false);
    navigate(inviteData ? "/dashboard" : "/onboarding");
    window.umami?.track("cadastro_completo");
  };

  const handleGoogleSignup = async () => {
    setSocialLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/onboarding`,
      }
    });

    if (error) {
      if (error.message.includes("provider is not enabled")) {
        toast({ 
          title: "Configuração Pendente", 
          description: "O cadastro com Google precisa ser ativado no Dashboard do Supabase pelo administrador.", 
          variant: "destructive" 
        });
      } else {
        toast({ title: "Erro no Cadastro Social", description: error.message, variant: "destructive" });
      }
      setSocialLoading(false);
    }
  };

  const isInvite = !!inviteData;
  const orgName = (inviteData as any)?.organizations?.name;

  return (
    <div className="min-h-screen flex bg-[#0A0B14] selection:bg-blue-500/20">
      <BrandPanel />
      
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-lg space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500 py-12">
          <div className="text-center space-y-4">
            <div className="lg:hidden flex flex-col items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20 rotate-3">
                <Rocket className="h-6 w-6" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-white">RelatórioFlow</span>
            </div>

            <div className="space-y-1">
              {isInvite ? (
                <>
                  <Badge variant="outline" className="gap-1.5 text-xs px-3 py-1 border-blue-500/50 text-blue-400 bg-blue-500/5">
                    <Users className="h-3.5 w-3.5" /> Convite de equipe
                  </Badge>
                  <h1 className="text-3xl font-bold text-white tracking-tight">Junte-se à {orgName || "equipe"}</h1>
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-white tracking-tight">Comece grátis agora</h1>
                  <p className="text-gray-500 font-medium whitespace-nowrap">Junte-se a +500 engenheiros que usam IA Pericial</p>
                </>
              )}
            </div>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/5 p-8 shadow-2xl space-y-6">
            
            {/* Social Signup */}
            {!isInvite && (
              <>
                <Button 
                  variant="outline" 
                  className="w-full h-12 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-gray-200 transition-all font-semibold gap-3"
                  onClick={handleGoogleSignup}
                  disabled={socialLoading}
                >
                  <Chrome className="h-5 w-5 text-blue-400" />
                  Criar conta com Google
                </Button>

                <div className="flex items-center gap-4 py-1">
                  <Separator className="flex-1 bg-white/10" />
                  <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest leading-none">OU DADOS MANUAIS</span>
                  <Separator className="flex-1 bg-white/10" />
                </div>
              </>
            )}

            {loadingInvite ? (
              <div className="text-center py-12 text-gray-500 animate-pulse font-medium">Verificando convite...</div>
            ) : (
              <form className="space-y-5" onSubmit={handleRegister}>
                {/* Honeypot field for bot protection */}
                <div style={{ display: 'none' }} aria-hidden="true">
                  <input
                    type="text"
                    name="website_url"
                    tabIndex={-1}
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    autoComplete="off"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2.5">
                    <Label htmlFor="name" className="text-gray-400 font-semibold text-xs uppercase tracking-wider">Nome Completo</Label>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                      <Input 
                        id="name" 
                        placeholder="Ex: João Silva" 
                        className="h-12 pl-10 bg-white/5 border-white/10 focus-visible:border-blue-500/50 transition-all text-white" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <Label htmlFor="email" className="text-gray-400 font-semibold text-xs uppercase tracking-wider">E-mail Profissional</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="voce@empresa.com" 
                        className="h-12 pl-10 bg-white/5 border-white/10 focus-visible:border-blue-500/50 transition-all text-white disabled:opacity-50" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                        disabled={isInvite}
                      />
                    </div>
                  </div>
                </div>

                {!isInvite && (
                  <div className="space-y-2.5">
                    <Label htmlFor="company" className="text-gray-400 font-semibold text-xs uppercase tracking-wider">Nome da Empresa (Opcional)</Label>
                    <div className="relative group">
                      <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                      <Input 
                        id="company" 
                        placeholder="Sua Engenharia Ltda" 
                        className="h-12 pl-10 bg-white/5 border-white/10 focus-visible:border-blue-500/50 transition-all text-white" 
                        value={company} 
                        onChange={(e) => setCompany(e.target.value)} 
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2.5">
                    <Label htmlFor="password" className="text-gray-400 font-semibold text-xs uppercase tracking-wider">Senha</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                      <Input 
                        id="password" 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        className="h-12 pl-10 pr-10 bg-white/5 border-white/10 focus-visible:border-blue-500/50 transition-all text-white" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        minLength={6}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-blue-400 transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <Label htmlFor="confirm-password" className="text-gray-400 font-semibold text-xs uppercase tracking-wider">Confirmar Senha</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                      <Input 
                        id="confirm-password" 
                        type="password" 
                        placeholder="••••••••" 
                        className="h-12 pl-10 bg-white/5 border-white/10 focus-visible:border-blue-500/50 transition-all text-white" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        required 
                        minLength={6}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <Checkbox 
                    id="terms" 
                    checked={accepted} 
                    onCheckedChange={(v) => setAccepted(v === true)} 
                    className="mt-1 border-white/20 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" 
                  />
                  <label htmlFor="terms" className="text-xs text-gray-500 leading-relaxed font-medium">
                    Ao criar sua conta, você concorda com os{" "}
                    <Link to="/terms" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">Termos de Uso</Link>{" "}e{" "}
                    <Link to="/privacy" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">Política de Privacidade</Link>.
                  </label>
                </div>

                <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all gap-2" disabled={!accepted || loading}>
                  {loading ? "Criando acesso..." : isInvite ? "Aceitar convite e entrar" : "Criar minha conta grátis"}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </form>
            )}
          </div>

          <p className="text-center text-sm text-gray-500">
            Deseja entrar em uma conta existente?{" "}
            <Link to="/login" className="text-blue-400 font-bold hover:text-blue-300 transition-colors underline underline-offset-4">Fazer login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;