import { createRoot } from "react-dom/client";
import { HelmetProvider } from 'react-helmet-async';
import App from "./App";
import "./index.css";

// Add comprehensive logging for debugging
console.log("Application initializing - main.tsx");

// Check if the root element exists
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Error: Root element not found! Make sure you have an element with id 'root' in your HTML");
} else {
  console.log("Root element found, proceeding with React rendering");
  
  try {
    const root = createRoot(rootElement);
    console.log("React root created successfully");
    
    root.render(
      <HelmetProvider>
        <App />
      </HelmetProvider>
    );
    console.log("React rendering complete");
  } catch (error) {
    console.error("Error during React rendering:", error);
  }
}