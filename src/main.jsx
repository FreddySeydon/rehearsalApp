import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import UploadPage from './routes/uploadPage.jsx'
import Root from './routes/root.jsx'
import ErrorPage from './error-page.jsx'
import {
  createBrowserRouter, RouterProvider
} from "react-router-dom"
import './index.css'

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorPage />
  },
  {
    path: "/upload",
    element: <UploadPage />,
  }
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
