import React, { useEffect, useState } from 'react'
import { collection, getDocs,  } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { Link, Outlet } from 'react-router-dom';
import DeleteAlbum from '../components/DeleteAlbum';
import "./albumDetailPage.css"
import { fetchAlbumsListSeperately } from '../../utils/databaseOperations';
import { fetchAlbumsList } from '../../utils/databaseOperations';
import { useUser } from '../context/UserContext';

const AlbumsPage = () => {
    const [albums, setAlbums] = useState([])
    const [selectedAlbum, setSelectedAlbum] = useState("")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const {user, authLoading} = useUser();

    const fetchAlbums = async () => {
        try {
          const albumsList = await fetchAlbumsList(user);
          setAlbums(albumsList);
          // console.log("Albums list: ",albumsList)
          if (albumsList.length > 0) {
            const lastUploadAlbum = localStorage.getItem("selected-upload-album")
            if(lastUploadAlbum) {
              setSelectedAlbum(JSON.parse(localStorage.getItem('selected-album')))
              return
            }
            setSelectedAlbum(albumsList[0].id); // Set the first album as the default selected album
          }
          setLoading(false)
        } catch (error) {
          console.error("Error fetching albums:", error);
          setError(error)
          setLoading(false)
        } finally {
          setLoading(false);
        }
      };

      useEffect(() => {
        if(user){
          fetchAlbums()
        }
      }, [user])

if(authLoading){
  return <div>Loading...</div>
}

  return (
    <div style={{display: "flex", gap: 20}}>
        {loading ? 
            <div>Loading...</div> : error ? 
            <div>There was an error: {error}</div> : 
            <div className='glasstransparent' style={{display: 'flex', flexDirection: "column", gap: 10, padding: 20}}>
                  <h3>Albums</h3>
                   {albums.map((album) => {
                    return(
                    <Link to={album.id} key={album.id}>
                    <div  className='glasstransparent' style={{display: 'flex', flexDirection: "column", gap: 10, padding: 20}}>
                       <div>
                           <h4 style={{fontSize: 20, margin: 10, marginBottom: 15}}>{album.name}</h4>
                       </div>
                    <DeleteAlbum albumId={album.id} refetchAlbums={fetchAlbums}/>
                    </div>
                    </Link>
                  )
                })} </div> }
                <Outlet/>
    </div>
  )
}

export default AlbumsPage
