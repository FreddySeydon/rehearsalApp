import React, {useState, useEffect} from 'react'
import LrcEditor from '../components/LrcEditor'
import loadingSpinner from '../assets/img/loading.gif'
import { useParams, useSearchParams } from 'react-router-dom'

const LyricsEditorPage = () => {

    const [loading, setLoading] = useState(false);
    const [albumId, setAlbumId] = useState('')
    const [songId, setSongId] = useState('')
    const [trackId, setTrackId] = useState('')

    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        if(searchParams){
            setAlbumId(searchParams.get('albumId'))
           setSongId(searchParams.get('songId'))
            setTrackId(searchParams.get('trackId'))
        }
    }, [searchParams])



  return (
    <div>
        {
            loading ? 
                <img src={loadingSpinner} width={50} alt="" /> : 
                <div style={{display: "flex", justifyContent: "center", alignItems: "center", flexDirection: 'column', width: "100%"}}>
                    <LrcEditor albumId={albumId} songId={songId} trackId={trackId} searchParams={searchParams} setSearchParams={setSearchParams}/>
                    </div>
        }
    </div>
  )
}

export default LyricsEditorPage
