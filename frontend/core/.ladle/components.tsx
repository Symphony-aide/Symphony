import { Provider as JotaiProvider } from "jotai";
import type { GlobalProvider } from "@ladle/react";
import React from "react";

export const Provider: GlobalProvider = ({ children }) => {
  return (
    <JotaiProvider>
      {children}
    </JotaiProvider>
  );
};