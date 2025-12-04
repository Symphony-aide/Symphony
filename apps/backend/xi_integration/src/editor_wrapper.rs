//! Wrapper around xi-core's Editor to expose undo/redo functionality
//!
//! Xi-core's Editor has undo/redo functionality built-in via its CRDT engine,
//! but the methods are marked `pub(crate)` (crate-private). This wrapper provides
//! a thin layer that exposes these methods for use in Symphony.
//!
//! # Implementation Strategy
//!
//! Since we can't directly call Editor's private `do_undo()` and `do_redo()` methods,
//! we use a workaround: we track the undo/redo state ourselves and use Editor's
//! `reload()` method to apply the changes. This is not ideal, but it works until
//! we can either:
//! 1. Fork xi-core-lib and make the methods public
//! 2. Contribute upstream to xi-editor to expose the API
//! 3. Use a different integration approach
//!
//! # Future Work
//!
//! Once we have proper API access, this wrapper can be simplified or removed.

use xi_core_lib::editor::Editor;
use xi_rope::Rope;
use std::collections::VecDeque;

/// Maximum number of undo states to keep in history
const MAX_UNDO_HISTORY: usize = 1000;

/// Wrapper around xi-core's Editor that exposes undo/redo functionality
///
/// This wrapper maintains its own undo/redo history by tracking rope states.
/// While not as efficient as using Editor's built-in CRDT engine directly,
/// it provides the functionality we need until we have proper API access.
///
/// # Examples
///
/// ```rust
/// use xi_integration::editor_wrapper::EditorWrapper;
/// use xi_rope::Rope;
///
/// let mut editor = EditorWrapper::new();
///
/// // Make some edits
/// let text1 = Rope::from("Hello");
/// editor.reload(text1.clone());
///
/// let text2 = Rope::from("Hello, World!");
/// editor.reload(text2);
///
/// // Undo to get back to "Hello"
/// editor.undo();
/// assert_eq!(editor.get_buffer().to_string(), "Hello");
///
/// // Redo to get back to "Hello, World!"
/// editor.redo();
/// assert_eq!(editor.get_buffer().to_string(), "Hello, World!");
/// ```
pub struct EditorWrapper {
    /// The underlying xi-core Editor
    editor: Editor,
    /// Undo history (stack of previous states)
    undo_stack: VecDeque<Rope>,
    /// Redo history (stack of undone states)
    redo_stack: VecDeque<Rope>,
    /// Current state (for tracking)
    current_state: Rope,
}

impl EditorWrapper {
    /// Create a new EditorWrapper with empty content
    ///
    /// # Examples
    ///
    /// ```rust
    /// use xi_integration::editor_wrapper::EditorWrapper;
    ///
    /// let editor = EditorWrapper::new();
    /// assert_eq!(editor.get_buffer().to_string(), "");
    /// ```
    pub fn new() -> Self {
        let editor = Editor::new();
        let current_state = Rope::from("");
        
        Self {
            editor,
            undo_stack: VecDeque::new(),
            redo_stack: VecDeque::new(),
            current_state,
        }
    }

    /// Create a new EditorWrapper with initial text
    ///
    /// # Arguments
    ///
    /// * `text` - Initial text content
    ///
    /// # Examples
    ///
    /// ```rust
    /// use xi_integration::editor_wrapper::EditorWrapper;
    /// use xi_rope::Rope;
    ///
    /// let editor = EditorWrapper::with_text(Rope::from("Hello, World!"));
    /// assert_eq!(editor.get_buffer().to_string(), "Hello, World!");
    /// ```
    pub fn with_text<T: Into<Rope>>(text: T) -> Self {
        let rope: Rope = text.into();
        let editor = Editor::with_text(rope.clone());
        
        Self {
            editor,
            undo_stack: VecDeque::new(),
            redo_stack: VecDeque::new(),
            current_state: rope,
        }
    }

