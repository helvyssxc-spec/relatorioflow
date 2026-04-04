import { useState, useEffect } from "react";
import { Bell, FileText, Users, AlertTriangle, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover, PopoverContent, PopoverTrigger
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRetentionWarning } from "@/hooks/useRetentionWarning";
import { useNavigate } from "react-router-dom";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  metadata: Record<string, any>;
}

const typeIcons: Record<string, typeof FileText> = {
  report: FileText,
  team: Users,
  plan: AlertTriangle,
  warning: AlertTriangle,
  info: Bell,
};

export function NotificationBell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const retention = useRetentionWarning();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return (data as unknown as Notification[]) || [];
    },
    refetchInterval: 30000,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, queryClient]);

  // Synthetic retention notification
  const retentionNotif: Notification[] = retention.hasWarning ? [{
    id: "retention-warning",
    type: "warning",
    title: retention.oldestDaysRemaining === 0
      ? "Relatório expira hoje!"
      : retention.oldestDaysRemaining === 1
      ? "Relatório expira amanhã!"
      : `${retention.expiringReports.length} relatório${retention.expiringReports.length > 1 ? "s expiram" : " expira"} em breve`,
    message: `Acesse o Histórico e baixe os PDFs antes que sejam removidos automaticamente.`,
    read: false,
    created_at: new Date().toISOString(),
    metadata: {},
  }] : [];

  const allNotifications = [...retentionNotif, ...notifications];
  const unreadCount = allNotifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    if (id === "retention-warning") {
      navigate("/reports");
      setOpen(false);
      return;
    }
    await supabase.from("notifications" as any).update({ read: true } as any).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    const ids = unread.map(n => n.id);
    await supabase.from("notifications").update({ read: true }).in("id", ids);
    queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
  };

  const deleteNotification = async (id: string) => {
    if (id === "retention-warning") return;
    await supabase.from("notifications" as any).delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground rounded-full text-[10px] font-bold flex items-center justify-center px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">Notificações</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
              <Check className="h-3 w-3 mr-1" /> Marcar tudo
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {allNotifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              Nenhuma notificação
            </div>
          ) : (
            allNotifications.map(n => {
              const Icon = typeIcons[n.type] || Bell;
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 cursor-pointer hover:bg-accent/50 transition-colors group ${!n.read ? "bg-primary/5" : ""}`}
                  onClick={() => markAsRead(n.id)}
                >
                  <div className={`mt-0.5 rounded-full p-1.5 ${n.type === "report" ? "bg-primary/10 text-primary" : n.type === "team" ? "bg-green-500/10 text-green-600" : n.type === "warning" ? "bg-amber-500/10 text-amber-600" : n.type === "plan" ? "bg-amber-500/10 text-amber-600" : "bg-muted text-muted-foreground"}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-tight ${!n.read ? "font-medium" : ""}`}>{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  <Button
                    variant="ghost" size="icon" className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            })
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
