import React from 'react'
import ReactDOM from 'react-dom/client'
import UploadPage from './routes/uploadPage.jsx'
import Root from './routes/root.jsx'
import ErrorPage from './error-page.jsx'
import {
  createBrowserRouter, RouterProvider, Outlet
} from "react-router-dom"
import './index.css'
import AlbumsPage from './routes/albumsPage.jsx'
import AlbumDetailPage from './routes/albumDetailPage.jsx'
import SongDetailPage from './routes/songDetailPage.jsx'
import LyricsEditorPage from './routes/lyricsEditorPage.jsx'
import LoginPage from './routes/loginPage.jsx'
import PlayerPage from './routes/playerPage.jsx'
import ShareCodePage from './routes/shareCodePage.jsx'
import Navbar from './components/Navbar.jsx'
import { UserProvider } from './context/UserContext.jsx'
import { authLoader } from './loaders/authLoader.js'
import { useMediaQuery } from 'react-responsive'

function NavbarWrapper(){
  const isTabletOrMobile = useMediaQuery({ query: "(max-width: 1224px)" });

  // Define styles for desktop and mobile
  const navbarStyle = isTabletOrMobile ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    width: '100%', // Full width on mobile
    zIndex: 1000
  } : {
    position: 'fixed',
    top: "1%",
    left: "5%",
    right: "5%",
    // textAlign: 'center',
    width: '90%',
    zIndex: 1000,
    // margin: "auto"
  };

  const outletStyle = isTabletOrMobile ? {
    // paddingTop: 90, 
    // overflow: 'hidden'
  } : {
    paddingTop: 0
  };

  return(
    <div>
      <div style={navbarStyle}>
        <Navbar />
      </div>
      <div style={outletStyle}>
        <Outlet />
      </div>
    </div>
  )
}


const router = createBrowserRouter([
  {
    path:"/",
    element: <NavbarWrapper />,
    children:[

      {
        path: "/",
        element: <Root />,
        errorElement: <ErrorPage />
      },
      {
        path: "/upload",
        element: <UploadPage />,
        loader: authLoader,
        errorElement: <ErrorPage />
      },
      {
        path: "/albums",
        element: <AlbumsPage />,
        loader: authLoader,
        errorElement: <ErrorPage />
      },
      {
        path: "/albums/:albumId",
        element: <AlbumDetailPage />,
        loader: authLoader,
        errorElement: <ErrorPage />
        },
        
        {
          path: "/albums/:albumId/:songId",
          element: <SongDetailPage />,
          loader: authLoader,
          errorElement: <ErrorPage />
        },
        {
          path: "/lyricseditor",
          element: <LyricsEditorPage />,
          loader: authLoader,
          errorElement: <ErrorPage />
        },
        {
          path: "/player",
          element: <PlayerPage />,
          loader: authLoader,
          errorElement: <ErrorPage />
        },
        {
          path: "/sharecode",
          element: <ShareCodePage />,
          loader: authLoader,
          errorElement: <ErrorPage />
        },
    ]
  },
    {
      path: "/login",
      element: <LoginPage />,
      errorElement: <ErrorPage />
    }
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <UserProvider>
    <RouterProvider router={router} />
    </UserProvider>
  </React.StrictMode>
)
