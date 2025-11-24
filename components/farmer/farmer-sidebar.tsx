"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Package,
  ShoppingCart,
  BarChart3,
  MessageCircle,
  Settings,
  Warehouse,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const sidebarItems = [
  {
    title: "Overview",
    href: "/farmer",
    icon: Home,
  },
  {
    title: "Products",
    href: "/farmer/products",
    icon: Package,
  },
  {
    title: "Orders",
    href: "/farmer/orders",
    icon: ShoppingCart,
  },
  {
    title: "Inventory",
    href: "/farmer/inventory",
    icon: Warehouse,
  },
  {
    title: "Analytics",
    href: "/farmer/analytics",
    icon: BarChart3,
  },
  {
    title: "Messages",
    href: "/farmer/messages",
    icon: MessageCircle,
    badge: "5",
  },
  {
    title: "Settings",
    href: "/farmer/settings",
    icon: Settings,
  },
];

export function FarmerSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div
      className={`bg-card border-r transition-all duration-300 shadow-md ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-semibold">Farmer Panel</h2>
              <p className="text-sm text-muted-foreground">Green Basket</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto transition-all duration-300 hover:shadow-md hover:bg-accent/20"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <nav className="px-2 pb-4">
        <ul className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={`
                      w-full justify-start rounded-md transition-all duration-300
                      ${isCollapsed ? "px-2" : "px-3"}
                      hover:shadow-lg hover:-translate-y-[2px]
                      ${isActive ? "" : "hover:bg-accent/20"}
                    `}
                  >
                    <Icon className={`h-4 w-4 ${isCollapsed ? "" : "mr-3"}`} />
                    {!isCollapsed && (
                      <>
                        <span>{item.title}</span>
                        {item.badge && (
                          <Badge
                            variant="secondary"
                            className="ml-auto text-xs"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </Button>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
