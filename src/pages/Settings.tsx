import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, User, Building2, Upload, Save, Shield, BarChart3, BarChart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

const profileSchema = z.object({
  full_name: z.string().min(3, 'Nome obrigatório'),
  company_name: z.string().optional(),
  crea_cau: z.string().optional(),
  phone: z.string().optional(),
})
type ProfileForm = z.infer<typeof profileSchema>

const passwordSchema = z.object({
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})
type PasswordForm = z.infer<typeof passwordSchema>

export default function Settings() {
  const { user } = useAuth()
  const { data: profile, isLoading } = useProfile()
  const queryClient = useQueryClient()
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      full_name: profile?.full_name || '',
      company_name: profile?.company_name || '',
      crea_cau: profile?.crea_cau || '',
      phone: profile?.phone || '',
    },
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const onSaveProfile = async (data: ProfileForm) => {
    if (!user) return
    setSavingProfile(true)
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id)
    setSavingProfile(false)
    if (error) {
      toast.error('Erro ao salvar perfil')
      return
    }
    queryClient.invalidateQueries({ queryKey: ['profile'] })
    toast.success('Perfil salvo com sucesso!')
  }

  const onChangePassword = async (data: PasswordForm) => {
    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: data.password })
    setSavingPassword(false)
    if (error) {
      toast.error('Erro ao alterar senha')
      return
    }
    passwordForm.reset()
    toast.success('Senha alterada!')
  }

  const onUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo muito grande. Máximo 2MB.')
      return
    }

    setUploadingLogo(true)
    const ext = file.name.split('.').pop()
    const path = `${user.id}/logo.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('reports')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setUploadingLogo(false)
      toast.error('Erro ao enviar logo')
      return
    }

    const { data: urlData } = supabase.storage.from('reports').getPublicUrl(path)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ logo_url: urlData.publicUrl })
      .eq('id', user.id)

    setUploadingLogo(false)
    if (updateError) {
      toast.error('Erro ao salvar logo')
      return
    }
    queryClient.invalidateQueries({ queryKey: ['profile'] })
    toast.success('Logo atualizado!')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">Personalize seu perfil e empresa</p>
      </div>

      <Tabs defaultValue="perfil">
        <TabsList className={cn("grid w-full", profile?.is_admin ? "grid-cols-4" : "grid-cols-3")}>
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="senha">Senha</TabsTrigger>
          {profile?.is_admin && <TabsTrigger value="admin">Admin</TabsTrigger>}
        </TabsList>

        {/* Perfil pessoal */}
        <TabsContent value="perfil" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Dados pessoais
              </CardTitle>
              <CardDescription>
                Suas informações aparecem nos relatórios como responsável técnico.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Nome completo</Label>
                  <Input
                    placeholder="Eng. João da Silva"
                    {...profileForm.register('full_name')}
                  />
                  {profileForm.formState.errors.full_name && (
                    <p className="text-xs text-red-500">{profileForm.formState.errors.full_name.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>CREA / CAU</Label>
                  <Input
                    placeholder="Ex: 123456-D/SP ou CAU A123456-7"
                    {...profileForm.register('crea_cau')}
                  />
                  <p className="text-xs text-muted-foreground">
                    Aparece na assinatura dos relatórios técnicos.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label>Telefone / WhatsApp</Label>
                  <Input
                    placeholder="(11) 99999-9999"
                    {...profileForm.register('phone')}
                  />
                </div>

                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={savingProfile}
                >
                  {savingProfile && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" />
                  Salvar perfil
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Empresa */}
        <TabsContent value="empresa" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Dados da empresa
              </CardTitle>
              <CardDescription>
                Logo e nome da empresa aparecem no cabeçalho de todos os PDFs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo */}
              <div className="space-y-3">
                <Label>Logo da empresa</Label>
                <div className="flex items-center gap-4">
                  {profile?.logo_url ? (
                    <img
                      src={profile.logo_url}
                      alt="Logo"
                      className="w-20 h-20 object-contain rounded-xl border border-border bg-muted"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border bg-muted flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                  )}
                  <div>
                    <label className="cursor-pointer">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={uploadingLogo}
                        asChild
                      >
                        <span>
                          {uploadingLogo ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 mr-2" />
                          )}
                          {profile?.logo_url ? 'Trocar logo' : 'Enviar logo'}
                        </span>
                      </Button>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        onChange={onUploadLogo}
                      />
                    </label>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      PNG, JPG ou SVG. Máx. 2MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Nome da empresa */}
              <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Nome da empresa</Label>
                  <Input
                    placeholder="Engenharia XYZ Ltda."
                    {...profileForm.register('company_name')}
                  />
                </div>

                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={savingProfile}
                >
                  {savingProfile && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" />
                  Salvar empresa
                </Button>
              </form>

              {/* White Label Option */}
              <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                 <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                       <Label className="text-sm font-bold">Remover Marca d'água (White Label)</Label>
                       <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[9px] font-black px-1.5 py-0">PLATINUM</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Ocultar o selo "Powered by RelatórioFlow" nos PDFs exportados.</p>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase mr-2">Desativado</span>
                    <div className="w-10 h-6 bg-gray-200 rounded-full cursor-not-allowed relative">
                       <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                    </div>
                 </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin / Analytics */}
        {profile?.is_admin && (
          <TabsContent value="admin" className="mt-6">
            <Card className="border-amber-100 bg-amber-50/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-600" />
                  Painel Administrativo
                </CardTitle>
                <CardDescription>
                  Configure os scripts de rastreamento e analíticos globais.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-2">
                       <BarChart3 className="w-4 h-4" /> Umami Website ID
                    </Label>
                    <Input 
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      defaultValue={profile?.analytics_umami_id}
                      onBlur={async (e) => {
                        const val = e.target.value;
                        if (val === profile?.analytics_umami_id) return;
                        const { error } = await (supabase as any).from('profiles').update({ analytics_umami_id: val }).eq('id', user!.id);
                        if (error) toast.error('Erro ao salvar Umami ID');
                        else toast.success('Configuração Umami salva!');
                      }}
                    />
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest pl-1">Scripts de rastreamento open-source</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-2">
                       <BarChart3 className="w-4 h-4" /> Google Analytics (G-ID)
                    </Label>
                    <Input 
                      placeholder="G-XXXXXXXXXX"
                      defaultValue={profile?.analytics_ga_id}
                      onBlur={async (e) => {
                        const val = e.target.value;
                        if (val === profile?.analytics_ga_id) return;
                        const { error } = await (supabase as any).from('profiles').update({ analytics_ga_id: val }).eq('id', user!.id);
                        if (error) toast.error('Erro ao salvar GA ID');
                        else toast.success('Configuração Google Analytics salva!');
                      }}
                    />
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest pl-1">ID de acompanhamento da Google</p>
                  </div>

                  <div className="pt-4 border-t border-gray-100 mt-4 space-y-4">
                    <h4 className="text-[11px] font-black uppercase text-indigo-500 tracking-widest pl-1">Metas de Consumo (Sentinela)</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-gray-500">Cota Mensal Tokens</Label>
                          <Input 
                            type="number" 
                            defaultValue={profile?.ai_token_quota || 1000000}
                            className="bg-white rounded-xl h-10"
                            onBlur={async (e) => {
                              const val = parseInt(e.target.value);
                              if (val === profile?.ai_token_quota) return;
                              await (supabase as any).from('profiles').update({ ai_token_quota: val }).eq('id', user!.id);
                              toast.success('Cota de tokens atualizada!');
                            }}
                          />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-gray-500">Cota Storage (MB)</Label>
                          <Input 
                            type="number" 
                            defaultValue={profile?.storage_quota_mb || 1024}
                            className="bg-white rounded-xl h-10"
                            onBlur={async (e) => {
                              const val = parseInt(e.target.value);
                              if (val === profile?.storage_quota_mb) return;
                              await (supabase as any).from('profiles').update({ storage_quota_mb: val }).eq('id', user!.id);
                              toast.success('Cota de armazenamento atualizada!');
                            }}
                          />
                       </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-100/50 border border-amber-200">
                   <p className="text-xs text-amber-900 leading-relaxed font-medium">
                      <span className="font-bold underline">Atenção Admin:</span> Estes campos injetam os IDs nos componentes de analíticos globais do sistema. Certifique-se de usar IDs válidos para evitar erros de telemetria.
                   </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
