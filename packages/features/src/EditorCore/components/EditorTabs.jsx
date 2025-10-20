// EditorTabs.jsx - Component for managing editor tabs
import React from "react";

const EditorTabs = ({
  openTabs,
  files,
  activeFileName,
  modifiedTabs = [],
  onSelectFile,
  onCloseTab,
}) => {
  return (
    <div className="flex space-x-2 mb-2 overflow-x-auto">
      {openTabs.map((name) => {
        const file = files.find((f) => f.name === name);
        if (!file) return null;
        
        const isActive = name === activeFileName;
        const isModified = modifiedTabs.includes(name);
        
        return (
          <div
            key={name}
            className={`flex items-center space-x-1 px-2 py-1 rounded cursor-pointer transition
              ${isActive ? "bg-gray-700 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}
              ${isModified ? "border border-yellow-400" : ""}`}
            onClick={() => onSelectFile(name)}
          >
            <span>
              {isModified ? "● " : ""}
              {name}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(name);
              }}
              className="text-sm ml-1 hover:text-red-400"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default EditorTabs;
