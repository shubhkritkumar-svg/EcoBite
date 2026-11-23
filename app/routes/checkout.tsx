import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { IconBike, IconBolt, IconLeaf, IconMinus, IconPlus, IconTruck } from "@tabler/icons-react";
import { useActionMutation } from "@agent-native/core/client/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteShell } from "@/components/SiteShell";
import { cartActions, cartSubtotal, inr, useCart } from "@/lib/cart";

const MODES = [
  { id: "bicycle", label: "Bicycle rider", note: "Zero emissions · +20 Eco Points", icon: IconBike },
  { id: "ev", label: "Electric vehicle", note: "~80% fewer emissions · +10 Eco Points", icon: IconBolt },
  { id: "standard", label: "Standard", note: "Petrol scooter", icon: IconTruck },
] as const;

type Mode = (typeof MODES)[number]["id"];
type Pay = "simulated-upi" | "simulated-card" | "simulated-cod";

export default function Checkout() {
  const cart = useCart();
  const nav = useNavigate();
  const [mode, setMode] = useState<Mode>("bicycle");
  const [eco, setEco] = useState(true);
  const [address, setAddress] = useState("");
  const [pay, setPay] = useState<Pay>("simulated-upi");
  const [err, setErr] = useState("");
  const place = useActionMutation("place-order");

  const sub = cartSubtotal(cart);
  const fee = sub >= 500 ? 0 : mode === "ev" ? 35 : 30;
  const pack = eco ? 8 : 0;
  const tax = Math.round(sub * 0.05);

  if (!cart.lines.length)
    return (
      <SiteShell>
        <div className="py-24 text-center">
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Button asChild className="mt-4"><Link to="/">Browse restaurants</Link></Button>
        </div>
      </SiteShell>
    );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    place.mutate(
      {
        restaurantId: cart.restaurantId!,
        items: cart.lines.map((l) => ({ menuItemId: l.menuItemId, quantity: l.quantity })),
        deliveryMode: mode,
        ecoPackaging: eco,
        address,
        paymentMethod: pay,
      },
      {
        onSuccess: () => {
          cartActions.clear();
          nav("/orders?placed=1");
        },
        onError: (e: any) => setErr(e?.message || "Could not place order"),
      },
    );
  };

  return (
    <SiteShell>
      <form onSubmit={submit} className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Checkout · {cart.restaurantName}</h1>
          <section className="space-y-2">
            <h2 className="font-semibold">Delivery address</h2>
            <Input required minLength={8} placeholder="Flat, street, area, city, PIN" value={address} onChange={(e) => setAddress(e.target.value)} />
          </section>
          <section className="space-y-2">
            <h2 className="font-semibold">Delivery preference</h2>
            <div className="grid gap-2 sm:grid-cols-3">
              {MODES.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`rounded-xl border p-3 text-left ${mode === m.id ? "border-primary bg-accent" : ""}`}
                >
                  <m.icon className="mb-1 size-5 text-primary" />
                  <div className="text-sm font-medium">{m.label}</div>
                  <div className="text-xs text-muted-foreground">{m.note}</div>
                </button>
              ))}
            </div>
          </section>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border p-3">
            <input type="checkbox" checked={eco} onChange={(e) => setEco(e.target.checked)} className="size-4" />
            <IconLeaf className="size-5 text-primary" />
            <span className="text-sm">
              <b>Compostable packaging</b> (+₹8) — saves ~60 g CO₂ and earns +5 Eco Points
            </span>
          </label>
          <section className="space-y-2">
            <h2 className="font-semibold">
              Payment <span className="text-xs font-normal text-muted-foreground">(simulated — no real charge)</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["simulated-upi", "UPI"],
                  ["simulated-card", "Card"],
                  ["simulated-cod", "Cash on delivery"],
                ] as const
              ).map(([v, l]) => (
                <Button type="button" key={v} variant={pay === v ? "default" : "outline"} size="sm" onClick={() => setPay(v)}>
                  {l}
                </Button>
              ))}
            </div>
          </section>
        </div>

        <aside className="h-fit space-y-3 rounded-xl border bg-card p-4">
          <h2 className="font-semibold">Order summary</h2>
          {cart.lines.map((l) => (
            <div key={l.menuItemId} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex-1">{l.name}</span>
              <span className="flex items-center gap-1">
                <Button type="button" size="icon" variant="outline" className="size-6" onClick={() => cartActions.setQty(l.menuItemId, l.quantity - 1)}>
                  <IconMinus className="size-3" />
                </Button>
                {l.quantity}
                <Button type="button" size="icon" variant="outline" className="size-6" onClick={() => cartActions.setQty(l.menuItemId, Math.min(20, l.quantity + 1))}>
                  <IconPlus className="size-3" />
                </Button>
              </span>
              <span className="w-16 text-right">{inr(l.priceInr * l.quantity)}</span>
            </div>
          ))}
          <div className="space-y-1 border-t pt-3 text-sm">
            <Row k="Subtotal" v={inr(sub)} />
            <Row k="Delivery" v={fee ? inr(fee) : "Free"} />
            <Row k="Eco packaging" v={inr(pack)} />
            <Row k="GST (5%)" v={inr(tax)} />
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Total</span>
              <span>{inr(sub + fee + pack + tax)}</span>
            </div>
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <Button type="submit" className="w-full" disabled={place.isPending}>
            {place.isPending ? "Placing…" : "Place order (simulated payment)"}
          </Button>
          <p className="text-xs text-muted-foreground">Totals are re-verified on the server.</p>
        </aside>
      </form>
    </SiteShell>
  );
}

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex justify-between text-muted-foreground">
    <span>{k}</span>
    <span>{v}</span>
  </div>
);
