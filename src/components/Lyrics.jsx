import React from 'react';
import {useState, useEffect} from 'react';
import { parseLyrics, syncLyrics } from '../../utils/lrcParser';
import OneLine from './OneLine';
import "./Lyrics.css"

const Lyrics = ({sounds, selectedTrack, setLrcContent, lrcContent, setLoading, loading, globalSeek, setGlobalSeek, setUserSeek, userSeek}) => {
    const [displayedLyrics, setDisplayedLyrics] = useState("")
    const [currentLyrics, setCurrentLyrics] = useState([])
    const [displayedLyricsIndex, setDisplayedLyricsIndex] = useState(0);

    useEffect(() => {
        const loadLrc = async () => {
          setLoading(true)
          const lrcLocation = sounds[selectedTrack][0].lrc
          const res = await fetch(lrcLocation);
          const lrc = await res.text();
          setLrcContent(lrc);
          setLoading(false)
        }
        loadLrc();
      }, [])

    const displayCurrentLyrics = () => {
        const lyrics = parseLyrics(lrcContent);
        setCurrentLyrics(lyrics);
        const index = syncLyrics(lyrics, globalSeek);
        setDisplayedLyricsIndex(index);
        if(index == null) return;
        setDisplayedLyrics(lyrics[index].text);

    }

    useEffect(() => {
        if(globalSeek == 0){
            setDisplayedLyrics("")
        }
        if(!loading){
            displayCurrentLyrics();
        } return
        
    }, [globalSeek]);


    const goToLyricsPosition = (position) => {
        setGlobalSeek(position);
        setUserSeek(!userSeek);
    }
 
  return (
    <div className="lyricsWrapper">
        {loading ? <div>Loading...</div> : <div style={{display: 'none'}}>{displayedLyrics}</div>}
        <div className="lyricsdisplay">
            Full Lyrics
            {currentLyrics.map((line, index) => {
                return <div> <OneLine line={line} index={index} goToLyricsPosition={goToLyricsPosition} displayedLyricsIndex={displayedLyricsIndex} /> </div>
            })}
        </div>
    </div>
  )
}

export default Lyrics
