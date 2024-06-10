import React, {useState, useEffect} from 'react'
import LrcEditor from '../components/LrcEditor'
import loadingSpinner from '../assets/img/loading.gif'
import { useParams } from 'react-router-dom'

const LyricsEditorPage = () => {

    const [loading, setLoading] = useState(false);
    const [tracks, setTracks] = useState([]);

    const {songId, albumId} = useParams();



  return (
    <div>
        {
            loading ? 
                <img src={loadingSpinner} width={50} alt="" /> : 
                    <LrcEditor albumId={albumId} songId={songId}/>
        }
    </div>
  )
}

export default LyricsEditorPage
