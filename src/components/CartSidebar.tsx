import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Plus, Minus, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string;
    stock_quantity: number;
  };
}

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  onCartUpdate?: () => void;
}

export const CartSidebar = ({ isOpen, onClose, userId, onCartUpdate }: CartSidebarProps) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchCartItems();
    }
  }, [isOpen, userId]);

  const fetchCartItems = async () => {
    setLoading(true);
    if (userId) {
      try {
        const { data, error } = await supabase
          .from("cart_items")
          .select(`
            id,
            product_id,
            quantity,
            products (
              id,
              name,
              price,
              image_url,
              stock_quantity
            )
          `)
          .eq("user_id", userId);

        if (error) throw error;

        const formattedData = data?.map(item => ({
          ...item,
          product: item.products as any
        })) || [];

        setCartItems(formattedData);
      } catch (error) {
        console.error("Error fetching cart items:", error);
        toast({
          title: "Error",
          description: "Failed to load cart items",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    } else {
      // Fetch from local storage for guest
      const guestCart = JSON.parse(localStorage.getItem("guestCart") || "[]");
      if (guestCart.length > 0) {
        const productIds = guestCart.map((item: any) => item.product_id);
        const { data: products, error } = await supabase
          .from("products")
          .select("*")
          .in("id", productIds);

        if (error) {
          toast({
            title: "Error",
            description: "Failed to fetch cart items",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const items = guestCart.map((item: any) => {
          const product = products.find((p: any) => p.id === item.product_id);
          return { ...item, product };
        });
        setCartItems(items);
      }
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number, isProductId: boolean = false) => {
    if (newQuantity < 1) {
      removeItem(itemId, isProductId);
      return;
    }

    // Find the item to check stock
    const item = cartItems.find(cartItem => 
      isProductId ? cartItem.product_id === itemId : cartItem.id === itemId
    );
    if (item && newQuantity > item.product.stock_quantity) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${item.product.stock_quantity} units available`,
        variant: "destructive",
      });
      return;
    }

    if (userId) {
      try {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: newQuantity })
          .eq(isProductId ? "product_id" : "id", itemId);

        if (error) throw error;

        setCartItems(items =>
          items.map(item =>
            (isProductId ? item.product_id === itemId : item.id === itemId) 
              ? { ...item, quantity: newQuantity } 
              : item
          )
        );

        toast({
          title: "Success",
          description: "Cart updated",
        });

        // Notify parent component of cart update
        onCartUpdate?.();
      } catch (error) {
        console.error("Error updating cart:", error);
        toast({
          title: "Error",
          description: "Failed to update cart",
          variant: "destructive",
        });
      }
    } else {
      // For guest users, always use product_id
      const guestCart = JSON.parse(localStorage.getItem("guestCart") || "[]");
      const itemIndex = guestCart.findIndex((item: any) => item.product_id === itemId);
      if (itemIndex > -1) {
        guestCart[itemIndex].quantity = newQuantity;
      }
      localStorage.setItem("guestCart", JSON.stringify(guestCart));
      fetchCartItems();
      // Notify parent component of cart update
      onCartUpdate?.();
    }
  };

  const removeItem = async (itemId: string, isProductId: boolean = false) => {
    if (userId) {
      try {
        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq(isProductId ? "product_id" : "id", itemId);

        if (error) throw error;

        setCartItems(items => items.filter(item => 
          isProductId ? item.product_id !== itemId : item.id !== itemId
        ));

        toast({
          title: "Success",
          description: "Item removed from cart",
        });

        // Notify parent component of cart update
        onCartUpdate?.();
      } catch (error) {
        console.error("Error removing item:", error);
        toast({
          title: "Error",
          description: "Failed to remove item",
          variant: "destructive",
        });
      }
    } else {
      // For guest users, always use product_id
      const guestCart = JSON.parse(localStorage.getItem("guestCart") || "[]");
      const updatedCart = guestCart.filter((item: any) => item.product_id !== itemId);
      localStorage.setItem("guestCart", JSON.stringify(updatedCart));
      fetchCartItems();
      // Notify parent component of cart update
      onCartUpdate?.();
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getDeliveryCharge = () => {
    return cartItems.length > 0 ? 70 : 0; // ₹70 delivery charge if there are items
  };

  const getFinalTotal = () => {
    return getTotalPrice() + getDeliveryCharge();
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart
            {cartItems.length > 0 && (
              <Badge variant="secondary">{getTotalItems()} items</Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            Review your items before checkout
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex-1 flex flex-col">
          {cartItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Your cart is empty</h3>
              <p className="text-muted-foreground">Add some products to get started</p>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.product_id} className="flex gap-4 py-4">
                      <div className="relative">
                        <img
                          src={item.product.image_url || "/placeholder.svg"}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <h4 className="font-medium text-sm leading-tight">
                          {item.product.name}
                        </h4>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">
                              ₹{item.product.price.toFixed(2)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {item.product.stock_quantity} available
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(
                                userId ? item.id : item.product_id, 
                                item.quantity - 1, 
                                !userId
                              )}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(
                                userId ? item.id : item.product_id, 
                                item.quantity + 1, 
                                !userId
                              )}
                              disabled={item.quantity >= item.product.stock_quantity}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => removeItem(
                                userId ? item.id : item.product_id, 
                                !userId
                              )}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Subtotal:</span>
                    <span>₹{getTotalPrice().toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Delivery Charge:</span>
                    <span>₹{getDeliveryCharge().toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-lg font-semibold border-t pt-2">
                    <span>Total:</span>
                    <span>₹{getFinalTotal().toFixed(2)}</span>
                  </div>
                </div>
                <Button
                  className="w-full btn-premium"
                  onClick={() => {
                    onClose();
                    navigate("/checkout");
                  }}
                >
                  Proceed to Checkout
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
