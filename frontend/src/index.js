import React from "react";
import ReactDOM from "react-dom/client";
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';  // <-- important: ensures Tailwind CSS is applied
import App from "./App";

// You can remove reportWebVitals if you’re not using analytics
// It’s not needed for your To-Do app
// import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Optional: comment this out if unused
// reportWebVitals();