    /// Reload the editor with new text, preserving undo state
    ///
    /// This method updates the editor content and adds the previous state
    /// to the undo history. It clears the redo stack since we're making
    /// a new edit.
    ///
    /// # Arguments
    ///
    /// * `text` - New text content
    ///
    /// # Examples
    ///
    /// ```rust
    /// use xi_integration::editor_wrapper::EditorWrapper;
    /// use xi_rope::Rope;
    ///
    /// let mut editor = EditorWrapper::new();
    /// editor.reload(Rope::from("Hello"));
    /// editor.reload(Rope::from("Hello, World!"));
    ///
    /// // Can undo back to "Hello"
    /// editor.undo();
    /// assert_eq!(editor.get_buffer().to_string(), "Hello");
    /// ```
    pub fn reload(&mut self, text: Rope) {
        // Save current state to undo stack
        if !self.current_state.is_empty() || !text.is_empty() {
            self.undo_stack.push_back(self.current_state.clone());
            
            // Limit undo history size
            if self.undo_stack.len() > MAX_UNDO_HISTORY {
                self.undo_stack.pop_front();
            }
        }
        
        // Clear redo stack (new edit invalidates redo history)
        self.redo_stack.clear();
        
        // Update editor and current state
        self.editor.reload(text.clone());
        self.current_state = text;
    }

    /// Undo the last edit operation
    ///
    /// Restores the previous state from the undo stack and adds the current
    /// state to the redo stack.
    ///
    /// # Returns
    ///
    /// Returns `true` if undo was performed, `false` if there's nothing to undo.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use xi_integration::editor_wrapper::EditorWrapper;
    /// use xi_rope::Rope;
    ///
    /// let mut editor = EditorWrapper::new();
    /// editor.reload(Rope::from("Hello"));
    /// editor.reload(Rope::from("Hello, World!"));
    ///
    /// assert!(editor.undo());
    /// assert_eq!(editor.get_buffer().to_string(), "Hello");
    /// ```
    pub fn undo(&mut self) -> bool {
        if let Some(previous_state) = self.undo_stack.pop_back() {
            // Save current state to redo stack
            self.redo_stack.push_back(self.current_state.clone());
            
            // Restore previous state
            self.editor.reload(previous_state.clone());
            self.current_state = previous_state;
            
            true
        } else {
            false
        }
    }

    /// Redo the last undone edit operation
    ///
    /// Restores the next state from the redo stack and adds the current
    /// state to the undo stack.
    ///
    /// # Returns
    ///
    /// Returns `true` if redo was performed, `false` if there's nothing to redo.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use xi_integration::editor_wrapper::EditorWrapper;
    /// use xi_rope::Rope;
    ///
    /// let mut editor = EditorWrapper::new();
    /// editor.reload(Rope::from("Hello"));
    /// editor.reload(Rope::from("Hello, World!"));
    ///
    /// editor.undo();
    /// assert_eq!(editor.get_buffer().to_string(), "Hello");
    ///
    /// assert!(editor.redo());
    /// assert_eq!(editor.get_buffer().to_string(), "Hello, World!");
    /// ```
    pub fn redo(&mut self) -> bool {
        if let Some(next_state) = self.redo_stack.pop_back() {
            // Save current state to undo stack
            self.undo_stack.push_back(self.current_state.clone());
            
            // Restore next state
            self.editor.reload(next_state.clone());
            self.current_state = next_state;
            
            true
        } else {
            false
        }
    }

    /// Get a reference to the current buffer content
    ///
    /// # Returns
    ///
    /// Returns a reference to the current Rope content.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use xi_integration::editor_wrapper::EditorWrapper;
    /// use xi_rope::Rope;
    ///
    /// let editor = EditorWrapper::with_text(Rope::from("Hello"));
    /// assert_eq!(editor.get_buffer().to_string(), "Hello");
    /// ```
    pub fn get_buffer(&self) -> &Rope {
        &self.current_state
    }

    /// Check if there are any undo operations available
    ///
    /// # Returns
    ///
    /// Returns `true` if undo is available, `false` otherwise.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use xi_integration::editor_wrapper::EditorWrapper;
    /// use xi_rope::Rope;
    ///
    /// let mut editor = EditorWrapper::new();
    /// assert!(!editor.can_undo());
    ///
    /// editor.reload(Rope::from("Hello"));
    /// assert!(editor.can_undo());
    /// ```
    pub fn can_undo(&self) -> bool {
        !self.undo_stack.is_empty()
    }

    /// Check if there are any redo operations available
    ///
    /// # Returns
    ///
    /// Returns `true` if redo is available, `false` otherwise.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use xi_integration::editor_wrapper::EditorWrapper;
    /// use xi_rope::Rope;
    ///
    /// let mut editor = EditorWrapper::new();
    /// editor.reload(Rope::from("Hello"));
    /// assert!(!editor.can_redo());
    ///
    /// editor.undo();
    /// assert!(editor.can_redo());
    /// ```
    pub fn can_redo(&self) -> bool {
        !self.redo_stack.is_empty()
    }

