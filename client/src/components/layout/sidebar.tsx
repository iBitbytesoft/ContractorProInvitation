import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { 
  Building2, 
  Truck, 
  Users, 
  FileText,
  LayoutDashboard,
  LogOut
} from "lucide-react";
import { auth } from "@/lib/firebase";
import logo from '../../assets/logo.jpg';

interface SidebarProps {
  open?: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const nav = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
    },
    {
      title: "Asset Register",
      icon: Truck,
      href: "/assets",
    },
    {
      title: "Vendors",
      icon: Building2,
      href: "/vendors",
    },
    {
      title: "Team",
      icon: Users,
      href: "/team",
    },
    {
      title: "Documents",
      icon: FileText,
      href: "/documents",
    },
  ];

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="h-16 border-b px-6">
        <img src={logo} height="125" alt="logo" />
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {nav.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-2",
                  location.pathname === item.href && "bg-accent"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Button>
            </Link>
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t p-3">
        <Button 
          variant="destructive" 
          className="w-full justify-start gap-2"
          onClick={() => auth.signOut()}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 border-r bg-card">
        {sidebar}
      </aside>

      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="left" className="w-64 p-0">
          {sidebar}
        </SheetContent>
      </Sheet>
    </>
  );
}