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
import AlbumsPage from './routes/albumsPage.jsx'
import AlbumDetailPage from './routes/albumDetailPage.jsx'
import SongDetailPage from './routes/songDetailPage.jsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorPage />
  },
  {
    path: "/upload",
    element: <UploadPage />,
  },
  {
    path: "/albums",
    element: <AlbumsPage />,
    children: [
      {
        path: "/albums/:albumId",
        element: <AlbumDetailPage />,
      },

    ]
  },
  {
    path: "/albums/:albumId/:songId",
    element: <SongDetailPage />,
  }
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
