import React from 'react';
import {useState, useEffect} from 'react';
import { parseLyrics, syncLyrics } from '../../utils/lrcParser';

const Lyrics = ({sounds, selectedTrack, setLrcContent, lrcContent, setLoading, loading, globalSeek}) => {
    const [displayedLyrics, setDisplayedLyrics] = useState("")
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
        const index = syncLyrics(lyrics, globalSeek);
        if(index == null) return;
        setDisplayedLyrics(lyrics[index].text);

    }

    useEffect(() => {
        displayCurrentLyrics();
    }, [globalSeek]);

    //   loading ? null : 

  return (
    <div>
        {loading ? <div>Loading...</div> : <div>{displayedLyrics}</div>}
    </div>
  )
}

export default Lyrics
