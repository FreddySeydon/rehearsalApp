import React from 'react'
import ReactDOM from 'react-dom/client'
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
import LyricsEditorPage from './routes/lyricsEditorPage.jsx'
import LoginPage from './routes/loginPage.jsx'
import PlayerPage from './routes/playerPage.jsx'
import Navbar from './components/Navbar.jsx'
import { UserProvider } from './context/UserContext.jsx'
import { authLoader } from './loaders/authLoader.js'

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorPage />
  },
  {
    path: "/upload",
    element: <UploadPage />,
    loader: authLoader,
  },
  {
    path: "/albums",
    element: <AlbumsPage />,
    loader: authLoader,
  },
  {
    path: "/albums/:albumId",
    element: <AlbumDetailPage />,
    loader: authLoader,
    },
    
    {
      path: "/albums/:albumId/:songId",
      element: <SongDetailPage />,
      loader: authLoader,
    },
    {
      path: "/lyricseditor",
      element: <LyricsEditorPage />,
      loader: authLoader,
    },
    {
      path: "/player",
      element: <PlayerPage />,
      loader: authLoader,
    },
    {
      path: "/login",
      element: <LoginPage />,
    }
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <div>
  <React.StrictMode>
    <UserProvider>
      
    <RouterProvider router={router} />
    </UserProvider>
  </React.StrictMode>
  </div>
)
