import { useState } from "react";
import { Link } from "react-router";
import { IconClock, IconLeaf, IconSearch, IconStarFilled } from "@tabler/icons-react";
import { useActionQuery } from "@agent-native/core/client/hooks";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/SiteShell";

export function meta() {
  return [{ title: "EcoBite — Eco-friendly food delivery" }];
}

const CUISINES = ["all", "South Indian", "North Indian", "Gujarati", "Hyderabadi", "Street Food", "Kerala"];

export default function Home() {
  const [q, setQ] = useState("");
  const [cuisine, setCuisine] = useState("all");
  const [ecoOnly, setEcoOnly] = useState(false);
  const [vegOnly, setVegOnly] = useState(false);
  const { data, isLoading } = useActionQuery("list-restaurants", {
    q: q || undefined,
    cuisine,
    ecoOnly,
    vegOnly,
  });

  return (
    <SiteShell>
      <section className="bg-gradient-to-b from-accent to-background">
        <div className="mx-auto max-w-6xl px-4 py-12 text-center sm:py-16">
          <Badge className="mb-4 gap-1"><IconLeaf className="size-3" /> Deliver good. Eat good.</Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Indian food, delivered <span className="text-primary">greener</span>.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Choose compostable packaging and bicycle or EV riders, see your CO₂ savings, and earn Eco Points on every order.
          </p>
          <div className="relative mx-auto mt-6 max-w-lg">
            <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-11 bg-background pl-9"
              placeholder="Search restaurants, cuisines or cities"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {CUISINES.map((c) => (
            <Button key={c} size="sm" variant={cuisine === c ? "default" : "outline"} onClick={() => setCuisine(c)}>
              {c === "all" ? "All cuisines" : c}
            </Button>
          ))}
          <span className="mx-1 h-5 w-px bg-border" />
          <Button size="sm" variant={ecoOnly ? "default" : "outline"} onClick={() => setEcoOnly(!ecoOnly)}>
            Eco-certified
          </Button>
          <Button size="sm" variant={vegOnly ? "default" : "outline"} onClick={() => setVegOnly(!vegOnly)}>
            Pure veg
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading restaurants…</p>
        ) : !data?.length ? (
          <p className="py-12 text-center text-muted-foreground">No restaurants match your filters.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((r) => (
              <Link
                key={r.id}
                to={`/restaurants/${r.id}`}
                className="group overflow-hidden rounded-xl border bg-card transition hover:shadow-md"
              >
                <div className="aspect-[16/9] overflow-hidden bg-accent">
                  <img src={r.imageUrl} alt={r.name} loading="lazy" className="size-full object-cover transition group-hover:scale-105" />
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{r.name}</h3>
                    <span className="flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
                      {r.rating} <IconStarFilled className="size-3" />
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.cuisine} · {r.city}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><IconClock className="size-3.5" />{r.deliveryMins} min</span>
                    <span>{r.distanceKm} km</span>
                    {r.isVeg && <Badge variant="outline">Pure veg</Badge>}
                    {r.ecoCertified && <Badge className="gap-1"><IconLeaf className="size-3" />Eco</Badge>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </SiteShell>
  );
}
