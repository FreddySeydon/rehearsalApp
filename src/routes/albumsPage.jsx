import React, { useEffect, useState } from 'react'
import { collection, getDocs,  } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { Link, Outlet } from 'react-router-dom';
import DeleteAlbum from '../components/DeleteAlbum';
import "./albumDetailPage.css"
import { fetchAlbumsListSeperately } from '../../utils/databaseOperations';
import { fetchAlbumsList } from '../../utils/databaseOperations';
import { useUser } from '../context/UserContext';
import Navbar from '../components/Navbar';
import albumPlaceholder from '../assets/img/albumArtPlaceholder.jpg';
import { useMediaQuery } from 'react-responsive';

const AlbumsPage = () => {
    const [albums, setAlbums] = useState([])
    const [selectedAlbum, setSelectedAlbum] = useState("")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [noAlbums, setNoAlbums] = useState(true);

    const isTabletOrMobile = useMediaQuery({ query: "(max-width: 1224px)" });

    const {user, authLoading} = useUser();

    const fetchAlbums = async () => {
        try {
          const albumsList = await fetchAlbumsList(user);
          setAlbums(albumsList);
          // console.log("Albums list: ",albumsList)
          if(albumsList.length === 0){
            setNoAlbums(true)
            return
          }
          if (albumsList.length > 0) {
            setNoAlbums(false);
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

if(noAlbums){
  return <div><h2>Welcome to Chord Chaos!</h2><h3>Start by adding your first album</h3><Link to={'/sharecode'}><button className='glass'>Add First Album</button></Link></div>
}

  return (
    <div style={{display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", width: "90vw"}}>
    <div style={{display: "flex", gap: 20, width: '100%'}}>
        {loading ? 
            <div>Loading...</div> : error ? 
            <div>There was an error: {error}</div> : 
            <div style={{display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', width: "100%"}}>

            
                  <Link style={{margin: 10}} to='/sharecode'>
                  <button className='glass'>
              Add Album
                  </button>
              </Link>
            <div className='glasstransparent' style={{display: 'flex', justifyContent: 'center', alignItems:'center', flexDirection: "column", gap: 20, padding: 20, marginTop: 10, width: "85%"}}>
              <div>
                  <h3 style={{fontSize: "x-large", margin: 0}}>Albums</h3>
                  
              </div>
              <div style={{display: 'flex', gap: 10, flexDirection: isTabletOrMobile ? "column" : 'row', justifyContent: 'space-evenly', flexWrap: "wrap"}}>
                   {albums.map((album) => {
                    return(
                      <div key={album.id}  className='glasstransparent' style={{display: 'flex', flexDirection: "column", gap: 10, padding: 20, width: 200}}>
                      <Link to={album.id}>
                       <div>
                      <img src={album.coverImg ? album.coverImg : albumPlaceholder} alt="Album art" width={200} height={200} />
                           <h4 style={{fontSize: 20, margin: 10, marginBottom: 15}}>{album.name}</h4>
                       </div>
                    </Link>
                    {user.uid === album.ownerId ? <DeleteAlbum albumId={album.id} refetchAlbums={fetchAlbums}/> : null}
                    
                    </div>
                  )
                })} 
              </div>
                </div> </div> }
                {/* <Outlet/> */}
    </div>
    </div>
  )
}

export default AlbumsPage
