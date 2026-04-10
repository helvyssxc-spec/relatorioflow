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

type ReportType = 'diario' | 'tecnico' | 'manutencao' | 'nbr16280'

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
  const [selectedType, setSelectedType] = useState<ReportType | null>(tipoParam || 'diario')
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
      category: 'Construção & Gestão',
      items: [
        { id: 'diario', icon: ClipboardList, label: 'Diário de Obra (RDO)', desc: 'Gerencie clima, efetivo, atividades diárias e registros fotográficos' },
      ]
    }
  ]

  const handleSelect = (id: string) => {
    setSelectedType(id as ReportType);
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
                const isSelected = selectedType === t.id;
                return (
                  <button key={t.id} onClick={() => handleSelect(t.id)}
                    className={cn(
                      'group relative w-full flex items-start gap-5 p-6 rounded-[28px] border-2 text-left transition-all duration-500 overflow-hidden',
                      isSelected 
                        ? 'border-orange-500/50 bg-orange-50/80 dark:bg-orange-500/10 shadow-2xl shadow-orange-500/10 scale-[1.01]'
                        : 'border-slate-200/50 dark:border-white/5 glass hover:border-orange-500/30 hover:shadow-xl'
                    )}>
                    {isSelected && <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent pointer-events-none" />}
                    
                    <div className={cn(
                      'relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300',
                      isSelected ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-105' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-orange-500/10 group-hover:text-orange-500'
                    )}>
                      <t.icon className="w-6 h-6" />
                    </div>
                    <div className="relative z-10">
                      <p className="font-black text-foreground text-lg leading-tight tracking-tight">{t.label}</p>
                      <p className="text-muted-foreground text-sm mt-1 font-medium leading-relaxed">{t.desc}</p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-6 right-6 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-lg animate-in fade-in zoom-in">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
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
                  'flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-300 group hover:-translate-y-0.5',
                  selectedProject === p.id 
                    ? 'border-orange-500/50 bg-orange-50/50 dark:bg-orange-500/10 shadow-lg shadow-orange-500/5' 
                    : 'border-slate-200/50 dark:border-white/5 bg-card/30 glass hover:border-orange-500/30'
                )}>
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
                  selectedProject === p.id 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-orange-500 group-hover:bg-orange-500/10'
                )}>
                  <Building2 className="w-5 h-5" />
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
        className={cn(
          "w-full h-16 rounded-[20px] font-black text-[13px] uppercase tracking-[0.2em] transition-all duration-500 relative overflow-hidden group border-0",
          !selectedType || !selectedProject 
            ? "bg-muted text-muted-foreground cursor-not-allowed" 
            : "bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white shadow-xl shadow-orange-500/25 hover:shadow-2xl hover:shadow-orange-500/40 hover:-translate-y-1"
        )}
        disabled={!selectedType || !selectedProject} 
        onClick={handleContinue}
      >
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-10 transition-opacity"></div>
        <span className="relative z-10 flex items-center">
          Iniciar Relatório agora<ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </span>
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
