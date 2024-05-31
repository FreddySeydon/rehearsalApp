import React, { useEffect, useState } from 'react'
import { collection, getDocs,  } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { Link } from 'react-router-dom';

const AlbumsPage = () => {
    const [albums, setAlbums] = useState([])
    const [selectedAlbum, setSelectedAlbum] = useState("")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchAlbums = async () => {
        try {
          const collectionRef = collection(db, "albums")
          const albumsSnapshot = await getDocs(collectionRef);
          console.log("Albums snapshot: ", albumsSnapshot)
          const albumsList = [];
          albumsSnapshot.forEach((doc) => {
            albumsList.push({ id: doc.id, ...doc.data() });
          });
          setAlbums(albumsList);
          console.log("Albums list: ",albumsList)
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
          // setLoading(false);
        }
      };

      useEffect(() => {
        fetchAlbums()
      }, [])

  return (
    <div>
        <h3>Albums</h3>
        {loading ? 
            <div>Loading...</div> : error ? 
                <div>There was an error: {error}</div> : 
                   albums.map((album) => {
                    return(<Link to={album.id}>
                       <div>
                           <h4>{album.name}</h4>
                       </div>
                    </Link>)
                }) }
    </div>
  )
}

export default AlbumsPage
