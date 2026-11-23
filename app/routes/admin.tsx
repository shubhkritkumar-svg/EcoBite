import { useState } from "react";
import { IconTrash } from "@tabler/icons-react";
import { useActionMutation, useActionQuery } from "@agent-native/core/client/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteShell } from "@/components/SiteShell";
import { inr } from "@/lib/cart";

const STATUSES = ["placed", "preparing", "out_for_delivery", "delivered", "cancelled"];

export default function Admin() {
  const me = useActionQuery("whoami", {});
  if (me.isLoading)
    return <SiteShell><p className="p-8 text-sm">Loading…</p></SiteShell>;
  if (!me.data?.isAdmin)
    return (
      <SiteShell>
        <div className="mx-auto max-w-md py-20 text-center text-sm text-muted-foreground">
          Admin access required. Sign up / sign in with <b>admin@ecobite.in</b> to become admin.
        </div>
      </SiteShell>
    );
  return <AdminDashboard />;
}

function AdminDashboard() {
  const { data } = useActionQuery("admin-list-orders", {});
  const rests = useActionQuery("list-restaurants", { includeInactive: true });
  const setStatus = useActionMutation("update-order-status");
  const save = useActionMutation("save-restaurant");
  const del = useActionMutation("delete-restaurant");
  const [name, setName] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [city, setCity] = useState("");
  const [err, setErr] = useState("");
  const s = data?.stats;

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <h1 className="text-2xl font-bold">Admin dashboard</h1>
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            ["Orders", s?.orders ?? 0],
            ["Revenue", inr(s?.revenueInr ?? 0)],
            ["CO₂ saved", `${((s?.co2SavedGrams ?? 0) / 1000).toFixed(1)} kg`],
            ["Green deliveries", s?.greenDeliveries ?? 0],
          ].map(([k, v]) => (
            <div key={String(k)} className="rounded-xl border bg-accent p-4">
              <div className="text-2xl font-bold text-primary">{v}</div>
              <div className="text-xs text-muted-foreground">{k}</div>
            </div>
          ))}
        </div>

        <section>
          <h2 className="mb-2 font-semibold">Order management</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-xs">
                <tr>{["Order", "Customer", "Restaurant", "Mode", "Total", "Status"].map((h) => <th key={h} className="p-2">{h}</th>)}</tr>
              </thead>
              <tbody>
                {data?.orders.map((o) => (
                  <tr key={o.id} className="border-t">
                    <td className="p-2 font-mono text-xs">{o.id}</td>
                    <td className="p-2">{o.ownerEmail}</td>
                    <td className="p-2">{o.restaurantName}</td>
                    <td className="p-2">{o.deliveryMode}</td>
                    <td className="p-2">{inr(o.totalInr)}</td>
                    <td className="p-2">
                      <select
                        className="rounded border bg-background p-1"
                        value={o.status}
                        onChange={(e) => setStatus.mutate({ id: o.id, status: e.target.value as any })}
                      >
                        {STATUSES.map((st) => <option key={st} value={st}>{st.replace(/_/g, " ")}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
                {!data?.orders.length && (
                  <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No orders yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-2 font-semibold">Restaurants</h2>
          <form
            className="mb-3 flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setErr("");
              save.mutate({ name, cuisine, city } as any, {
                onSuccess: () => { setName(""); setCuisine(""); setCity(""); },
                onError: (e: any) => setErr(e?.message || "Failed"),
              });
            }}
          >
            <Input className="w-48" required placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input className="w-40" required placeholder="Cuisine" value={cuisine} onChange={(e) => setCuisine(e.target.value)} />
            <Input className="w-36" required placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
            <Button type="submit">Add restaurant</Button>
            {err && <span className="self-center text-sm text-destructive">{err}</span>}
          </form>
          <div className="divide-y rounded-xl border">
            {rests.data?.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 p-3 text-sm">
                <span>
                  {r.name} <span className="text-muted-foreground">· {r.cuisine}, {r.city}{r.active ? "" : " · hidden"}</span>
                </span>
                <span className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => save.mutate({ ...r, active: !r.active } as any)}>
                    {r.active ? "Hide" : "Show"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => confirm(`Delete ${r.name}?`) && del.mutate({ id: r.id })}>
                    <IconTrash className="size-4" />
                  </Button>
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
