import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Truck,
  Users,
  FileText,
  Building2,
  Settings,
  LogOut
} from "lucide-react";
import logo from '../assets/logo.jpg';

export function Sidebar() {
  const { user, signOut } = useAuth();
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Asset Register", href: "/assets", icon: Truck },
    { name: "Vendors", href: "/vendors", icon: Building2 },
    { name: "Team", href: "/team", icon: Users },
    { name: "Documents", href: "/documents", icon: FileText },
    { name: "Business Profile", href: "/business-profile", icon: Settings },
  ];

  return (
    <div className="flex flex-col w-64 bg-card border-r">
      <div className="p-4">
        <img src={logo} width="125" alt="logo" />
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className={`
                  w-full justify-start text-sm
                  ${location === item.href
                    ? "bg-gradient-to-br from-primary/90 via-primary-900 to-black text-primary-foreground"
                    : "hover:bg-accent"
                  }
                `}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.photoURL || undefined} />
            <AvatarFallback>{user?.email?.[0]?.toUpperCase() || '?'}</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-medium">{user?.displayName || 'User'}</p>
            <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full mt-4 justify-start"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}