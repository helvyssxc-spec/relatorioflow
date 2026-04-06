import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ClipboardList, FileText, Plus, ChevronRight, Building2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type ReportType = 'diario' | 'tecnico'

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
      const { data: proj, error } = await (supabase as any)
        .from('projects').insert({ ...data, user_id: user!.id }).select().single()
      if (error) throw error
      return proj
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

  const types = [
    { id: 'diario' as ReportType, icon: ClipboardList, label: 'Diário de Obra', desc: 'Registro diário — clima, efetivo, atividades e fotos', color: 'blue' },
    { id: 'tecnico' as ReportType, icon: FileText, label: 'Relatório Técnico', desc: 'Laudo, vistoria, parecer ou inspeção técnica', color: 'indigo' },
  ]

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Novo Relatório</h1>
        <p className="text-muted-foreground mt-1">Escolha o tipo e a obra para começar</p>
      </div>

      {/* Tipo */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-3">1. Tipo de relatório</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {types.map((t) => (
            <button key={t.id} onClick={() => setSelectedType(t.id)}
              className={cn(
                'flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all',
                selectedType === t.id
                  ? t.color === 'blue' ? 'border-blue-600 bg-blue-50' : 'border-indigo-600 bg-indigo-50'
                  : 'border-border bg-card hover:border-muted-foreground/30'
              )}>
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                selectedType === t.id
                  ? t.color === 'blue' ? 'bg-blue-600 text-white' : 'bg-indigo-600 text-white'
                  : 'bg-muted text-muted-foreground'
              )}>
                <t.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{t.label}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{t.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Projeto */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-foreground">2. Obra / Projeto</p>
          <Button variant="ghost" size="sm" onClick={() => setShowNewProject(true)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
            <Plus className="w-4 h-4 mr-1" />Nova obra
          </Button>
        </div>

        {loadingProjects ? (
          <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}</div>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Nenhuma obra cadastrada ainda</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowNewProject(true)}>
                <Plus className="w-4 h-4 mr-1" />Criar primeira obra
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {projects.map((p: any) => (
              <button key={p.id} onClick={() => setSelectedProject(p.id)}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all',
                  selectedProject === p.id ? 'border-blue-600 bg-blue-50' : 'border-border bg-card hover:border-muted-foreground/30'
                )}>
                <div className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                  selectedProject === p.id ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'
                )}>
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{p.name}</p>
                  {p.address && <p className="text-muted-foreground text-xs truncate">{p.address}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Button className="w-full bg-blue-600 hover:bg-blue-700 h-11" disabled={!selectedType || !selectedProject} onClick={handleContinue}>
        Continuar<ChevronRight className="ml-2 w-4 h-4" />
      </Button>

      {/* Modal nova obra */}
      <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova obra / projeto</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit((d) => createProject.mutate(d))} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome da obra *</Label>
              <Input id="name" placeholder="Ex: Edifício Riviera — Bloco A" {...register('name')} className={errors.name ? 'border-red-500' : ''} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Endereço</Label>
              <Input id="address" placeholder="Rua, número, bairro" {...register('address')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client_name">Nome do cliente</Label>
              <Input id="client_name" placeholder="Construtora XYZ" {...register('client_name')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="art_rrt">ART / RRT</Label>
              <Input id="art_rrt" placeholder="Número da ART ou RRT" {...register('art_rrt')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowNewProject(false); reset() }}>Cancelar</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createProject.isPending}>
                {createProject.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar obra
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
