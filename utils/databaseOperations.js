import React from "react";
import { getStorage, ref, deleteObject, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, collection, getDoc, deleteDoc, getDocs, updateDoc, arrayUnion, where, query } from "firebase/firestore";
import { db } from "./firebase";

const MAX_STORAGE_LIMIT_MB = import.meta.env.VITE_MAX_STORAGE_LIMIT_MB

export const deleteSong = async (albumId, songId) => {
  console.log("Delete Song invoked: ", albumId, songId)

    const storage = getStorage();

  // Step 1: Read the document
  const songRef = doc(db, "albums", albumId, "songs", songId);
  const songSnap = await getDoc(songRef);

  if (songSnap.exists()) {
    const songData = songSnap.data();
    const lrcArray = songData.lrcs ? songData.lrcs : null;

    // Step 2: Delete each track's audio file and LRC file from Firebase Storage
    for (const track of songData.tracks) {
      const trackSrc = track.src;
      const trackLrc = lrcArray ? lrcArray.find(lrc => lrc.trackId === track.id).lrc : null;

      if (trackSrc) {
        const trackFileRef = ref(storage, trackSrc);
        await deleteObject(trackFileRef).catch((error) => {
          console.error("Error deleting audio file:", error);
        });
      }

      if (trackLrc) {
        const lrcFileRef = ref(storage, trackLrc);
        await deleteObject(lrcFileRef).catch((error) => {
          console.error("Error deleting LRC file:", error);
        });
      }
    }

    // Step 3: Delete the song document from Firestore
    await deleteDoc(songRef);

    console.log("Song and all its tracks deleted successfully!");

  } else {
    console.log("No such document!");
  }
    
  
};

export const deleteAlbum = async(albumId) => {
  console.log("Delete Album invoked: ", albumId)
    try {
        const albumRef = doc(db, "albums", albumId);
        console.log("Delete Album Ref: ", albumRef)
        const albumSnap = await getDoc(albumRef);
        console.log("Delete Album albumSnap: ", albumSnap)
        
        if (albumSnap.exists()) {
            const songsSnap = await getDocs(collection(albumRef, "songs"))
            const songsList = [];
          songsSnap.forEach((song) => {
            songsList.push({ id: song.id, ...song.data() });
          });
          const albumData = albumSnap.data();
          // console.log("OP Album Data: ",albumData)
          // const songsData = songsSnap.data();
          console.log("OP Songs data: ", songsList)
          songsList.forEach(async (song) => await deleteSong(albumId , song.id))
          await deleteDoc(albumRef);
        }
        
    } catch (error) {
        console.error("There was an error deleting the album: ", error);
    }
}


