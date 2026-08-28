# Loan Risk Assessment Frontend

This is a modern, responsive React frontend for the Loan Default Risk Assessment System.

## Features
- Clean, professional black & white theme
- Responsive two-column layout
- Real-time form validation
- Seamless integration with the existing FastAPI backend
- Clear display of predictions, probabilities, and SHAP risk factors

## Setup Instructions

1. **Install Dependencies**
   Navigate to this `frontend` directory and run:
   ```bash
   npm install
   ```

2. **Start the Development Server**
   ```bash
   npm run dev
   ```

3. **Access the Application**
   Open [http://localhost:5173](http://localhost:5173) in your browser.

## Backend Connection

This frontend is configured to communicate with the FastAPI backend running on `http://127.0.0.1:8000`. 
The Vite configuration (`vite.config.js`) includes a proxy for `/predict` to avoid any CORS issues without requiring modifications to your existing backend code.
