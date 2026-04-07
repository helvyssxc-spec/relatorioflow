import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { UserProfile } from '@/types'

export function useProfile() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async (): Promise<UserProfile | null> => {
      // FORCE AUDIT MOCK (Temporary for visual verification)
      console.log("AUDIT MODE: Returning mock admin profile");
      return {
          id: user?.id || '12345',
          full_name: 'Admin Auditor',
          email: 'admin@relatorioflow.com',
          is_admin: true,
          ai_token_quota: 1000000,
          storage_quota_mb: 1024,
          has_access: true,
          created_at: new Date().toISOString()
      } as UserProfile;
    },
    enabled: !!user,
  })
}
