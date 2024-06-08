import React from 'react'
import { deleteAlbum } from '../../utils/databaseOperations'

const DeleteAlbum = ({albumId, refetchAlbums}) => {
    const handleAlbumDelete = async () => {
        await deleteAlbum(albumId);
        await refetchAlbums();
    }

  return (
    <div>
      <button onClick={handleAlbumDelete} style={{background: "transparent", color: "darkred", border: "solid", borderWidth: 2}}>Delete Album</button>
    </div>
  )
}

export default DeleteAlbum
