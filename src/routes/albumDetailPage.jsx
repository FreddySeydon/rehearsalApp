import React, { useEffect, useState } from 'react'
import { collection, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { Link, useParams, Outlet } from 'react-router-dom';
import DeleteSong from '../components/DeleteSong';
import { sortSongsList } from '../../utils/utils';
import "./albumDetailPage.css";

const AlbumDetailPage = () => {
    
    const {albumId} = useParams();
    const [selectedSong, setSelectedSong] = useState("");
    const [songs, setSongs] = useState([]);
    // const [fullAlbumData, setFullAlbumData] = useState();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchSongs = async () => {
        if (!albumId) return;
        setLoading(true);
        try {
          const songsSnapshot = await getDocs(collection(db, `albums/${albumId}/songs`));
          // const albumSnapshot = await getDoc(doc(db, `albums/${albumId}`));
          // setFullAlbumData(albumSnapshot.data());
          const songsList = [];
          songsSnapshot.forEach((songDoc) => {
            songsList.push({ id: songDoc.id, ...songDoc.data() });
          });
          const sortedSongsList = sortSongsList(songsList)
          setSongs(sortedSongsList);
          if (songsList.length > 0) {
            const lastSong = localStorage.getItem("selected-song")
            if(lastSong) {
              setSelectedSong(JSON.parse(localStorage.getItem('selected-song')))
              return
            }
            setSelectedSong(songsList[0].id); // Set the first song as the default selected song
          }
        } catch (error) {
          console.error("Error fetching songs:", error);
          setError(error)
          setLoading(false)
        } finally {
          setLoading(false);
        }
      };

      useEffect(() => {
        fetchSongs()
      }, [])

  return (
    <div style={{display: "flex", gap: 20}}>
        {loading ? 
            <div>Loading...</div> : error ? 
            <div>There was an error: {error}</div> : 
            <div className='glasstransparent' style={{display: 'flex', flexDirection: "column", gap: 10, padding: 20}}>
                {/* TODO: Fetch Album metadata to display here */}
                  <h2>Album: {albumId.split("_").map(word=>word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}</h2>
                   {songs.map((song) => {
                    return(
                      <div key={song.id} className='glassCard' style={{padding: 15}}>
                       <div>
                           <h4 style={{fontSize: 20, margin: 10, marginBottom: 15}}>{song.number} - {song.name}</h4>
                       </div>
                       <div style={{display: "flex", gap:10, justifyContent: "center", alignItems: "center", marginBottom: 10}}>
                    <DeleteSong albumId={albumId} songId={song.id} refetchAlbum={fetchSongs} />
                        <Link to={song.id}>
                    <button>Show Tracks</button>
                    </Link>
                    </div>
                    </div>
                    
                  )
                })} </div> }
                <Outlet />
    </div>
  )
}

export default AlbumDetailPage