import React, {useState, useEffect} from 'react'
import LrcEditor from '../components/LrcEditor'
import loadingSpinner from '../assets/img/loading.gif'
import { useParams, useSearchParams } from 'react-router-dom'
import { useMediaQuery } from 'react-responsive'

const LyricsEditorPage = () => {

    const [loading, setLoading] = useState(false);
    const [albumId, setAlbumId] = useState('')
    const [songId, setSongId] = useState('')
    const [trackId, setTrackId] = useState('')

    const [searchParams, setSearchParams] = useSearchParams();

    const isTabletOrMobile = useMediaQuery({ query: "(max-width: 1224px)" });

    useEffect(() => {
        if(searchParams){
            setAlbumId(searchParams.get('albumId'))
           setSongId(searchParams.get('songId'))
            setTrackId(searchParams.get('trackId'))
        }
    }, [searchParams])



  return (
    <div style={{width: '90vw', overflow: 'hidden', paddingTop: isTabletOrMobile ? 80 : 0, maxHeight: isTabletOrMobile ? null : "90vh"}}>
        {
            loading ? 
                <img src={loadingSpinner} width={50} alt="Loading" /> : 
                <div style={{display: "flex", justifyContent: "center", alignItems: "center", flexDirection: 'column', width: "100%", overflow: 'hidden'}}>
                    <LrcEditor albumId={albumId} songId={songId} trackId={trackId} searchParams={searchParams} setSearchParams={setSearchParams}/>
                    </div>
        }
    </div>
  )
}

export default LyricsEditorPage
