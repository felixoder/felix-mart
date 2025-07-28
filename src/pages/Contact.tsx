import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  MessageCircle, 
  Send,
  Facebook,
  Twitter,
  Instagram,
  Headphones,
  Package
} from "lucide-react";

const Contact = () => {
  const [user, setUser] = useState<User | null>(null);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          getCartItemsCount(session.user.id);
          // Pre-fill user email if logged in
          setFormData(prev => ({
            ...prev,
            email: session.user.email || ""
          }));
        } else {
          const guestCart = JSON.parse(localStorage.getItem("guestCart") || "[]");
          const totalCount = guestCart.reduce((sum: number, item: any) => sum + item.quantity, 0);
          setCartItemsCount(totalCount);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Save contact submission to Supabase
      const { error } = await supabase
        .from('contact_submissions' as any)
        .insert([
          {
            name: formData.name,
            email: formData.email,
            subject: formData.subject,
            message: formData.message,
            user_id: user?.id || null,
            status: 'new'
          }
        ]);

      if (error) {
        console.error('Error submitting contact form:', error);
        throw error;
      }
      
      toast({
        title: "Message Sent!",
        description: "Thank you for contacting us. We'll get back to you within 24 hours.",
      });

      // Reset form
      setFormData({
        name: "",
        email: user?.email || "",
        subject: "",
        message: ""
      });
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        user={user}
        cartItemsCount={cartItemsCount}
        onCartClick={() => {}}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We're here to help! Get in touch with us for any questions, concerns, or feedback about your shopping experience.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Phone className="h-6 w-6 text-primary" />
                  Call Us
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold mb-2">+91 98765 43210</p>
                <p className="text-muted-foreground mb-4">
                  Speak directly with our customer support team
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Mon-Sat: 9:00 AM - 6:00 PM IST</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Mail className="h-6 w-6 text-primary" />
                  Email Us
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold mb-2">support@felixmart.com</p>
                <p className="text-muted-foreground mb-4">
                  Send us your queries and we'll respond within 24 hours
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Order inquiries & tracking</p>
                  <p>• Product information</p>
                  <p>• Technical support</p>
                  <p>• General questions</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <MapPin className="h-6 w-6 text-primary" />
                  Visit Us
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 mb-4">
                  <p className="font-semibold">felixmart</p>
                  <p>Debayan Ghosh</p>
                  <p>Sutragarh, Lankapara</p>
                  <p>Santipur, Nadia</p>
                  <p>West Bengal - 741404</p>
                  <p>India</p>
                </div>
                <p className="text-muted-foreground text-sm">
                  Visit our location for in-person assistance and product viewing
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Follow Us</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  <a href="#" className="bg-blue-100 p-3 rounded-full hover:bg-blue-200 transition-colors">
                    <Facebook className="h-5 w-5 text-blue-600" />
                  </a>
                  <a href="#" className="bg-blue-100 p-3 rounded-full hover:bg-blue-200 transition-colors">
                    <Twitter className="h-5 w-5 text-blue-600" />
                  </a>
                  <a href="#" className="bg-pink-100 p-3 rounded-full hover:bg-pink-200 transition-colors">
                    <Instagram className="h-5 w-5 text-pink-600" />
                  </a>
                </div>
                <p className="text-muted-foreground text-sm mt-3">
                  Stay updated with our latest products and offers
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Send className="h-6 w-6 text-primary" />
                  Send us a Message
                </CardTitle>
                <p className="text-muted-foreground">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-2">
                        Full Name *
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-2">
                        Email Address *
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email address"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-2">
                      Subject *
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="What is this regarding?"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2">
                      Message *
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Please describe your inquiry in detail..."
                      rows={6}
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Quick Help Section */}
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4">Quick Help</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Package className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Order Tracking</h4>
                      <p className="text-sm text-muted-foreground">
                        Check your order status in the "My Orders" section of your account.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Headphones className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Live Support</h4>
                      <p className="text-sm text-muted-foreground">
                        Call us during business hours for immediate assistance.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <MessageCircle className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">FAQ</h4>
                      <p className="text-sm text-muted-foreground">
                        Find answers to common questions on our homepage FAQ section.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <Mail className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Email Response</h4>
                      <p className="text-sm text-muted-foreground">
                        We typically respond to emails within 24 hours.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
