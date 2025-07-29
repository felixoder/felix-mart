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
      <SheetContent className="w-full sm:max-w-lg bg-gradient-to-br from-purple-50 to-pink-50 border-l-4 border-l-purple-300">
        <SheetHeader className="pb-6">
          <SheetTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
              <ShoppingCart className="h-6 w-6 text-purple-600" />
            </div>
            🛒 Shopping Cart
            {cartItems.length > 0 && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-purple-800 font-bold shadow-lg animate-pulse">
                {getTotalItems()} toys
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription className="text-purple-600 font-medium">
            ✨ Review your amazing toys before checkout! 🎁
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex-1 flex flex-col">
          {cartItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-dashed border-purple-200 mx-2">
              <div className="relative">
                <div className="absolute -top-2 -right-2 text-2xl animate-bounce">🎈</div>
                <ShoppingCart className="h-16 w-16 text-purple-400 mb-4" />
                <div className="absolute -bottom-2 -left-2 text-2xl animate-pulse">🧸</div>
              </div>
              <h3 className="text-xl font-bold text-purple-600 mb-2">Your cart is empty! 🛒</h3>
              <p className="text-purple-500 font-medium">Add some amazing toys to get started! ✨</p>
              <div className="mt-4 text-3xl">🎁 🚂 🎀 🏈</div>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.product_id} className="flex gap-4 py-4 bg-white rounded-xl shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300 p-4">
                      <div className="relative">
                        <img
                          src={item.product.image_url || "/placeholder.svg"}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover rounded-xl border-2 border-purple-200 shadow-md"
                        />
                        <div className="absolute -top-1 -right-1 text-sm">🎀</div>
                      </div>
                      <div className="flex-1 space-y-3">
                        <h4 className="font-bold text-purple-800 leading-tight text-base">
                          {item.product.name}
                        </h4>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col gap-1">
                            <span className="text-lg font-bold text-purple-600">
                              ₹{item.product.price.toFixed(2)}
                            </span>
                            <span className="text-xs text-purple-400 font-medium bg-purple-50 px-2 py-1 rounded-full">
                              📦 {item.product.stock_quantity} available
                            </span>
                          </div>
                          <div className="flex items-center gap-2 bg-purple-50 rounded-full p-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-full border-2 border-purple-300 text-purple-600 hover:bg-purple-100 hover:border-purple-400"
                              onClick={() => updateQuantity(
                                userId ? item.id : item.product_id, 
                                item.quantity - 1, 
                                !userId
                              )}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-bold text-purple-700 bg-white rounded-full py-1">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-full border-2 border-purple-300 text-purple-600 hover:bg-purple-100 hover:border-purple-400"
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
                              className="h-8 w-8 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50"
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

              <div className="space-y-4 pt-6 border-t-2 border-purple-200 bg-gradient-to-br from-white to-purple-50 rounded-2xl p-4 mx-2 shadow-lg">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-purple-700 font-semibold">
                    <span className="flex items-center gap-2">
                      🧮 Subtotal:
                    </span>
                    <span className="text-lg">₹{getTotalPrice().toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-purple-600 font-medium">
                    <span className="flex items-center gap-2">
                      🚚 Delivery Charge:
                    </span>
                    <span>₹{getDeliveryCharge().toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xl font-bold border-t-2 border-purple-200 pt-3 text-purple-800">
                    <span className="flex items-center gap-2">
                      💝 Total:
                    </span>
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      ₹{getFinalTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-purple-800 hover:from-yellow-500 hover:to-orange-500 font-bold shadow-lg transform hover:scale-[1.02] transition-all duration-200 rounded-full border-none h-12 text-lg"
                  onClick={() => {
                    onClose();
                    navigate("/checkout");
                  }}
                >
                  🎉 Proceed to Checkout 🛒
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
