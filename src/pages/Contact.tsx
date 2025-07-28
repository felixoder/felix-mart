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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Navbar
        user={user}
        cartItemsCount={cartItemsCount}
        onCartClick={() => {}}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <div className="bg-gradient-to-br from-purple-100 to-pink-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
            <MessageCircle className="h-12 w-12 text-purple-600" />
          </div>
          <h1 className="text-5xl font-bold mb-6 text-purple-600">💬 Contact Us</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            🤗 We're here to help! Get in touch with us for any questions about our amazing baby toys or your shopping experience!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-8">
            <Card className="border-2 border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50">
                <CardTitle className="flex items-center gap-3 text-purple-600">
                  <Phone className="h-6 w-6" />
                  📞 Call Us
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-2xl font-bold mb-3 text-purple-700">+91 9609384607</p>
                <p className="text-gray-600 mb-6">
                  🗣️ Speak directly with our friendly customer support team
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>⏰ Mon-Sat: 9:00 AM - 6:00 PM IST</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-pink-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <CardHeader className="bg-gradient-to-br from-pink-50 to-purple-50">
                <CardTitle className="flex items-center gap-3 text-pink-600">
                  <Mail className="h-6 w-6" />
                  💌 Email Us
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-lg font-semibold mb-3 text-pink-700">debayanghosh408@gmail.com</p>
                <p className="text-gray-600 mb-6">
                  📧 Send us your queries and we'll respond within 24 hours
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>• 📦 Order inquiries & tracking</p>
                  <p>• 🧸 Product information</p>
                  <p>• 🛠️ Technical support</p>
                  <p>• ❓ General questions</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <CardHeader className="bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardTitle className="flex items-center gap-3 text-blue-600">
                  <MapPin className="h-6 w-6" />
                  📍 Visit Us
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-1 mb-6">
                  <p className="font-bold text-blue-700">🎈 felixmart</p>
                  <p className="text-gray-600">Debayan Ghosh</p>
                  <p className="text-gray-600">Sutragarh, Lankapara</p>
                  <p className="text-gray-600">Santipur, Nadia</p>
                  <p className="text-gray-600">West Bengal - 741404</p>
                  <p className="text-gray-600">🇮🇳 India</p>
                </div>
                <p className="text-gray-500 text-sm">
                  🏪 Visit our location for in-person assistance and product viewing
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <CardHeader className="bg-gradient-to-br from-orange-50 to-yellow-50">
                <CardTitle className="text-orange-600">🌟 Follow Us</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex space-x-4">
                  <a href="#" className="bg-purple-100 p-3 rounded-full hover:bg-purple-200 transition-all duration-300 transform hover:scale-110 shadow-md">
                    <Facebook className="h-5 w-5 text-purple-600" />
                  </a>
                  <a href="#" className="bg-pink-100 p-3 rounded-full hover:bg-pink-200 transition-all duration-300 transform hover:scale-110 shadow-md">
                    <Twitter className="h-5 w-5 text-pink-600" />
                  </a>
                  <a href="#" className="bg-orange-100 p-3 rounded-full hover:bg-orange-200 transition-all duration-300 transform hover:scale-110 shadow-md">
                    <Instagram className="h-5 w-5 text-orange-600" />
                  </a>
                </div>
                <p className="text-gray-500 text-sm mt-4">
                  📱 Stay updated with our latest toys and special offers!
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="border-2 border-purple-100 shadow-xl">
              <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50">
                <CardTitle className="flex items-center gap-3 text-purple-600">
                  <Send className="h-6 w-6" />
                  💌 Send us a Message
                </CardTitle>
                <p className="text-gray-600">
                  📝 Fill out the form below and we'll get back to you as soon as possible!
                </p>
              </CardHeader>
              <CardContent className="pt-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold mb-3 text-purple-600">
                        👤 Full Name *
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        className="border-purple-200 focus:border-purple-400 focus:ring-purple-200"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold mb-3 text-purple-600">
                        📧 Email Address *
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email address"
                        className="border-purple-200 focus:border-purple-400 focus:ring-purple-200"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-semibold mb-3 text-purple-600">
                      📋 Subject *
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="What is this regarding?"
                      className="border-purple-200 focus:border-purple-400 focus:ring-purple-200"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold mb-3 text-purple-600">
                      💬 Message *
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Please describe your inquiry in detail..."
                      rows={6}
                      className="border-purple-200 focus:border-purple-400 focus:ring-purple-200"
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 text-lg shadow-lg transform hover:scale-105 transition-all duration-300" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-3" />
                        🚀 Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Quick Help Section */}
            <div className="mt-12">
              <h3 className="text-2xl font-bold mb-8 text-purple-600">🆘 Quick Help</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 border-2 border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-3 rounded-xl shadow-md">
                      <Package className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-bold mb-2 text-purple-600">📦 Order Tracking</h4>
                      <p className="text-sm text-gray-600">
                        Check your toy order status in the "My Orders" section of your account.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-2 border-pink-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-pink-100 to-pink-200 p-3 rounded-xl shadow-md">
                      <Headphones className="h-6 w-6 text-pink-600" />
                    </div>
                    <div>
                      <h4 className="font-bold mb-2 text-pink-600">🎧 Live Support</h4>
                      <p className="text-sm text-gray-600">
                        Call us during business hours for immediate assistance with your baby toy needs.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-3 rounded-xl shadow-md">
                      <MessageCircle className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold mb-2 text-blue-600">❓ FAQ</h4>
                      <p className="text-sm text-gray-600">
                        Find answers to common questions about baby toys on our homepage FAQ section.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-2 border-orange-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-3 rounded-xl shadow-md">
                      <Mail className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-bold mb-2 text-orange-600">⚡ Email Response</h4>
                      <p className="text-sm text-gray-600">
                        We typically respond to emails within 24 hours with helpful toy information.
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
