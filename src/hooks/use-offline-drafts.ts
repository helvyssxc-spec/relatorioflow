import { useState, useEffect, useCallback } from "react";
import { getDraft, saveDraft, deleteDraft } from "@/lib/offline-db";
import { toast } from "sonner";

/**
 * 📝 Hook to manage offline report drafts in IndexedDB.
 */
export function useOfflineDrafts(draftId: string) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Load draft on mount
  const loadDraft = useCallback(async () => {
    try {
      const data = await getDraft(draftId);
      return data?.data || null;
    } catch (error) {
      console.error("Failed to load offline draft:", error);
      return null;
    }
  }, [draftId]);

  // Persist draft with debounce (handled by the component using this hook)
  const persistDraft = useCallback(async (data: any) => {
    setIsSaving(true);
    try {
      await saveDraft(draftId, data);
      setLastSaved(new Date().toISOString());
    } catch (error) {
      console.error("Failed to save offline draft:", error);
    } finally {
      setIsSaving(false);
    }
  }, [draftId]);

  // Clear draft
  const clearDraft = useCallback(async () => {
    try {
      await deleteDraft(draftId);
      setLastSaved(null);
    } catch (error) {
      console.error("Failed to delete offline draft:", error);
    }
  }, [draftId]);

  return {
    isSaving,
    lastSaved,
    loadDraft,
    persistDraft,
    clearDraft
  };
}
