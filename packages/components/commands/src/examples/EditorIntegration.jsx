/**
 * @fileoverview Example integration of command system with Symphony's editor
 */

import React, { useRef, useEffect } from 'react';
import { useCommand } from '../CommandContext.jsx';
import { TextInsertCommand, TextDeleteCommand } from "../index.js";
import { CommandFactory } from '../utils/commandFactory.js';

/**
 * Example editor component showing command system integration
 * This demonstrates how to integrate the command system with Monaco Editor
 */
export function EditorIntegration({ file, onContentChange }) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const { executeCommand } = useCommand();

  // Mock editor interface for demonstration
  const mockEditor = {
    async insertText(position, text) {
      console.log(`Insert "${text}" at ${position.line}:${position.column}`);
      // In real implementation, this would call Monaco's editor.executeEdits()
      if (onContentChange) {
        onContentChange(file.content + text);
      }
    },

    async deleteText(startPosition, endPosition) {
      console.log(`Delete from ${startPosition.line}:${startPosition.column} to ${endPosition.line}:${endPosition.column}`);
      // In real implementation, this would call Monaco's editor.executeEdits()
    },

    getSelection() {
      // Mock selection - in real implementation, get from Monaco
      return {
        start: { line: 0, column: 0 },
        end: { line: 0, column: 5 },
        selectedText: 'hello'
      };
    },

    getCursorPosition() {
      // Mock cursor position - in real implementation, get from Monaco
      return { line: 0, column: file.content.length };
    }
  };

  // Handle text input through command system
  const handleTextInput = async (text) => {
    const position = mockEditor.getCursorPosition();
    const command = CommandFactory.createTextInsert(mockEditor, position, text);
    
    try {
      await executeCommand(command);
    } catch (error) {
      console.error('Failed to execute text insert command:', error);
    }
  };

  // Handle text deletion through command system
  const handleTextDelete = async () => {
    const selection = mockEditor.getSelection();
    const command = CommandFactory.createTextDelete(
      mockEditor,
      selection.start,
      selection.end,
      selection.selectedText
    );
    
    try {
      await executeCommand(command);
    } catch (error) {
      console.error('Failed to execute text delete command:', error);
    }
  };

  // Handle text replacement through command system
  const handleTextReplace = async (newText) => {
    const selection = mockEditor.getSelection();
    const command = CommandFactory.createTextReplace(
      mockEditor,
      selection.start,
      selection.end,
      selection.selectedText,
      newText
    );
    
    try {
      await executeCommand(command);
    } catch (error) {
      console.error('Failed to execute text replace command:', error);
    }
  };

  // Handle multi-cursor operations
  const handleMultiCursorInsert = async (text) => {
    // Mock multiple cursor positions
    const positions = [
      { line: 0, column: 0 },
      { line: 1, column: 0 },
      { line: 2, column: 0 }
    ];
    
    const command = CommandFactory.createMultiCursorInsert(mockEditor, positions, text);
    
    try {
      await executeCommand(command);
    } catch (error) {
      console.error('Failed to execute multi-cursor insert command:', error);
    }
  };

  // Example of integrating with Monaco Editor events
  useEffect(() => {
    // In a real implementation, you would set up Monaco Editor here
    // and listen for content changes to create commands
    
    const setupMonacoIntegration = () => {
      // Example Monaco integration:
      /*
      const editor = monaco.editor.create(editorRef.current, {
        value: file.content,
        language: 'javascript'
      });

      // Listen for content changes and create commands
      editor.onDidChangeModelContent((event) => {
        event.changes.forEach(async (change) => {
          if (change.text) {
            // Text insertion
            const command = new TextInsertCommand(
              mockEditor,
              { line: change.range.startLineNumber - 1, column: change.range.startColumn - 1 },
              change.text
            );
            await executeCommand(command);
          } else {
            // Text deletion
            const command = new TextDeleteCommand(
              mockEditor,
              { line: change.range.startLineNumber - 1, column: change.range.startColumn - 1 },
              { line: change.range.endLineNumber - 1, column: change.range.endColumn - 1 },
              change.rangeLength > 0 ? 'deleted text' : ''
            );
            await executeCommand(command);
          }
        });
      });

      monacoRef.current = editor;
      */
    };

    setupMonacoIntegration();

    return () => {
      // Cleanup Monaco editor
      if (monacoRef.current) {
        monacoRef.current.dispose();
      }
    };
  }, [file, executeCommand]);

  return (
    <div className="editor-integration">
      <div className="editor-toolbar">
        <button onClick={() => handleTextInput('Hello World!')}>
          Insert Text
        </button>
        <button onClick={handleTextDelete}>
          Delete Selection
        </button>
        <button onClick={() => handleTextReplace('Replaced Text')}>
          Replace Selection
        </button>
        <button onClick={() => handleMultiCursorInsert('// Comment\n')}>
          Multi-cursor Insert
        </button>
      </div>
      
      <div 
        ref={editorRef} 
        className="editor-container"
        style={{ 
          width: '100%', 
          height: '400px', 
          border: '1px solid #ccc',
          fontFamily: 'monospace',
          padding: '10px'
        }}
      >
        {/* In real implementation, Monaco Editor would be rendered here */}
        <pre>{file.content}</pre>
      </div>
      
      <div className="editor-status">
        <small>
          File: {file.name} | 
          Length: {file.content.length} characters |
          Commands are integrated with global undo/redo system
        </small>
      </div>
    </div>
  );
}

/**
 * Example of how to set up the command system in your main app
 */
export function ExampleApp() {
  const [file, setFile] = React.useState({
    name: 'example.js',
    content: 'console.log("Hello, Symphony!");'
  });

  return (
    <div className="app">
      <h1>Symphony Command System Example</h1>
      
      <EditorIntegration 
        file={file}
        onContentChange={(newContent) => setFile(prev => ({ ...prev, content: newContent }))}
      />
      
      <div className="instructions">
        <h3>Try the following:</h3>
        <ul>
          <li>Click buttons to execute commands</li>
          <li>Use Ctrl+Z to undo operations</li>
          <li>Use Ctrl+Y to redo operations</li>
          <li>Commands are automatically merged for continuous typing</li>
          <li>All operations work across the entire application</li>
        </ul>
      </div>
    </div>
  );
}
