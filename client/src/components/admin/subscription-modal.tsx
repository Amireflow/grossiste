
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Crown, Loader2 } from "lucide-react";
import type { SubscriptionPlan } from "@shared/schema";

interface AdminSubscriptionModalProps {
    userId: string;
    currentUserRole?: string;
    trigger?: React.ReactNode;
}

export function AdminSubscriptionModal({ userId, currentUserRole, trigger }: AdminSubscriptionModalProps) {
    const [open, setOpen] = useState(false);
    const [planId, setPlanId] = useState<string>("");
    const [durationDays, setDurationDays] = useState<string>("");
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: plans } = useQuery<SubscriptionPlan[]>({
        queryKey: ["/api/plans"],
    });

    const mutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", `/api/admin/users/${userId}/subscription`, {
                planId,
                durationDays: durationDays ? parseInt(durationDays) : undefined
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userId}`] });
            toast({
                title: "Succès",
                description: "L'abonnement a été attribué avec succès.",
            });
            setOpen(false);
            setPlanId("");
            setDurationDays("");
        },
        onError: (error) => {
            toast({
                title: "Erreur",
                description: error instanceof Error ? error.message : "Erreur lors de l'attribution",
                variant: "destructive",
            });
        },
    });

    if (currentUserRole !== "supplier") {
        // Technically only suppliers need subscriptions, but maybe allow shop_owner upgrade logic later?
        // For now, let's allow assigning to anyone but warn if role mismatch? 
        // Or just let it be.
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm" variant="outline" className="gap-2">
                        <Crown className="w-4 h-4" /> Gérer Abonnement
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Attribution d'abonnement</DialogTitle>
                    <DialogDescription>
                        Attribuez manuellement un plan d'abonnement à cet utilisateur.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="plan" className="text-right">
                            Plan
                        </Label>
                        <Select value={planId} onValueChange={setPlanId}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Sélectionner un plan" />
                            </SelectTrigger>
                            <SelectContent>
                                {plans?.map((plan) => (
                                    <SelectItem key={plan.id} value={plan.id}>
                                        {plan.name} ({plan.price} FCFA / {plan.duration}j)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="duration" className="text-right">
                            Durée (opt)
                        </Label>
                        <Input
                            id="duration"
                            type="number"
                            value={durationDays}
                            onChange={(e) => setDurationDays(e.target.value)}
                            className="col-span-3"
                            placeholder="Par défaut celle du plan"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                    <Button onClick={() => mutation.mutate()} disabled={!planId || mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Attribuer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
