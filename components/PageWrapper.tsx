"use client";

import { useState } from "react";
import { NavDrawer } from "./NavDrawer";

interface PageWrapperProps {
  children: React.ReactNode;
}

export function PageWrapper({ children }: PageWrapperProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <NavDrawer onDrawerChange={setIsDrawerOpen} />
      <div
        className={`transition-all duration-300 ease-in-out ${
          isDrawerOpen ? "ml-64" : "ml-0"
        }`}
      >
        {children}
      </div>
    </>
  );
}