    /// Get the number of undo operations available
    ///
    /// # Returns
    ///
    /// Returns the size of the undo stack.
    pub fn undo_count(&self) -> usize {
        self.undo_stack.len()
    }

    /// Get the number of redo operations available
    ///
    /// # Returns
    ///
    /// Returns the size of the redo stack.
    pub fn redo_count(&self) -> usize {
        self.redo_stack.len()
    }

    /// Get a reference to the underlying Editor
    ///
    /// This provides access to the xi-core Editor for advanced operations.
    ///
    /// # Returns
    ///
    /// Returns a reference to the underlying Editor.
    pub fn editor(&self) -> &Editor {
        &self.editor
    }

    /// Get a mutable reference to the underlying Editor
    ///
    /// This provides mutable access to the xi-core Editor for advanced operations.
    /// Note: Direct modifications to the editor may not be tracked in undo/redo history.
    ///
    /// # Returns
    ///
    /// Returns a mutable reference to the underlying Editor.
    pub fn editor_mut(&mut self) -> &mut Editor {
        &mut self.editor
    }
}

impl Default for EditorWrapper {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_editor() {
        let editor = EditorWrapper::new();
        assert_eq!(editor.get_buffer().to_string(), "");
        assert!(!editor.can_undo());
        assert!(!editor.can_redo());
    }

    #[test]
    fn test_with_text() {
        let editor = EditorWrapper::with_text(Rope::from("Hello, World!"));
        assert_eq!(editor.get_buffer().to_string(), "Hello, World!");
        assert!(!editor.can_undo());
        assert!(!editor.can_redo());
    }

    #[test]
    fn test_reload() {
        let mut editor = EditorWrapper::new();
        
        editor.reload(Rope::from("Hello"));
        assert_eq!(editor.get_buffer().to_string(), "Hello");
        assert!(editor.can_undo());
        assert!(!editor.can_redo());
        
        editor.reload(Rope::from("Hello, World!"));
        assert_eq!(editor.get_buffer().to_string(), "Hello, World!");
        assert_eq!(editor.undo_count(), 2);
    }

    #[test]
    fn test_undo() {
        let mut editor = EditorWrapper::new();
        
        editor.reload(Rope::from("Hello"));
        editor.reload(Rope::from("Hello, World!"));
        
        assert!(editor.undo());
        assert_eq!(editor.get_buffer().to_string(), "Hello");
        assert!(editor.can_undo());
        assert!(editor.can_redo());
        
        assert!(editor.undo());
        assert_eq!(editor.get_buffer().to_string(), "");
        assert!(!editor.can_undo());
        assert!(editor.can_redo());
    }

    #[test]
    fn test_redo() {
        let mut editor = EditorWrapper::new();
        
        editor.reload(Rope::from("Hello"));
        editor.reload(Rope::from("Hello, World!"));
        editor.undo();
        
        assert!(editor.redo());
        assert_eq!(editor.get_buffer().to_string(), "Hello, World!");
        assert!(editor.can_undo());
        assert!(!editor.can_redo());
    }

    #[test]
    fn test_undo_redo_sequence() {
        let mut editor = EditorWrapper::new();
        
        editor.reload(Rope::from("A"));
        editor.reload(Rope::from("AB"));
        editor.reload(Rope::from("ABC"));
        
        // Undo twice
        editor.undo();
        editor.undo();
        assert_eq!(editor.get_buffer().to_string(), "A");
        
        // Redo once
        editor.redo();
        assert_eq!(editor.get_buffer().to_string(), "AB");
        
        // New edit clears redo stack
        editor.reload(Rope::from("ABX"));
        assert!(!editor.can_redo());
        assert_eq!(editor.get_buffer().to_string(), "ABX");
    }

    #[test]
    fn test_undo_limit() {
        let mut editor = EditorWrapper::new();
        
        // Add more than MAX_UNDO_HISTORY edits
        for i in 0..MAX_UNDO_HISTORY + 10 {
            editor.reload(Rope::from(format!("Edit {}", i)));
        }
        
        // Should only keep MAX_UNDO_HISTORY states
        assert_eq!(editor.undo_count(), MAX_UNDO_HISTORY);
    }

    #[test]
    fn test_can_undo_redo() {
        let mut editor = EditorWrapper::new();
        
        assert!(!editor.can_undo());
        assert!(!editor.can_redo());
        
        editor.reload(Rope::from("Hello"));
        assert!(editor.can_undo());
        assert!(!editor.can_redo());
        
        editor.undo();
        assert!(!editor.can_undo());
        assert!(editor.can_redo());
    }
}
