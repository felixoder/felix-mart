import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { Navbar } from "@/components/Navbar";
import { ProductImageDisplay } from "@/components/ProductImageDisplay";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Package, 
  IndianRupee, 
  Users, 
  ShoppingCart,
  Eye,
  EyeOff,
  Mail,
  MessageSquare,
  Upload,
  X,
  Image
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  shipping_address: any;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    email: string | null;
    full_name: string | null;
  } | null;
  order_items: Array<{
    id: string;
    quantity: number;
    price: number;
    product_id: string;
    products: {
      id: string;
      name: string;
      image_url?: string;
      price: number;
      category?: string;
    };
  }>;
}

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string | null;
  user_id: string | null;
  created_at: string;
}

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [contactSubmissions, setContactSubmissions] = useState<ContactSubmission[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'contacts'>('products');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
    category: "",
    stock_quantity: "",
    is_active: true,
  });
  const [productImages, setProductImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
      fetchCategories();
      fetchOrders();
      fetchContactSubmissions();

      // Set up real-time subscription for contact submissions
      const contactSubscription = supabase
        .channel('contact_submissions_changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'contact_submissions'
          },
          (payload) => {
            console.log('Contact submission change detected:', payload);
            
            if (payload.eventType === 'INSERT') {
              toast({
                title: "New Contact Submission",
                description: `New message from ${payload.new.name}`,
              });
            }
            
            fetchContactSubmissions(); // Refresh the list when any change occurs
          }
        )
        .subscribe();

      // Cleanup subscription on unmount
      return () => {
        contactSubscription.unsubscribe();
      };
    }
  }, [isAdmin]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        window.location.href = "/auth";
        return;
      }

      setUser(session.user);

      // Check if user is admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", session.user.id)
        .single();

      if (!profile?.is_admin) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges",
          variant: "destructive",
        });
        window.location.href = "/";
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Auth check error:", error);
      window.location.href = "/auth";
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      // First, get all orders with order items
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            *,
            products (
              id,
              name,
              image_url,
              price,
              category
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        return;
      }

      // Get unique user IDs from orders
      const userIds = [...new Set(ordersData.map(order => order.user_id).filter(Boolean))];

      // Fetch user profiles separately
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds);

      if (profilesError) {
        console.warn("Error fetching profiles:", profilesError);
      }

      // Create a map of user profiles for easy lookup
      const profilesMap = new Map();
      if (profilesData) {
        profilesData.forEach(profile => {
          profilesMap.set(profile.id, profile);
        });
      }

      // Transform the data to match our interface
      const transformedOrders = ordersData.map(order => ({
        ...order,
        profiles: profilesMap.get(order.user_id) || null,
        order_items: order.order_items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          product_id: item.product_id,
          products: item.products
        }))
      }));

      setOrders(transformedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      setProductImages(prev => [...prev, ...imageFiles].slice(0, 10)); // Max 10 images
    }
  };

  const removeImage = (index: number) => {
    setProductImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadProductImages = async (productId: string) => {
    if (productImages.length === 0) return [];

    setUploading(true);
    const uploadPromises = productImages.map(async (file, index) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${productId}-${Date.now()}-${index}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      // Save image record to database
      const { error: dbError } = await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          image_url: publicUrl,
          alt_text: `${file.name}`,
          display_order: index,
          is_primary: index === 0
        });

      if (dbError) throw dbError;

      return publicUrl;
    });

    const urls = await Promise.all(uploadPromises);
    setUploading(false);
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = formData.image_url;
      let productId: string;

      // First create/update the product
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        image_url: imageUrl, // Will be updated later if images are uploaded
        category: formData.category,
        stock_quantity: parseInt(formData.stock_quantity),
        is_active: formData.is_active,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);

        if (error) throw error;
        productId = editingProduct.id;
      } else {
        const { data: newProduct, error } = await supabase
          .from("products")
          .insert([productData])
          .select()
          .single();

        if (error) throw error;
        productId = newProduct.id;
      }

      // Upload images if any
      if (productImages.length > 0) {
        const uploadedUrls = await uploadProductImages(productId);
        
        // Update the product with the first image URL as main image
        if (uploadedUrls.length > 0) {
          await supabase
            .from("products")
            .update({ image_url: uploadedUrls[0] })
            .eq("id", productId);
        }
      }

      toast({
        title: "Success",
        description: editingProduct ? "Product updated successfully" : "Product created successfully",
      });

      setIsDialogOpen(false);
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        image_url: "",
        category: "",
        stock_quantity: "",
        is_active: true,
      });
      setProductImages([]);
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      image_url: product.image_url || "",
      category: product.category || "",
      stock_quantity: product.stock_quantity.toString(),
      is_active: product.is_active,
    });
    
    // Fetch existing product images
    try {
      const { data: existingImages, error } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", product.id)
        .order("display_order", { ascending: true });

      if (error) throw error;

      // Note: For editing, we'll show existing images as read-only info
      // Users can add new images, but managing existing ones would require additional UI
      setProductImages([]); // Reset new images for this session
      
    } catch (error) {
      console.error("Error fetching existing images:", error);
    }
    
    setIsDialogOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const toggleProductStatus = async (product: Product) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: !product.is_active })
        .eq("id", product.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Product ${!product.is_active ? "activated" : "deactivated"}`,
      });
      fetchProducts();
    } catch (error) {
      console.error("Error updating product status:", error);
      toast({
        title: "Error",
        description: "Failed to update product status",
        variant: "destructive",
      });
    }
  };

  const updateOrderStatus = async (orderId: string, status: string, paymentStatus?: string) => {
    try {
      const updateData: any = { status };
      // Only update payment_status if the column exists and value is provided
      // For now, we'll just update the main status
      
      const { error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order status updated successfully",
      });

      fetchOrders(); // Refresh orders list
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const getOrderStatusOptions = () => [
    'pending',
    'paid',
    'confirmed',
    'processing',
    'shipped',
    'out for delivery',
    'delivered',
    'cancelled',
    'refunded',
    'failed'
  ];

  const getPaymentStatusOptions = () => [
    'pending',
    'paid',
    'failed',
    'refunded'
  ];

  const fetchContactSubmissions = async () => {
    try {
      console.log("Fetching contact submissions using RPC function...");
      
      // Using type assertion since the RPC function isn't in types yet
      const { data, error } = await (supabase as any)
        .rpc('get_all_contact_submissions');

      console.log("RPC result:", { data: data?.length || 0, error });

      if (error) throw error;
      setContactSubmissions(data || []);
      
      if (data && data.length > 0) {
        console.log("Successfully loaded", data.length, "contact submissions");
        toast({
          title: "Success",
          description: `Loaded ${data.length} contact submission(s)`,
        });
      } else {
        console.warn("No contact submissions found");
        toast({
          title: "No Data",
          description: "No contact submissions found.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error fetching contact submissions:", error);
      toast({
        title: "Error",
        description: `Failed to load contact submissions: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const updateContactStatus = async (submissionId: string, status: string) => {
    try {
      console.log("Updating contact status using RPC function...");
      
      // Using type assertion since the RPC function isn't in types yet
      const { error } = await (supabase as any)
        .rpc('update_contact_submission_status', {
          submission_id: submissionId,
          new_status: status
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contact status updated successfully",
      });

      fetchContactSubmissions(); // Refresh the list
    } catch (error: any) {
      console.error("Error updating contact status:", error);
      toast({
        title: "Error",
        description: `Failed to update contact status: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} cartItemsCount={0} onCartClick={() => {}} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your store products, orders and inventory</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'products'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'orders'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'contacts'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Contact Submissions
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-primary" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold">{products.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Products</p>
                  <p className="text-2xl font-bold">
                    {products.filter(p => p.is_active).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <IndianRupee className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Avg. Price</p>
                  <p className="text-2xl font-bold">
                    ₹{products.length > 0 ? (products.reduce((sum, p) => sum + p.price, 0) / products.length).toFixed(2) : "0.00"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <ShoppingCart className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{orders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Contact Forms</p>
                  <p className="text-2xl font-bold">{contactSubmissions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conditional Content */}
        {activeTab === 'products' ? (
          /* Products Table */
          <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Products</CardTitle>
                <CardDescription>
                  Manage your product inventory
                </CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-premium">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProduct ? "Edit Product" : "Add New Product"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingProduct ? "Update product information" : "Create a new product for your store"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Product Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">Price</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({ ...formData, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.name}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stock">Stock Quantity</Label>
                        <Input
                          id="stock"
                          type="number"
                          value={formData.stock_quantity}
                          onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Product Images</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('product-images')?.click()}
                            disabled={productImages.length >= 10}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Images
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            {productImages.length}/10 images
                          </span>
                        </div>
                        <input
                          id="product-images"
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        
                        {/* Image Previews */}
                        {productImages.length > 0 && (
                          <div className="grid grid-cols-4 gap-2 mt-2">
                            {productImages.map((file, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-20 object-cover rounded border"
                                />
                                {index === 0 && (
                                  <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1 rounded">
                                    Main
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <p className="text-sm text-muted-foreground">
                          Upload up to 10 images. The first image will be used as the main product image.
                        </p>
                      </div>

                      {/* Fallback Image URL field */}
                      <div className="space-y-2">
                        <Label htmlFor="image">Fallback Image URL (Optional)</Label>
                        <Input
                          id="image"
                          type="url"
                          value={formData.image_url}
                          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                          placeholder="https://example.com/image.jpg"
                        />
                        <p className="text-sm text-muted-foreground">
                          Will be used if no images are uploaded above.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <Label htmlFor="active">Product Active</Label>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsDialogOpen(false);
                          setEditingProduct(null);
                          setFormData({
                            name: "",
                            description: "",
                            price: "",
                            image_url: "",
                            category: "",
                            stock_quantity: "",
                            is_active: true,
                          });
                          setProductImages([]);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading || uploading} className="btn-premium">
                        {loading || uploading ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <ProductImageDisplay
                            productId={product.id}
                            fallbackUrl={product.image_url || "/placeholder.svg"}
                            className="w-10 h-10 object-cover rounded-md"
                            alt={product.name}
                          />
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {product.description}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{product.category}</Badge>
                      </TableCell>
                      <TableCell>₹{product.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium ${
                            product.stock_quantity === 0 ? "text-red-600" :
                            product.stock_quantity < 5 ? "text-red-500" :
                            product.stock_quantity < 10 ? "text-yellow-600" :
                            "text-green-600"
                          }`}>
                            {product.stock_quantity}
                          </span>
                          {product.stock_quantity === 0 && (
                            <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                          )}
                          {product.stock_quantity > 0 && product.stock_quantity < 5 && (
                            <Badge variant="destructive" className="text-xs">Critical</Badge>
                          )}
                          {product.stock_quantity >= 5 && product.stock_quantity < 10 && (
                            <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700">Low Stock</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.is_active ? "default" : "secondary"}>
                          {product.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleProductStatus(product)}
                          >
                            {product.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(product.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        ) : activeTab === 'orders' ? (
          /* Orders Table */
          <Card>
            <CardHeader>
              <CardTitle>Orders Management</CardTitle>
              <CardDescription>
                View and manage customer orders with detailed information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer Details</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${
                              order.status === 'paid' ? 'bg-green-500' :
                              order.status === 'pending' ? 'bg-yellow-500' :
                              order.status === 'processing' ? 'bg-blue-500' :
                              order.status === 'shipped' ? 'bg-purple-500' :
                              order.status === 'delivered' ? 'bg-green-500' :
                              order.status === 'cancelled' ? 'bg-red-500' :
                              order.status === 'refunded' ? 'bg-gray-500' :
                              'bg-gray-500'
                            }`} title={`Status: ${order.status || 'pending'}`}></div>
                            <div className="flex flex-col">
                              <span className="font-mono text-sm">#{order.id.slice(-8).toUpperCase()}</span>
                              <span className="text-xs text-muted-foreground">
                                User: {order.user_id.slice(-8)}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-1">
                            <span className="font-medium">
                              {order.profiles?.full_name || "N/A"}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {order.profiles?.email || "No email"}
                            </span>
                            {order.shipping_address && (
                              <div className="text-xs text-muted-foreground">
                                <div className="font-medium">Shipping Address:</div>
                                {typeof order.shipping_address === 'object' ? (
                                  <div>
                                    {order.shipping_address.address && (
                                      <div>{order.shipping_address.address}</div>
                                    )}
                                    {order.shipping_address.city && order.shipping_address.state && (
                                      <div>{order.shipping_address.city}, {order.shipping_address.state}</div>
                                    )}
                                    {order.shipping_address.pincode && (
                                      <div>PIN: {order.shipping_address.pincode}</div>
                                    )}
                                    {order.shipping_address.phone && (
                                      <div>Phone: {order.shipping_address.phone}</div>
                                    )}
                                  </div>
                                ) : (
                                  <div>{order.shipping_address}</div>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {order.order_items.length} item(s)
                            </div>
                            <div className="space-y-1">
                              {order.order_items.slice(0, 2).map((item) => (
                                <div key={item.id} className="text-xs text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    {item.products.image_url && (
                                      <img 
                                        src={item.products.image_url} 
                                        alt={item.products.name}
                                        className="w-6 h-6 object-cover rounded"
                                      />
                                    )}
                                    <div>
                                      <div className="font-medium">{item.products.name}</div>
                                      <div>Qty: {item.quantity} × ₹{item.price}</div>
                                      {item.products.category && (
                                        <Badge variant="outline" className={`text-xs ${
                                          order.status === 'paid' ? 'border-green-200 text-green-700' :
                                          order.status === 'pending' ? 'border-yellow-200 text-yellow-700' :
                                          order.status === 'cancelled' ? 'border-red-200 text-red-700' :
                                          'border-gray-200 text-gray-700'
                                        }`}>
                                          {item.products.category}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {order.order_items.length > 2 && (
                                <div className="text-xs text-muted-foreground">
                                  +{order.order_items.length - 2} more items
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-lg">₹{order.total_amount.toFixed(2)}</span>
                            <span className="text-xs text-muted-foreground">
                              {order.order_items.reduce((sum, item) => sum + item.quantity, 0)} items total
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-2">
                            <div className={`px-3 py-1 rounded-full text-xs font-medium text-center ${
                              order.status === 'paid' ? 'bg-green-100 text-green-800 border border-green-200' :
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                              order.status === 'processing' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                              order.status === 'shipped' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                              order.status === 'delivered' ? 'bg-green-100 text-green-800 border border-green-200' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-800 border border-red-200' :
                              order.status === 'refunded' ? 'bg-gray-100 text-gray-800 border border-gray-200' :
                              'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}>
                              {(order.status || 'pending').charAt(0).toUpperCase() + (order.status || 'pending').slice(1)}
                            </div>
                            <Select
                              value={order.status || 'pending'}
                              onValueChange={(value) => updateOrderStatus(order.id, value)}
                            >
                              <SelectTrigger className="w-36 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {getOrderStatusOptions().map((status) => (
                                  <SelectItem key={status} value={status}>
                                    <div className={`flex items-center space-x-2`}>
                                      <div className={`w-2 h-2 rounded-full ${
                                        status === 'paid' ? 'bg-green-500' :
                                        status === 'pending' ? 'bg-yellow-500' :
                                        status === 'processing' ? 'bg-blue-500' :
                                        status === 'shipped' ? 'bg-purple-500' :
                                        status === 'delivered' ? 'bg-green-500' :
                                        status === 'cancelled' ? 'bg-red-500' :
                                        status === 'refunded' ? 'bg-gray-500' :
                                        'bg-gray-500'
                                      }`}></div>
                                      <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {new Date(order.created_at).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleTimeString()}
                            </span>
                            {order.updated_at !== order.created_at && (
                              <span className="text-xs text-muted-foreground">
                                Updated: {new Date(order.updated_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Order Details - #{order.id.slice(-8).toUpperCase()}</DialogTitle>
                                  <DialogDescription>
                                    Complete order information and customer details
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-semibold mb-2">Customer Information</h4>
                                      <div className="space-y-1 text-sm">
                                        <div><strong>Name:</strong> {order.profiles?.full_name || "N/A"}</div>
                                        <div><strong>Email:</strong> {order.profiles?.email || "N/A"}</div>
                                        <div><strong>User ID:</strong> {order.user_id}</div>
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold mb-2">Order Information</h4>
                                      <div className="space-y-1 text-sm">
                                        <div><strong>Order ID:</strong> {order.id}</div>
                                        <div className="flex items-center space-x-2">
                                          <strong>Status:</strong> 
                                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            order.status === 'paid' ? 'bg-green-100 text-green-800 border border-green-200' :
                                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                            order.status === 'processing' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                            order.status === 'shipped' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                            order.status === 'delivered' ? 'bg-green-100 text-green-800 border border-green-200' :
                                            order.status === 'cancelled' ? 'bg-red-100 text-red-800 border border-red-200' :
                                            order.status === 'refunded' ? 'bg-gray-100 text-gray-800 border border-gray-200' :
                                            'bg-gray-100 text-gray-800 border border-gray-200'
                                          }`}>
                                            {(order.status || 'pending').charAt(0).toUpperCase() + (order.status || 'pending').slice(1)}
                                          </div>
                                        </div>
                                        <div><strong>Total:</strong> ₹{order.total_amount.toFixed(2)}</div>
                                        <div><strong>Created:</strong> {new Date(order.created_at).toLocaleString()}</div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {order.shipping_address && (
                                    <div>
                                      <h4 className="font-semibold mb-2">Shipping Address</h4>
                                      <div className="text-sm p-3 bg-muted rounded">
                                        {typeof order.shipping_address === 'object' ? (
                                          <div className="space-y-1">
                                            {order.shipping_address.address && <div>{order.shipping_address.address}</div>}
                                            {order.shipping_address.city && order.shipping_address.state && (
                                              <div>{order.shipping_address.city}, {order.shipping_address.state}</div>
                                            )}
                                            {order.shipping_address.pincode && <div>PIN: {order.shipping_address.pincode}</div>}
                                            {order.shipping_address.phone && <div>Phone: {order.shipping_address.phone}</div>}
                                          </div>
                                        ) : (
                                          <div>{order.shipping_address}</div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div>
                                    <h4 className="font-semibold mb-2">Order Items</h4>
                                    <div className="space-y-2">
                                      {order.order_items.map((item) => (
                                        <div key={item.id} className="flex items-center gap-3 p-2 border rounded">
                                          {item.products.image_url && (
                                            <img 
                                              src={item.products.image_url} 
                                              alt={item.products.name}
                                              className="w-12 h-12 object-cover rounded"
                                            />
                                          )}
                                          <div className="flex-1">
                                            <div className="font-medium">{item.products.name}</div>
                                            <div className="text-sm text-muted-foreground">
                                              Quantity: {item.quantity} × ₹{item.price.toFixed(2)} = ₹{(item.quantity * item.price).toFixed(2)}
                                            </div>
                                            {item.products.category && (
                                              <Badge variant="outline" className="text-xs mt-1">
                                                {item.products.category}
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Contact Submissions Table */
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Contact Submissions</CardTitle>
                  <CardDescription>
                    View and manage customer contact form submissions
                  </CardDescription>
                </div>
                <Button
                  onClick={fetchContactSubmissions}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contactSubmissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <Mail className="h-8 w-8 text-muted-foreground" />
                            <div className="text-muted-foreground">No contact submissions yet</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      contactSubmissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell className="font-medium">{submission.name}</TableCell>
                          <TableCell>{submission.email}</TableCell>
                          <TableCell className="max-w-xs truncate">{submission.subject}</TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate" title={submission.message}>
                              {submission.message}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={submission.status || 'new'}
                              onValueChange={(value) => updateContactStatus(submission.id, value)}
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="read">Read</SelectItem>
                                <SelectItem value="replied">Replied</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(submission.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Contact Submission Details</DialogTitle>
                                    <DialogDescription>
                                      Full contact form submission from {submission.name}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <h4 className="font-semibold mb-2">Contact Information</h4>
                                        <div className="space-y-1 text-sm">
                                          <div><strong>Name:</strong> {submission.name}</div>
                                          <div><strong>Email:</strong> {submission.email}</div>
                                          <div><strong>Subject:</strong> {submission.subject}</div>
                                          {submission.user_id && (
                                            <div><strong>User ID:</strong> {submission.user_id}</div>
                                          )}
                                        </div>
                                      </div>
                                      <div>
                                        <h4 className="font-semibold mb-2">Submission Details</h4>
                                        <div className="space-y-1 text-sm">
                                          <div><strong>Status:</strong> {submission.status || 'new'}</div>
                                          <div><strong>Date:</strong> {new Date(submission.created_at).toLocaleString()}</div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <h4 className="font-semibold mb-2">Message</h4>
                                      <div className="text-sm p-3 bg-muted rounded whitespace-pre-wrap">
                                        {submission.message}
                                      </div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Admin;