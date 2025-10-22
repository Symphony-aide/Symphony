# Component Indexing for Frontend Intelligence

**Context:**

One of Symphony’s key differentiators is its intelligent code generation and orchestration capabilities. For frontend applications, models often struggle with visual-spatial understanding and component relationships unless they parse files deeply or receive enhanced prompts. Inspired by how tools like Figma MCP return structured layouts, we can greatly improve Symphony’s frontend output.

**Suggestion:**

Introduce a **Component Indexing Layer** in the generated frontend code. This indexing mechanism will capture and encode the **position, size, and relational attributes** of large UI components into a structured format (e.g., JSON). This structure allows Symphony’s models to **understand, reason, and manipulate UI layouts numerically** enhancing precision and global awareness.

**Key Benefits:**

- 📐 **Structured Layout Awareness**
    
    Models can understand the entire GUI layout via a lightweight JSON abstraction without parsing the actual UI files.
    
- 🤖 **Model-Friendly Communication**
    
    Instead of interpreting visual files, models can work directly with numeric representations—ideal for spatial reasoning and consistent referencing.
    
- ⚡ **Faster Multi-modal Inference**
    
    Similar to Figma’s structured return values, this will allow Symphony’s models to perform faster inference, layout diagnostics, and relationship mapping.
    

**Implementation Thoughts:**

- 🔍 **Bottom-Up Greedy Parsing**
    
    Use a bottom-up greedy strategy to build the hierarchy of large components by traversing the layout tree starting from leaf nodes.
    
- 🧵 **Parallel Parsing with Multi-threading**
    
    Since each component can be parsed independently, apply multithreading to index multiple parts of the page simultaneously.
    
- 📄 **Output Format**
    
    Example output:
    
    ```json
    {
      "Button1": {"x": 10, "y": 50, "parent": "CardA"},
      "CardA": {"x": 0, "y": 30, "children": ["Button1", "Text2"]},
      ...
    }
    ```
    

**Outcome Goal:**

Enable Symphony to generate frontend code that includes an **intelligent component index**, allowing downstream models to better analyze, refactor, or optimize the UI—without needing to “read” code files. This brings Symphony closer to a **Figma-like spatial intelligence** for its own generated GUIs.