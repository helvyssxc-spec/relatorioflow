import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrgProfile } from "@/hooks/useOrgProfile";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LifeBuoy, Plus, Send, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_BADGES: Record<string, { class: string; label: string }> = {
  aberto: { class: "bg-blue-100 text-blue-700 border-blue-200", label: "Aberto" },
  em_andamento: { class: "bg-yellow-100 text-yellow-700 border-yellow-200", label: "Em andamento" },
  resolvido: { class: "bg-green-100 text-green-700 border-green-200", label: "Resolvido" },
  fechado: { class: "bg-muted text-muted-foreground border-border", label: "Fechado" },
};

const CATEGORIES = [
  { value: "duvida", label: "Dúvida" },
  { value: "problema_tecnico", label: "Problema técnico" },
  { value: "cobranca", label: "Cobrança" },
  { value: "sugestao", label: "Sugestão" },
  { value: "outro", label: "Outro" },
];

export default function Support() {
  const { user } = useAuth();
  const { data: profile } = useOrgProfile();
  const orgId = profile?.org_id;
  const queryClient = useQueryClient();

  const [showNewTicket, setShowNewTicket] = useState(false);
  const [openTicket, setOpenTicket] = useState<any>(null);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("duvida");
  const [firstMessage, setFirstMessage] = useState("");
  const [replyText, setReplyText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["support-tickets", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from("support_tickets" as any)
        .select("*")
        .eq("org_id", orgId!)
        .order("updated_at", { ascending: false });
      return (data as any[]) || [];
    },
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["ticket-messages", openTicket?.id],
    enabled: !!openTicket?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("support_messages" as any)
        .select("*")
        .eq("ticket_id", openTicket!.id)
        .order("created_at", { ascending: true });
      // Mark admin messages as read
      if (data?.length) {
        const unread = (data as any[]).filter((m: any) => m.sender_role === "admin" && !m.read_at);
        if (unread.length) {
          for (const msg of unread) {
            await supabase.from("support_messages" as any).update({ read_at: new Date().toISOString() } as any).eq("id", msg.id);
          }
        }
      }
      return (data as any[]) || [];
    },
    refetchInterval: openTicket ? 10000 : false,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createTicketMutation = useMutation({
    mutationFn: async () => {
      const { data: ticket, error } = await supabase
        .from("support_tickets" as any)
        .insert({ org_id: orgId!, user_id: user!.id, subject, category } as any)
        .select()
        .single();
      if (error) throw error;
      await supabase.from("support_messages" as any)
        .insert({ ticket_id: (ticket as any).id, sender_id: user!.id, sender_role: "user", content: firstMessage } as any);
      return ticket;
    },
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      setShowNewTicket(false);
      setSubject("");
      setCategory("duvida");
      setFirstMessage("");
      setOpenTicket(ticket);
      toast.success("Chamado aberto com sucesso!");
    },
    onError: () => toast.error("Erro ao abrir chamado."),
  });

  const replyMutation = useMutation({
    mutationFn: async () => {
      await supabase.from("support_messages" as any)
        .insert({ ticket_id: openTicket!.id, sender_id: user!.id, sender_role: "user", content: replyText } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-messages", openTicket?.id] });
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      setReplyText("");
    },
    onError: () => toast.error("Erro ao enviar mensagem."),
  });

  const isClosed = openTicket?.status === "resolvido" || openTicket?.status === "fechado";
  const statusBadge = (status: string) => {
    const s = STATUS_BADGES[status] || STATUS_BADGES.aberto;
    return <Badge variant="outline" className={`text-xs ${s.class}`}>{s.label}</Badge>;
  };

  return (
    <AppLayout title="Suporte">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Suporte</h1>
            <p className="text-muted-foreground mt-1">Envie suas dúvidas e acompanhe seus chamados</p>
          </div>
          <Button onClick={() => setShowNewTicket(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Novo chamado
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />)}</div>
        ) : tickets.length === 0 ? (
          <Card className="p-12 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <LifeBuoy className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Nenhum chamado aberto</p>
              <p className="text-sm text-muted-foreground mt-1">Abra seu primeiro chamado para falar com nossa equipe.</p>
            </div>
            <Button onClick={() => setShowNewTicket(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Abrir chamado
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {tickets.map((t: any) => (
              <Card key={t.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setOpenTicket(t)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <MessageSquare className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{t.subject}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-muted-foreground">#{t.ticket_number}</span>
                          <Badge variant="secondary" className="text-xs">{CATEGORIES.find(c => c.value === t.category)?.label || t.category}</Badge>
                          {statusBadge(t.status)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(t.updated_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* New Ticket Dialog */}
      <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo chamado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Assunto</Label>
              <Input placeholder="Descreva brevemente o problema" value={subject} onChange={e => setSubject(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descrição detalhada</Label>
              <Textarea placeholder="Explique o que aconteceu com o máximo de detalhes..." className="min-h-[120px]" value={firstMessage} onChange={e => setFirstMessage(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewTicket(false)}>Cancelar</Button>
              <Button onClick={() => createTicketMutation.mutate()} disabled={!subject.trim() || !firstMessage.trim() || createTicketMutation.isPending}>
                {createTicketMutation.isPending ? "Abrindo..." : "Abrir chamado"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Conversation Dialog */}
      <Dialog open={!!openTicket} onOpenChange={() => setOpenTicket(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0">
          {openTicket && (
            <>
              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{openTicket.subject}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">#{openTicket.ticket_number}</span>
                      {statusBadge(openTicket.status)}
                    </div>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 px-6 py-4">
                <div className="space-y-3">
                  {messages.map((m: any) => (
                    <div key={m.id} className={`flex ${m.sender_role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-xl px-4 py-2.5 ${m.sender_role === "user" ? "bg-primary text-primary-foreground" : "bg-muted border border-border"}`}>
                        {m.sender_role === "admin" && (
                          <p className="text-xs font-medium text-primary mb-1">Equipe RelatórioFlow</p>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                        <p className={`text-[10px] mt-1 ${m.sender_role === "user" ? "text-primary-foreground/60" : "text-muted-foreground/60"}`}>
                          {formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {isClosed ? (
                <div className="px-6 py-3 border-t border-border bg-muted/30 text-center">
                  <p className="text-sm text-muted-foreground">Este chamado foi {openTicket.status === "resolvido" ? "resolvido" : "fechado"}.</p>
                </div>
              ) : (
                <div className="px-6 py-3 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && replyText.trim()) { e.preventDefault(); replyMutation.mutate(); } }}
                    />
                    <Button size="icon" onClick={() => replyMutation.mutate()} disabled={!replyText.trim() || replyMutation.isPending}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}