import type { GlobalProvider } from "@ladle/react";
import { Provider as JotaiProvider } from "jotai";
import React from "react";

export const Provider: GlobalProvider = ({ children }) => {
  return (
    <JotaiProvider>
      {children}
    </JotaiProvider>
  );
};