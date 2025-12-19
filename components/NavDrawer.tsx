"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, Globe, BarChart3, BadgeQuestionMark } from "lucide-react";

interface NavDrawerProps {
  onDrawerChange?: (isOpen: boolean) => void;
}

export function NavDrawer({ onDrawerChange }: NavDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDrawerChange = (open: boolean) => {
    setIsOpen(open);
    onDrawerChange?.(open);
  };

  const navItems = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Network Map", href: "/map", icon: Globe },
    { name: "Version Intelligence", href: "/version", icon: BarChart3 },
    { name: "More on Xandeum", href: "/xandeum", icon: BadgeQuestionMark },
  ];

  return (
    <div
      className="fixed top-0 left-0 z-50 h-screen"
      onMouseEnter={() => handleDrawerChange(true)}
      onMouseLeave={() => handleDrawerChange(false)}
    >
      {/* Drawer */}
      <div
        className={`h-full bg-space-card/95 backdrop-blur-xl border-r border-space-border transition-all duration-300 ease-in-out ${
          isOpen ? "w-64" : "w-0"
        } overflow-hidden`}
      >
        <div className="p-6 w-64">
          {/* Drawer Header */}
          <div className="mb-8 pt-2">
            <h2 className="text-xl font-bold text-white mb-1">Navigation</h2>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-neo-teal/10 hover:text-neo-teal border border-transparent hover:border-neo-teal/30 transition-all group"
                >
                  <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer Info */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="bg-neo-teal/10 border border-neo-teal/30 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Active Nodes</p>
              <p className="text-2xl font-bold text-neo-teal">246</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trigger Area - Hamburger Menu (moves with drawer) */}
      <div
        className={`absolute top-6 w-8 h-8 cursor-pointer flex flex-col justify-center gap-1.5 transition-all duration-300 ease-in-out ${
          isOpen ? "left-[272px]" : "left-4"
        }`}
      >
        <div
          className="w-full h-0.5 bg-neo-teal rounded-full transition-all"
          style={{ opacity: 0.8 }}
        ></div>
        <div
          className="w-full h-0.5 bg-neo-teal rounded-full transition-all"
          style={{ opacity: 1.0 }}
        ></div>
        <div
          className="w-full h-0.5 bg-neo-teal rounded-full transition-all"
          style={{ opacity: 0.8 }}
        ></div>
      </div>
    </div>
  );
}
