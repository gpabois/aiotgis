import { App } from "./app";
import React from 'react' 
import { createRoot } from 'react-dom/client';

const rootElement = document.getElementById("root")
createRoot(rootElement).render(<App/>);