export const updateLrc = async (newFile, albumId, songId, trackId, trackName, user, fullySynced) => {
  try {
    if (!newFile) {
      throw new Error("You have to choose a file");
    }

    const storage = getStorage();
    const trackIdInt = trackId;

    // Step 1: Read the document
    const songRef = doc(db, "albums", albumId, "songs", songId);
    const songSnap = await getDoc(songRef);

    if (!songSnap.exists()) {
      throw new Error("No such document!");
    }

    const songData = songSnap.data();
    const lrc = songData?.lrcs?.find((lrc) => lrc.trackId === trackIdInt);
    const version = lrc ? parseInt(lrc.version) + 1 : 1;

    const oldSrc = lrc ? lrc.lrc : null;

    const sharedWith = songData.sharedWith ? songData.sharedWith : [];

    // Step 2: Upload the new file to Firebase Storage
    const newFileName = `${songId}_${trackName}_track-${trackId}_v${version}.lrc`;
    const storageRef = ref(
      storage,
      `sounds/${albumId}/${songId}/${newFileName}`
    );

    const uploadTask = uploadBytesResumable(storageRef, newFile, {
      customMetadata: {
        ownerId: user.uid,
        ownerName: user.displayName,
        sharedWith: sharedWith.join(',')
      },
      contentType: 'text/plain'
    });

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Progress monitoring
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log("Upload is " + progress + "% done");
        },
        (error) => {
          console.error("Upload failed:", error);
          reject({ result: 'error', message: `Upload failed: ${error.message}` });
        },
        async () => {
          const newSrc = await getDownloadURL(uploadTask.snapshot.ref);

          // Step 3: Delete the old file from Firebase Storage
          if (oldSrc) {
            const oldFileRef = ref(storage, oldSrc);
            await deleteObject(oldFileRef).catch((error) => {
              console.error("Error deleting old file:", error);
            });
          }

          // Step 4: Update Firestore document with the new file path
          if (oldSrc) {
            const updatedLrcs = songData.lrcs.map((lrc) => {
              if (lrc.trackId === trackIdInt) {
                return { ...lrc, lrc: newSrc, version: version, updaterId: user.uid, updaterName: user.displayName, fullySynced: fullySynced };
              }
              return lrc;
            });

            await updateDoc(songRef, { lrcs: updatedLrcs });
          } else {
            const lrcToUpload = { trackId: trackId, trackName: trackName, lrc: newSrc, version: version, ownerId: user.uid, ownerName: user.displayName, fullySynced: fullySynced };
            await updateDoc(songRef, {
              lrcs: arrayUnion(lrcToUpload)
            });
          }

          console.log("LRC updated successfully!");
          resolve({ result: 'success', message: 'LRC updated successfully' });
        }
      );
    });
  } catch (error) {
    console.error("Error in updateLrc:", error);
    return { result: 'error', message: error.message };
  }
};

export const fetchAlbumsList = async (user) => {
  const albumsList = [];

    const collectionRef = collection(db, "albums");
    const albumsQuery = query(
      collectionRef,
      where('sharedWith', 'array-contains', user.uid)
    );
    const ownedAlbumsQuery = query(
      collectionRef,
      where('ownerId', '==', user.uid)
    );

    const [albumsSnapshot, ownedAlbumsSnapshot] = await Promise.all([
      getDocs(albumsQuery),
      getDocs(ownedAlbumsQuery)
    ]);

    albumsSnapshot.forEach((doc) => {
      albumsList.push({ id: doc.id, ...doc.data() });
    });

    ownedAlbumsSnapshot.forEach((doc) => {
      albumsList.push({ id: doc.id, ...doc.data() });
    });
  return albumsList;
  }

  export const fetchAlbumsListSeperately = async (user) => {
    const sharedAlbumsList = [];
    const ownedAlbumsList = [];
  
      const collectionRef = collection(db, "albums");
      const albumsQuery = query(
        collectionRef,
        where('sharedWith', 'array-contains', user.uid)
      );
      const ownedAlbumsQuery = query(
        collectionRef,
        where('ownerId', '==', user.uid)
      );
  
      const [albumsSnapshot, ownedAlbumsSnapshot] = await Promise.all([
        getDocs(albumsQuery),
        getDocs(ownedAlbumsQuery)
      ]);
  
      albumsSnapshot.forEach((doc) => {
        sharedAlbumsList.push({ id: doc.id, ...doc.data() });
      });
  
      ownedAlbumsSnapshot.forEach((doc) => {
        ownedAlbumsList.push({ id: doc.id, ...doc.data() });
      });
    return {sharedAlbumsList, ownedAlbumsList}
    }

export const fetchSongsList = async (user, albumId) => {
  const albumRef = collection(db, "albums", albumId, "songs");
      const songsQuery = query(
        albumRef,
        where('sharedWith', 'array-contains', user.uid)
      )
      const ownedSongsQuery = query(
        albumRef,
        where('ownerId', '==', user.uid)
      )
      const [songsSnapshot, ownedSongsSnapshot] = await Promise.all([
        getDocs(songsQuery),
        getDocs(ownedSongsQuery)
      ])
      const songsList = [];
      songsSnapshot.forEach((doc) => {
        songsList.push({ id: doc.id, ...doc.data() });
      });
      ownedSongsSnapshot.forEach((doc) => {
        songsList.push({ id: doc.id, ...doc.data() });
      });
      return songsList
}