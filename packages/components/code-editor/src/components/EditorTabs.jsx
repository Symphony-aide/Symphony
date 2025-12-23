// EditorTabs.jsx - Component for managing editor tabs
import React from "react";
import { Flex, Box, Text, Button } from "ui";

const EditorTabs = ({
  openTabs,
  files,
  activeFileName,
  modifiedTabs = [],
  onSelectFile,
  onCloseTab,
}) => {
  return (
    <Flex gap={2} className="mb-2 overflow-x-auto">
      {openTabs.map((name) => {
        const file = files.find((f) => f.name === name);
        if (!file) return null;
        
        const isActive = name === activeFileName;
        const isModified = modifiedTabs.includes(name);
        
        return (
          <Flex
            key={name}
            align="center"
            gap={1}
            className={`px-2 py-1 rounded cursor-pointer transition
              ${isActive ? "bg-gray-700 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}
              ${isModified ? "border border-yellow-400" : ""}`}
            onClick={() => onSelectFile(name)}
          >
            <Text size="sm">
              {isModified ? "● " : ""}
              {name}
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(name);
              }}
              className="text-sm ml-1 hover:text-red-400 p-0 h-auto"
            >
              ✕
            </Button>
          </Flex>
        );
      })}
    </Flex>
  );
};

export default EditorTabs;
