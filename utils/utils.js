export const sortSongsList = (songsList) => {
    songsList.sort((a, b) => {
      const numberA = String(a.number).match(/\d+/g) ? parseInt(String(a.number).match(/\d+/g)[0]) : 0;
      const numberB = String(b.number).match(/\d+/g) ? parseInt(String(b.number).match(/\d+/g)[0]) : 0;
    
      if (numberA < numberB) return -1;
      if (numberA > numberB) return 1;
    
      const letterA = String(a.number).match(/[a-zA-Z]+/g) ? String(a.number).match(/[a-zA-Z]+/g)[0] : '';
      const letterB = String(b.number).match(/[a-zA-Z]+/g) ? String(b.number).match(/[a-zA-Z]+/g)[0] : '';
    
      return letterA.localeCompare(letterB);
    });
    return songsList;
  }