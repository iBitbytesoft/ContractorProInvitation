import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { SiGoogle } from "react-icons/si";
import { Building2, Truck, Users, FileText } from "lucide-react";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof formSchema>;

export default function Login() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, user } = useAuth();
  const [, setLocation] = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isSignUp) {
        await signUpWithEmail(data.email, data.password);
      } else {
        await signInWithEmail(data.email, data.password);
      }
    } catch (error) {
      // Error is handled in the auth hook
    }
  };

  const features = [
    {
      icon: Truck,
      title: "Asset Management",
      description: "Track and manage your construction equipment efficiently"
    },
    {
      icon: Building2,
      title: "Vendor Relations",
      description: "Streamline your supplier interactions and contracts"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Coordinate with your team in real-time"
    },
    {
      icon: FileText,
      title: "Document Control",
      description: "Secure storage for all your project documents"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Landing content */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-primary/90 via-primary-900 to-black p-8 text-primary-foreground flex flex-col justify-center relative overflow-hidden">
        {/* Add a subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-primary/10 pointer-events-none" />

        <div className="max-w-xl mx-auto space-y-8 relative z-10">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl bg-clip-text">
              Manage Your Construction Assets with Ease
            </h1>
            <p className="text-lg text-primary-foreground/80">
              Streamline your vendor and asset management with our powerful tools
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex items-start space-x-3 backdrop-blur-sm bg-white/5 rounded-lg p-4 transition-all hover:bg-white/10">
                  <Icon className="h-6 w-6 shrink-0" />
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-primary-foreground/70">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <Button
            variant="secondary"
            size="lg"
            className="w-full md:w-auto hover:bg-white/90 transition-colors"
            onClick={() => setIsSignUp(true)}
          >
            Try Free For 7 Days
          </Button>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="w-full md:w-1/2 p-8 flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Tabs defaultValue="email" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary/90 data-[state=active]:via-primary-900 data-[state=active]:to-primary-900 data-[state=active]:text-primary-foreground">Email</TabsTrigger>
                <TabsTrigger value="google" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary/90 data-[state=active]:via-primary-900 data-[state=active]:to-primary-900 data-[state=active]:text-primary-foreground">Google</TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="space-y-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="you@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-br from-primary/90 via-primary-900 to-black hover:from-primary/80 hover:via-primary-800 hover:to-primary-900 transition-all"
                    >
                      {isSignUp ? "Sign Up" : "Sign In"}
                    </Button>
                  </form>
                </Form>
                <Button
                  variant="link"
                  className="w-full"
                  onClick={() => setIsSignUp(!isSignUp)}
                >
                  {isSignUp
                    ? "Already have an account? Sign in"
                    : "Don't have an account? Sign up"}
                </Button>
              </TabsContent>

              <TabsContent value="google">
                <Button
                  className="w-full bg-gradient-to-br from-primary/90 via-primary-900 to-black hover:from-primary/80 hover:via-primary-800 hover:to-primary-900 transition-all"
                  onClick={() => signInWithGoogle()}
                  size="lg"
                >
                  <SiGoogle className="mr-2 h-4 w-4" />
                  Sign in with Google
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}