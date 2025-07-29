import { useEffect } from "react";
import { AuthForm } from "@/components/AuthForm";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        window.location.href = "/";
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        window.location.href = "/";
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400 overflow-hidden">
      {/* Floating toy decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-8 h-8 bg-yellow-300 rounded-full animate-bounce"></div>
        <div className="absolute top-20 right-20 w-6 h-6 bg-red-400 rounded-full animate-bounce delay-300"></div>
        <div className="absolute bottom-20 left-20 w-10 h-10 bg-green-400 rounded-full animate-bounce delay-500"></div>
        <div className="absolute bottom-10 right-10 w-4 h-4 bg-orange-400 rounded-full animate-bounce delay-700"></div>
        <div className="absolute top-1/2 left-5 w-5 h-5 bg-cyan-300 rounded-full animate-bounce delay-1000"></div>
        <div className="absolute top-1/3 right-5 w-7 h-7 bg-pink-300 rounded-full animate-bounce delay-200"></div>
      </div>

      <div className="min-h-screen flex">
        {/* Left Side - Baby Toy Animation */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative">
          <div className="text-center space-y-8 z-10">
            <h1 className="text-5xl font-bold text-white mb-8 font-rounded">
              🎈 Welcome to{" "}
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent drop-shadow-lg">
                felixmart
              </span>
              {" "}🧸
            </h1>
            
            <p className="text-xl text-white/95 max-w-lg leading-relaxed">
              🌟 Your magical destination for safe, fun, and educational baby toys! 
              Join thousands of happy parents! 🎨✨
            </p>

            {/* Animated Toy Grid */}
            <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto mt-12">
              <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 border-2 border-white/30 shadow-2xl transform hover:scale-110 transition-transform duration-500 toy-float">
                <div className="text-6xl animate-bounce toy-wiggle">🚗</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 border-2 border-white/30 shadow-2xl transform hover:scale-110 transition-transform duration-500 toy-float" style={{animationDelay: '0.5s'}}>
                <div className="text-6xl animate-bounce delay-200 toy-wiggle" style={{animationDelay: '0.2s'}}>🧸</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 border-2 border-white/30 shadow-2xl transform hover:scale-110 transition-transform duration-500 toy-float" style={{animationDelay: '1s'}}>
                <div className="text-6xl animate-bounce delay-300 toy-wiggle" style={{animationDelay: '0.4s'}}>🎲</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 border-2 border-white/30 shadow-2xl transform hover:scale-110 transition-transform duration-500 toy-float" style={{animationDelay: '1.5s'}}>
                <div className="text-6xl animate-bounce delay-500 toy-wiggle" style={{animationDelay: '0.6s'}}>🎨</div>
              </div>
            </div>

            {/* Features */}
            <div className="flex items-center justify-center gap-8 mt-8">
              <div className="text-center">
                <div className="text-2xl mb-2">🛡️</div>
                <p className="text-white/90 text-sm font-semibold">Baby Safe</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🚚</div>
                <p className="text-white/90 text-sm font-semibold">Fast Delivery</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">💝</div>
                <p className="text-white/90 text-sm font-semibold">Premium Quality</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <AuthForm />
        </div>
      </div>
    </div>
  );
};

export default Auth;