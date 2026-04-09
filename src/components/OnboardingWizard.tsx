import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Building2, Upload, Palette, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

const STEP_LABELS = ['Empresa', 'Logo', 'Cor']

const step1Schema = z.object({
  company_name: z.string().min(2, 'Informe o nome da empresa'),
  crea_cau: z.string().optional(),
})
type Step1Data = z.infer<typeof step1Schema>

interface OnboardingWizardProps {
  onComplete: () => void
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState('#0f2746')
  const [company, setCompany] = useState<Step1Data>({ company_name: '', crea_cau: '' })

  const { register, handleSubmit, formState: { errors } } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
  })

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleFinish = async () => {
    if (!user) return
    setSaving(true)

    try {
      let logo_url: string | undefined

      if (logoFile) {
        const ext = logoFile.name.split('.').pop()
        const path = `${user.id}/logo.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('logos')
          .upload(path, logoFile, { upsert: true, contentType: logoFile.type })

        if (!uploadErr) {
          const { data } = supabase.storage.from('logos').getPublicUrl(path)
          logo_url = data.publicUrl
        }
      }

      await supabase.from('profiles').update({
        company_name: company.company_name,
        crea_cau: company.crea_cau || null,
        primary_color: primaryColor,
        ...(logo_url ? { logo_url } : {}),
        onboarding_completed: true,
      } as any).eq('id', user.id)

      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Perfil configurado com sucesso!')
      onComplete()
    } catch {
      toast.error('Erro ao salvar configurações. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const onStep1Submit = (data: Step1Data) => {
    setCompany(data)
    setStep(1)
  }

  return (
    <Dialog open>
      <DialogContent className="max-w-md" onInteractOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl">Bem-vindo ao RelatórioFlow!</DialogTitle>
          <DialogDescription>Configure sua conta em 3 passos rápidos.</DialogDescription>
        </DialogHeader>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 my-2">
          {STEP_LABELS.map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < step ? 'bg-green-500 text-white' :
                i === step ? 'bg-blue-600 text-white' :
                'bg-gray-100 text-gray-400'
              }`}>
                {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs ${i === step ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>{label}</span>
              {i < STEP_LABELS.length - 1 && <div className="flex-1 h-px bg-gray-200" />}
            </div>
          ))}
        </div>

        {/* Step 0: Empresa */}
        {step === 0 && (
          <form onSubmit={handleSubmit(onStep1Submit)} className="space-y-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Building2 className="w-5 h-5" />
              <span className="font-medium">Dados da empresa</span>
            </div>
            <div className="space-y-1.5">
              <Label>Nome da empresa</Label>
              <Input placeholder="Ex: Silva Engenharia" {...register('company_name')}
                className={errors.company_name ? 'border-red-500' : ''} />
              {errors.company_name && <p className="text-xs text-red-500">{errors.company_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>CREA / CAU <span className="text-gray-400 text-xs">(opcional)</span></Label>
              <Input placeholder="Ex: CREA-SP 12345" {...register('crea_cau')} />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Próximo</Button>
          </form>
        )}

        {/* Step 1: Logo */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Upload className="w-5 h-5" />
              <span className="font-medium">Logo da empresa</span>
            </div>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center space-y-3">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="h-20 mx-auto object-contain rounded" />
              ) : (
                <div className="w-16 h-16 bg-gray-100 rounded-xl mx-auto flex items-center justify-center">
                  <Upload className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <label className="cursor-pointer">
                <span className="text-sm text-blue-600 hover:underline">
                  {logoPreview ? 'Trocar logo' : 'Selecionar logo'}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </label>
              <p className="text-xs text-gray-400">PNG, JPG ou SVG. Aparece nos PDFs.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>Voltar</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => setStep(2)}>
                {logoPreview ? 'Próximo' : 'Pular'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Cor */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Palette className="w-5 h-5" />
              <span className="font-medium">Cor da marca</span>
            </div>
            <p className="text-sm text-gray-500">Usada no cabeçalho dos seus PDFs.</p>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={primaryColor}
                onChange={e => setPrimaryColor(e.target.value)}
                className="w-14 h-14 rounded-xl cursor-pointer border border-gray-200"
              />
              <div>
                <p className="font-medium text-sm">{primaryColor.toUpperCase()}</p>
                <div className="w-32 h-6 rounded mt-1" style={{ backgroundColor: primaryColor }} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Voltar</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleFinish} disabled={saving}>
                {saving && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                Concluir
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
