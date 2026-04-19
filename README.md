# HR Workflow Designer

A modern, drag-and-drop user interface for HR administrators to visually design, test, and manage internal company workflows. Built with a powerful and scalable tech stack including Next.js, React Flow, Zustand, and TypeScript.

![screenshots](public/ss.png)
 

***

## Features

-   **Visual Drag & Drop Canvas**: Intuitive interface for building complex workflows.
-   **Custom Node Library**: Specialized nodes for Starts, Ends, Manual Tasks, Approvals, and Automated Actions.
-   **Dynamic Configuration Panel**: A context-aware side panel that displays editable forms for any selected node or edge.
-   **State-of-the-Art UX**:
    -   Undo/Redo history for all actions.
    -   Right-click context menus for adding/deleting nodes and edges.
    -   Node-on-edge dropping to automatically split connections.
    -   Resizable and minimizable side/bottom panels for maximum canvas space.
-   **Workflow Management**:
    -   **Auto-Layout**: Instantly organize a messy workflow into a clean tree structure with one click.
    -   **Import/Export**: Save and load entire workflow graphs as JSON files.
    -   **Unsaved Progress Warnings**: Browser-native warnings prevent accidental data loss from refreshes or tab closures.
    -   **Custom Warning Modals**: User-friendly popups to confirm overwriting the canvas with templates or imports.
-   **Sandbox & Testing**: An integrated terminal to simulate workflow execution and view mock logs.
-   **Customization**: Change the color of nodes and connection lines directly from the context menu.

***

## Architecture

This project is built as a highly interactive, client-side single-page application. The architecture prioritizes a clean separation of concerns, scalability, and an excellent developer experience.

```
                  [ Zustand (Global State Store) ]
                           ^          |          ^
                           | (Actions)  | (State)  | (Actions)
                           |          V          |
  [ Sidebar ] <-----> [ React Flow Canvas ] <-----> [ Config Panel ]
  (Draggable Nodes,         (Nodes, Edges,             (Dynamic Forms,
   Templates)               Context Menus)             Node Data Editor)
                                  |
                                  V
                           [ Sandbox Panel ]
                           (Simulation, Logs)
```

-   **Framework**: **Next.js 14 (App Router)** is used for its robust project structure and performance optimizations, though this prototype operates entirely as a client-side application (`"use client"`).

-   **Canvas Rendering**: **React Flow** is the core library responsible for rendering the nodes and edges, handling panning, zooming, and connection logic. It's highly performant and extensible.

-   **State Management**: **Zustand** acts as the single source of truth for the entire application. It stores the `nodes` and `edges` arrays and exposes actions to manipulate them. This centralized, lightweight approach is perfect for managing the complex, shared state of the graph and makes features like **Undo/Redo** straightforward to implement via state history snapshots.

-   **Component Modularity**:
    -   **Custom Nodes** (`/components/Nodes`): Each node is a self-contained React component with its own unique shape, style, and logic.
    -   **Panels** (`/components`): The `Sidebar`, `ConfigPanel`, and `SandboxPanel` are independent components that react to or modify the central Zustand store.
    -   **Logic** (`/lib`): Utility functions, such as the Dagre-based auto-layout algorithm, are kept separate.

-   **Styling**: **Tailwind CSS** is used for its utility-first approach, enabling rapid, consistent, and maintainable styling directly within the components.

***

## How to Run Locally

Follow these steps to get the project running on your local machine.

**Prerequisites:**
-   Node.js (v18.x or later)
-   npm or yarn

**Installation & Setup:**

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/mahespaulj/hr-workflow-designer.git
    cd hr-workflow-designer
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```

4.  **Open the application:**
    Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

***

## Design Decisions

Several key decisions were made to ensure the application is robust, user-friendly, and maintainable.

1.  **Centralized State with Zustand**: Instead of prop-drilling or using React Context for the graph state, Zustand was chosen for its simplicity and performance. It eliminates boilerplate and provides a clean, hook-based API to access and modify the workflow from any component, which is critical for an app with so many interactive parts.

2.  **WYSIWYG Sidebar**: The elements in the "Toolbox" sidebar are not just labels; they are miniature, styled replicas of the actual nodes. This "What You See Is What You Get" approach is more intuitive for the user than just reading text labels.

3.  **Client-Side Prototyping**: The entire application logic runs in the browser. This was a deliberate decision to focus on building a rich, interactive user interface without the overhead of a backend during the prototyping phase. The `exportJSON` function serves as a stand-in for a database save.

4.  **User Experience First**: Significant effort was invested in "polish" features that define a professional application:
    -   The resizable panels acknowledge that users need to customize their workspace.
    -   The unsaved progress warnings respect the user's work.
    -   The context menus provide power-user shortcuts, reducing mouse travel and clicks.
    -   The "Save Backup & Proceed" option in the warning modal is a thoughtful feature that prevents data loss while still allowing the user to move forward quickly.

<!-- 
[SS-PLACEHOLDER]: Add a screenshot showing the dynamic Config Panel. 
Select an "Approval" node on the canvas to show its specific form fields.
-->
 

***

## Completed vs. Future Work

This project serves as a robust prototype. It successfully implements the core features of a visual workflow editor.

#### ✅ Completed

-   Full-featured drag-and-drop canvas with 5 custom node types.
-   Complete dynamic configuration panel for all node properties.
-   Robust state management with Undo/Redo.
-   Advanced UX features: auto-layout, context menus, edge splitting, color customization.
-   JSON import/export with progress-protection modals.
-   Resizable and minimizable UI panels.
-   Mock API simulation and logging panel.

#### 🚀 Future Enhancements (With More Time)

-   **Real Backend Integration**: Connect the application to a real database (e.g., PostgreSQL or MongoDB) via a Node.js/Express or Next.js API route to persist workflows, manage user accounts, and handle authentication.
-   **Real-Time Collaboration**: Integrate a library like Liveblocks or a WebSocket implementation to allow multiple users to edit the same workflow simultaneously, similar to Figma.
-   **Advanced Workflow Validation**: Implement a more sophisticated validation engine that can detect more complex issues (e.g., unreachable nodes, incorrect data types in parameters) and visually flag the errors directly on the nodes.
-   **Live Action Execution**: Connect the "Automated Step" node to real third-party APIs (e.g., SendGrid for email, Jira for tickets, Slack for notifications) to execute the workflows for real.
-   **Comprehensive Testing**: Add a suite of unit tests with Jest/RTL and end-to-end tests with Cypress or Playwright to ensure application stability.
-   **Accessibility (a11y)**: Improve keyboard navigation and screen reader support to make the application usable for everyone.