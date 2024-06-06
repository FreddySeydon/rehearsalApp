import React, { useEffect, useState } from 'react'
import { collection, getDocs,  } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { Link, useParams } from 'react-router-dom';
import DeleteSong from '../components/DeleteSong';

const AlbumDetailPage = () => {
    
    const {albumId} = useParams();
    const [selectedSong, setSelectedSong] = useState("");
    const [songs, setSongs] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchSongs = async () => {
        if (!albumId) return;
        setLoading(true);
        try {
          const songsSnapshot = await getDocs(collection(db, `albums/${albumId}/songs`));
          const songsList = [];
          songsSnapshot.forEach((songDoc) => {
            songsList.push({ id: songDoc.id, ...songDoc.data() });
          });
          setSongs(songsList);
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
    <div>
        <h3>Album: {albumId}</h3>
        {loading ? 
            <div>Loading...</div> : error ? 
                <div>There was an error: {error}</div> : 
                   songs.map((song) => {
                    return(
                      <div>
                    <Link to={song.id}>
                       <div>
                           <h4>{song.number} - {song.name}</h4>
                       </div>
                    </Link>
                    <DeleteSong albumId={albumId} songId={song.id} refetchAlbum={fetchSongs} />
                    </div>
                    
                  )
                }) }
    </div>
  )
}

export default AlbumDetailPage
