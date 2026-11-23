import { Link, NavLink } from "react-router";
import { IconLeaf, IconShoppingCart } from "@tabler/icons-react";
import { useActionQuery } from "@agent-native/core/client/hooks";
import { Button } from "@/components/ui/button";
import { cartCount, useCart } from "@/lib/cart";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const cart = useCart();
  const me = useActionQuery("whoami", {});
  const count = cartCount(cart);
  const link = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${isActive ? "bg-accent text-primary" : "text-muted-foreground hover:text-foreground"}`;
  return (
    <div className="min-h-full bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
          <Link to="/" className="mr-4 flex items-center gap-2 text-lg font-bold text-primary">
            <IconLeaf className="size-6" /> EcoBite
          </Link>
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
            <NavLink to="/" end className={link}>Restaurants</NavLink>
            <NavLink to="/orders" className={link}>Orders & Eco Points</NavLink>
            {me.data?.isAdmin && <NavLink to="/admin" className={link}>Admin</NavLink>}
          </nav>
          <span className="hidden text-xs text-muted-foreground sm:block">{me.data?.email}</span>
          <Button asChild variant="outline" size="sm">
            <Link to="/checkout">
              <IconShoppingCart className="size-4" /> Cart{count ? ` (${count})` : ""}
            </Link>
          </Button>
        </div>
      </header>
      {children}
      <footer className="mt-16 border-t py-6 text-center text-xs text-muted-foreground">
        EcoBite — college assignment demo. Payments and live tracking are simulated.
      </footer>
    </div>
  );
}
