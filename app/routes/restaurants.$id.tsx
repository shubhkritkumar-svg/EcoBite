import { Link, useParams } from "react-router";
import { IconPlus } from "@tabler/icons-react";
import { useActionQuery } from "@agent-native/core/client/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/SiteShell";
import { cartActions, cartCount, cartSubtotal, inr, useCart } from "@/lib/cart";

export default function RestaurantPage() {
  const { id = "" } = useParams();
  const { data, isLoading, error } = useActionQuery("get-restaurant", { id });
  const cart = useCart();
  const count = cart.restaurantId === id ? cartCount(cart) : 0;

  if (isLoading || !data)
    return (
      <SiteShell>
        <p className="p-8 text-sm text-muted-foreground">{error ? "Restaurant not found." : "Loading…"}</p>
      </SiteShell>
    );
  const { restaurant: r, menu } = data;
  const cats = [...new Set(menu.map((m) => m.category))];

  return (
    <SiteShell>
      <div className="h-48 overflow-hidden bg-accent sm:h-64">
        <img src={r.imageUrl} alt={r.name} className="size-full object-cover" />
      </div>
      <div className="mx-auto max-w-4xl px-4 pb-24">
        <Link to="/" className="mt-4 inline-block text-sm text-primary">← All restaurants</Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{r.name}</h1>
          {r.ecoCertified && <Badge>Eco-certified</Badge>}
          {r.isVeg && <Badge variant="outline">Pure veg</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">
          {r.cuisine} · {r.city} · {r.rating}★ · {r.deliveryMins} min · {r.distanceKm} km
        </p>
        <p className="mt-2 text-sm">{r.description}</p>

        {cats.map((c) => (
          <section key={c} className="mt-8">
            <h2 className="mb-3 text-lg font-semibold">{c}</h2>
            <div className="divide-y rounded-xl border bg-card">
              {menu
                .filter((m) => m.category === c)
                .map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-4 p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block size-3 rounded-sm border-2 ${m.isVeg ? "border-green-600" : "border-red-600"}`} />
                        <span className="font-medium">{m.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{m.description}</p>
                      <p className="mt-1 text-sm font-semibold">{inr(m.priceInr)}</p>
                    </div>
                    <Button
                      size="sm"
                      disabled={!m.available}
                      onClick={() =>
                        cartActions.add({ id: r.id, name: r.name }, { menuItemId: m.id, name: m.name, priceInr: m.priceInr })
                      }
                    >
                      <IconPlus className="size-4" /> {m.available ? "Add" : "Sold out"}
                    </Button>
                  </div>
                ))}
            </div>
          </section>
        ))}
      </div>
      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background p-3">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <span className="text-sm font-medium">
              {count} item{count > 1 ? "s" : ""} · {inr(cartSubtotal(cart))}
            </span>
            <Button asChild><Link to="/checkout">Go to checkout</Link></Button>
          </div>
        </div>
      )}
    </SiteShell>
  );
}
