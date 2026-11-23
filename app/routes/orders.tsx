import { useSearchParams } from "react-router";
import { IconLeaf, IconTrees } from "@tabler/icons-react";
import { useActionQuery } from "@agent-native/core/client/hooks";
import { Badge } from "@/components/ui/badge";
import { SiteShell } from "@/components/SiteShell";
import { inr } from "@/lib/cart";

const STATUS_STEPS = ["placed", "preparing", "out_for_delivery", "delivered"];

export default function Orders() {
  const [sp] = useSearchParams();
  const orders = useActionQuery("list-my-orders", {});
  const eco = useActionQuery("get-eco-summary", {});

  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        {sp.get("placed") && (
          <div className="rounded-xl border border-primary/30 bg-accent p-4 text-sm">
            Order placed (payment simulated). Eco Points are credited when the order is delivered.
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat icon={<IconLeaf className="size-5" />} label="Eco Points" value={String(eco.data?.points ?? 0)} />
          <Stat icon={<IconTrees className="size-5" />} label="CO₂ saved" value={`${((eco.data?.co2SavedGrams ?? 0) / 1000).toFixed(2)} kg`} />
          <Stat icon={<IconLeaf className="size-5" />} label="Delivered orders" value={String(eco.data?.deliveredOrders ?? 0)} />
        </div>
        <h1 className="text-2xl font-bold">Order history</h1>
        {!orders.data?.length ? (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          orders.data.map((o) => {
            const step = STATUS_STEPS.indexOf(o.status);
            return (
              <div key={o.id} className="space-y-3 rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold">{o.restaurantName}</div>
                    <div className="text-xs text-muted-foreground">
                      {o.id} · {new Date(o.createdAt).toLocaleString("en-IN")}
                    </div>
                  </div>
                  <Badge variant={o.status === "cancelled" ? "destructive" : "default"}>{o.status.replace(/_/g, " ")}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}</p>
                {o.status !== "cancelled" && (
                  <div>
                    <div className="flex gap-1">
                      {STATUS_STEPS.map((s, i) => (
                        <div key={s} className={`h-1.5 flex-1 rounded ${i <= step ? "bg-primary" : "bg-muted"}`} />
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Simulated tracking — status is updated by the admin.</p>
                  </div>
                )}
                <div className="flex flex-wrap justify-between gap-2 text-sm">
                  <span>
                    {o.deliveryMode} delivery{o.ecoPackaging ? " · eco packaging" : ""} · saves {(o.co2SavedGrams / 1000).toFixed(2)} kg CO₂ · +{o.ecoPointsEarned} pts
                  </span>
                  <b>{inr(o.totalInr)}</b>
                </div>
              </div>
            );
          })
        )}
      </div>
    </SiteShell>
  );
}

const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-xl border bg-accent p-4 text-primary">
    {icon}
    <div className="mt-1 text-2xl font-bold">{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
  </div>
);
