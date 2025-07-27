import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import {
  Store,
  ShoppingCart,
  User as UserIcon,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface NavbarProps {
  user: User | null;
  cartItemsCount: number;
  onCartClick: () => void;
}

export const Navbar = ({ user, cartItemsCount, onCartClick }: NavbarProps) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      setIsAdmin(data?.is_admin || false);
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Signed out successfully",
      });
    }
  };

  const NavLinks = ({ mobile = false }) => (
    <>
      <a
        href="/"
        className={`${
          mobile ? "block py-2" : "inline-flex"
        } text-white hover:text-white/80 transition-colors`}
      >
        Home
      </a>
      <a
        href="/products"
        className={`${
          mobile ? "block py-2" : "inline-flex"
        } text-white hover:text-white/80 transition-colors`}
      >
        Products
      </a>
      {user && (
        <a
          href="/orders"
          className={`${
            mobile ? "block py-2" : "inline-flex"
          } text-white hover:text-white/80 transition-colors`}
        >
          My Orders
        </a>
      )}
      {isAdmin && (
        <a
          href="/admin"
          className={`${
            mobile ? "block py-2" : "inline-flex"
          } text-white hover:text-white/80 transition-colors font-semibold`}
        >
          Admin Panel
        </a>
      )}
    </>
  );

  return (
    <nav className="bg-gradient-to-r from-primary to-primary/90 shadow-[var(--shadow-elegant)] sticky top-0 z-50 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Store className="h-8 w-8 text-white glow" />
            <span className="text-xl font-bold text-white">Premium Store</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLinks />
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onCartClick}
              className="relative text-white hover:bg-white/20"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs bg-destructive text-destructive-foreground">
                  {cartItemsCount}
                </Badge>
              )}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                    <UserIcon className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => window.location.href = "/auth"}
                className="btn-glass"
              >
                Sign In
              </Button>
            )}

            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-white hover:bg-white/20"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] bg-primary/95 border-white/20">
                <div className="flex flex-col space-y-4 mt-8">
                  <NavLinks mobile />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};
