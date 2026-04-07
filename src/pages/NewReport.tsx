import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  ClipboardList, FileText, Plus, ChevronRight, Building2, 
  Loader2, Settings, Shield, BarChart, CheckCircle2, ChevronLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type ReportType = 'diario' | 'tecnico' | 'manutencao'

const projectSchema = z.object({
  name: z.string().min(3, 'Nome da obra obrigatório'),
  address: z.string().optional(),
  client_name: z.string().optional(),
  art_rrt: z.string().optional(),
})
type ProjectForm = z.infer<typeof projectSchema>

function useProjects() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects').select('*')
        .eq('user_id', user!.id).eq('is_active', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user,
  })
}

export default function NewReport() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const tipoParam = searchParams.get('tipo') as ReportType | null
  const [selectedType, setSelectedType] = useState<ReportType | null>(tipoParam)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [showNewProject, setShowNewProject] = useState(false)

  const { data: projects = [], isLoading: loadingProjects } = useProjects()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
  })

  const createProject = useMutation({
    mutationFn: async (data: ProjectForm) => {
      // Forçamos a tipagem para garantir que 'name' e 'user_id' sejam reconhecidos como obrigatórios
      const payload = {
        name: data.name,
        user_id: user!.id,
        address: data.address || null,
        client_name: data.client_name || null,
        art_rrt: data.art_rrt || null,
        is_active: true
      };

      const { data: proj, error } = await supabase
        .from('projects')
        .insert([payload])
        .select()
        .single();
        
      if (error) throw error;
      return proj;
    },
    onSuccess: (proj) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setSelectedProject(proj.id)
      setShowNewProject(false)
      reset()
      toast.success('Obra criada!')
    },
    onError: () => toast.error('Erro ao criar obra'),
  })

  const handleContinue = () => {
    if (!selectedType || !selectedProject) {
      toast.error('Selecione o tipo de relatório e a obra')
      return
    }
    navigate(`/app/relatorio/novo/${selectedType}?project=${selectedProject}`)
  }

  const catalog = [
    { 
      category: 'Construção & Engenharia',
      items: [
        { id: 'diario', icon: ClipboardList, label: 'Diário de Obra (RDO)', desc: 'Clima, efetivo, atividades e fotos' },
        { id: 'tecnico', icon: FileText, label: 'Relatório Técnico', desc: 'Vistoria, parecer ou inspeção técnica' },
        { id: 'NBR16280', icon: Shield, label: 'Laudo de Reforma', desc: 'Conformidade com ABNT NBR 16280' },
        { id: 'medicao', icon: BarChart, label: 'Medição de Obra', desc: 'Acompanhamento de evolução e custos' },
      ]
    },
    { 
      category: 'Manutenção & Sistemas',
      items: [
        { id: 'manutencao', icon: Settings, label: 'Manutenção Geral', desc: 'Preventiva ou Corretiva de sistemas' },
        { id: 'inspecao_predial', icon: Building2, label: 'Inspeção Predial', desc: 'Avaliação de conservação e sistemas' },
        { id: 'eletrica', icon: Plus, label: 'Laudo Elétrico / SPDA', desc: 'Inspeção de infraestrutura elétrica' },
        { id: 'ar_condicionado', icon: Settings, label: 'PMOC - Ar Condicionado', desc: 'Plano de Manutenção e Operação' },
      ]
    },
    { 
      category: 'Vistorias & Perícias',
      items: [
        { id: 'vizinhanca', icon: Building2, label: 'Vistoria de Vizinhança', desc: 'Cautelar e registro de danos prévios' },
        { id: 'entrega_obra', icon: CheckCircle2, label: 'Entrega de Obra', desc: 'Checklist para recebimento de chaves' },
        { id: 'pericia', icon: Shield, label: 'Perícia Judicial', desc: 'Laudo pericial com rigor normativo' },
        { id: 'memorial', icon: ClipboardList, label: 'Memorial Descritivo', desc: 'Especificações técnicas de materiais' },
      ]
    }
  ]

  const handleSelect = (id: string) => {
    if (id === 'diario' || id === 'manutencao') {
      setSelectedType(id as ReportType);
    } else {
      setSelectedType('tecnico');
    }
  }

  return (
    <div className="max-w-3xl space-y-10 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full -ml-2">
               <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl font-black text-foreground tracking-tight">Novo Relatório</h1>
          </div>
          <p className="text-muted-foreground font-medium pl-1">Selecione o modelo ideal para seu laudo técnico</p>
        </div>
      </div>

      <div className="space-y-8">
        {catalog.map((cat) => (
          <div key={cat.category} className="space-y-4">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 pl-1">{cat.category}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cat.items.map((t) => {
                const isSelected = selectedType === t.id || (t.id !== 'diario' && t.id !== 'manutencao' && selectedType === 'tecnico');
                return (
                  <button key={t.id} onClick={() => handleSelect(t.id)}
                    className={cn(
                      'group flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-300',
                      isSelected 
                        ? 'border-primary bg-primary/[0.03] shadow-lg shadow-primary/5'
                        : 'border-border/40 bg-card/50 hover:border-primary/40 hover:bg-card'
                    )}>
                    <div className={cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-active:scale-95',
                      isSelected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                    )}>
                      <t.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-[14px] leading-tight">{t.label}</p>
                      <p className="text-muted-foreground text-[11px] mt-1 font-medium leading-relaxed">{t.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-black uppercase tracking-wider text-foreground">2. Vincular à Obra / Projeto</p>
          <Button variant="ghost" size="sm" onClick={() => setShowNewProject(true)} className="text-primary hover:text-primary hover:bg-primary/5 font-bold">
            <Plus className="w-4 h-4 mr-1" />Nova obra
          </Button>
        </div>

        {loadingProjects ? (
          <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}</div>
        ) : projects.length === 0 ? (
          <Card className="border-dashed border-2 bg-transparent">
            <CardContent className="p-10 text-center">
              <Building2 className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm font-medium">Nenhum projeto cadastrado</p>
              <Button variant="outline" size="sm" className="mt-4 font-bold" onClick={() => setShowNewProject(true)}>
                Criar primeiro projeto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {projects.map((p: any) => (
              <button key={p.id} onClick={() => setSelectedProject(p.id)}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all',
                  selectedProject === p.id ? 'border-primary bg-primary/[0.03]' : 'border-border/40 bg-card/30 hover:border-muted-foreground/30'
                )}>
                <div className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                  selectedProject === p.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                )}>
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-sm truncate">{p.name}</p>
                  {p.address && <p className="text-muted-foreground text-[11px] truncate opacity-70">{p.address}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Button 
        size="lg"
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-13 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]" 
        disabled={!selectedType || !selectedProject} 
        onClick={handleContinue}
      >
        Iniciar Relatório agora<ChevronRight className="ml-2 w-5 h-5" />
      </Button>

      <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader><DialogTitle className="text-xl font-black">Novo projeto de obra</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit((d) => createProject.mutate(d))} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Nome da obra *</Label>
              <Input placeholder="Ex: Edifício Riviera — Bloco A" {...register('name')} className={cn("h-11 rounded-xl", errors.name && 'border-red-500')} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Endereço</Label>
              <Input placeholder="Rua, número, bairro" {...register('address')} className="h-11 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Cliente</Label>
                <Input placeholder="Construtora XYZ" {...register('client_name')} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">ART / RRT</Label>
                <Input placeholder="Número" {...register('art_rrt')} className="h-11 rounded-xl" />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => { setShowNewProject(false); reset() }} className="font-bold">Cancelar</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 font-black rounded-xl px-8" disabled={createProject.isPending}>
                {createProject.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Criar Obra'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
