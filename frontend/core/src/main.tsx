// @ts-ignore
import React from "react";
import {createRoot} from "react-dom/client";

import "./index.css";
import App from "../App";

import applyPatches from "./utils/patches";

// Apply any necessary patches
applyPatches();

// Set platform attribute on html element
const os = (() => {
  const platform = navigator.platform.toLowerCase();
  if (platform.startsWith("mac")) {
    return "darwin";
  } else if (platform.startsWith("linux")) {
    return "linux";
  } else {
    return "win";
  }
})();

document.documentElement.setAttribute("platform", os);

// Render the app
const root = createRoot(document.getElementById("root"));
root.render(<App/>);
