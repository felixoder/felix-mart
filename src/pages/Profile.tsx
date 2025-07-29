import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Settings as SettingsIcon, 
  Save,
  Loader2,
  Package,
  ShoppingBag,
  Star,
  Bell,
  Lock,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  created_at: string;
}

interface OrderSummary {
  total_orders: number;
  total_spent: number;
  recent_orders: Array<{
    id: string;
    total_amount: number;
    status: string;
    created_at: string;
  }>;
}

const Profile = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      await fetchProfile(session.user.id);
      await fetchOrderSummary(session.user.id);
      await getCartItemsCount(session.user.id);
    } catch (error) {
      console.error("Auth check error:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;

      setProfile(data);
      setFullName(data.full_name || "");
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchOrderSummary = async (userId: string) => {
    try {
      // Get total orders and spent amount
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id, total_amount, status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      const totalOrders = orders?.length || 0;
      const totalSpent = orders?.reduce((sum, order) => {
        return order.status === "paid" ? sum + order.total_amount : sum;
      }, 0) || 0;

      setOrderSummary({
        total_orders: totalOrders,
        total_spent: totalSpent,
        recent_orders: orders?.slice(0, 5) || []
      });
    } catch (error) {
      console.error("Error fetching order summary:", error);
    }
  };

  const getCartItemsCount = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select("quantity")
        .eq("user_id", userId);

      if (error) throw error;

      const totalCount = data.reduce((sum, item) => sum + item.quantity, 0);
      setCartItemsCount(totalCount);
    } catch (error) {
      console.error("Error fetching cart count:", error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, full_name: fullName } : null);
      
      toast({
        title: "Success! 🎉",
        description: "Your profile has been updated successfully!",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <Navbar user={user} cartItemsCount={cartItemsCount} onCartClick={() => setIsCartOpen(true)} />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
            <p className="text-purple-600">Loading your profile... 🧸</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <Navbar user={user} cartItemsCount={cartItemsCount} onCartClick={() => setIsCartOpen(true)} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <User className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Hey there, {profile.full_name || "Toy Lover"}! 🎈
          </h1>
          <p className="text-gray-600 mt-2">Manage your profile and view your toy adventures</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-lg rounded-full p-1">
            <TabsTrigger 
              value="profile" 
              className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="orders"
              className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
            >
              <Package className="h-4 w-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger 
              value="settings"
              className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
            >
              <SettingsIcon className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Information */}
              <Card className="bg-white/70 backdrop-blur-sm border-purple-200 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Profile Information 🧸
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email Address
                      </Label>
                      <div className="flex items-center mt-1">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">{user.email}</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                        Full Name
                      </Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        className="mt-1 border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Account Type
                      </Label>
                      <div className="flex items-center mt-1">
                        <Shield className="h-4 w-4 text-gray-400 mr-2" />
                        <Badge className={profile.is_admin ? "bg-orange-100 text-orange-800" : "bg-blue-100 text-blue-800"}>
                          {profile.is_admin ? "🔧 Admin" : "🧸 Customer"}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Member Since
                      </Label>
                      <div className="flex items-center mt-1">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">
                          {new Date(profile.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes 🎯
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Account Stats */}
              <Card className="bg-white/70 backdrop-blur-sm border-purple-200 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-yellow-400 to-orange-400 text-purple-800 rounded-t-lg">
                  <CardTitle className="flex items-center">
                    <Star className="h-5 w-5 mr-2" />
                    Your Toy Adventures 🎪
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {orderSummary ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {orderSummary.total_orders}
                          </div>
                          <div className="text-sm text-gray-600">Total Orders 📦</div>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            ₹{orderSummary.total_spent.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">Total Spent 💰</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center pt-4">
                        <Button
                          onClick={() => navigate("/orders")}
                          variant="outline"
                          className="border-purple-300 text-purple-600 hover:bg-purple-50"
                        >
                          <Package className="h-4 w-4 mr-2" />
                          View All Orders 📋
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">No orders yet! 🛍️</p>
                      <Button
                        onClick={() => navigate("/")}
                        className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      >
                        Start Shopping 🧸
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card className="bg-white/70 backdrop-blur-sm border-purple-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Recent Orders 📦
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {orderSummary?.recent_orders.length ? (
                  <div className="space-y-4">
                    {orderSummary.recent_orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg border border-purple-100">
                        <div>
                          <p className="font-medium text-gray-900">
                            Order #{order.id.slice(0, 8)}...
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-purple-600">₹{order.total_amount.toFixed(2)}</p>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    <div className="text-center pt-4">
                      <Button
                        onClick={() => navigate("/orders")}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      >
                        View All Orders 📋
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No orders yet! 🎪</h3>
                    <p className="text-gray-600 mb-4">Start your toy adventure today!</p>
                    <Button
                      onClick={() => navigate("/")}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    >
                      Browse Toys 🧸
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              <Card className="bg-white/70 backdrop-blur-sm border-purple-200 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-t-lg">
                  <CardTitle className="flex items-center">
                    <SettingsIcon className="h-5 w-5 mr-2" />
                    Account Settings ⚙️
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-purple-100">
                      <div className="flex items-center">
                        <Bell className="h-5 w-5 text-blue-500 mr-3" />
                        <div>
                          <h3 className="font-medium">Email Notifications 📧</h3>
                          <p className="text-sm text-gray-600">Receive updates about your orders</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-orange-100">
                      <div className="flex items-center">
                        <Lock className="h-5 w-5 text-orange-500 mr-3" />
                        <div>
                          <h3 className="font-medium">Privacy Settings 🔒</h3>
                          <p className="text-sm text-gray-600">Control your data and privacy</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">Secure</Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help? 🤝</h3>
                    <p className="text-gray-600 mb-4">
                      Contact our friendly support team for any questions about your account or orders!
                    </p>
                    <Button
                      onClick={() => navigate("/contact")}
                      variant="outline"
                      className="border-purple-300 text-purple-600 hover:bg-purple-50"
                    >
                      Contact Support 💬
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
