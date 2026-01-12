# Review Companion Dashboard (SPA)

This is the Single Page Application (SPA) for the Review Companion System, built with React, TypeScript, and Vite.

## Prerequisites

-   **Node.js** (v18 or higher)
-   **Review Companion Service**: The backend service must be running locally on port 3000 for full functionality.

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

## Running the Application

1.  **Start Development Server**:
    ```bash
    npm run dev
    ```
    The application will be accessible at the URL shown in the terminal (usually `http://localhost:5173`).

## Verification

1.  **Open in Browser**:
    Navigate to the local URL (e.g., `http://localhost:5173`).

2.  **Verify Backend Connection**:
    Ensure the backend service is running. The application should be able to fetch data (e.g., leadership principles) from `http://localhost:3000`.

## Build for Production

To build the application for production:
```bash
npm run build
```
To preview the production build:
```bash
npm run preview
```
