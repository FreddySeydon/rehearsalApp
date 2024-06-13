import React, {useState, useEffect} from 'react'
import LrcEditor from '../components/LrcEditor'
import loadingSpinner from '../assets/img/loading.gif'
import { useParams, useSearchParams } from 'react-router-dom'

const LyricsEditorPage = () => {

    const [loading, setLoading] = useState(false);
    const [tracks, setTracks] = useState([]);

    // const {songId, albumId, trackId} = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    console.log("Search params: ",searchParams.get('albumId'))
    const albumId = searchParams.get('albumId');
    const songId = searchParams.get('songId');
    const trackId = searchParams.get('trackId');



  return (
    <div>
        {
            loading ? 
                <img src={loadingSpinner} width={50} alt="" /> : 
                    <LrcEditor albumId={albumId} songId={songId} trackId={trackId} searchParams={searchParams} setSearchParams={setSearchParams}/>
        }
    </div>
  )
}

export default LyricsEditorPage
