import React, { useCallback, useState, useEffect } from 'react'
import {useDropzone} from 'react-dropzone';

const LrcUploadDropzone = ({setSelectedFiles, selectedFiles}) => {
    const [noFiles, setNoFiles] = useState(true);

    useEffect(() => {
        if(Array.isArray(selectedFiles)){
            selectedFiles.length === 0 ? setNoFiles(true) : setNoFiles(false);
            return
        }
        selectedFiles ? setNoFiles(false) : setNoFiles(true);
    }, [selectedFiles])

    const onDrop = useCallback((files) => {
        setSelectedFiles(files);
    }, [setSelectedFiles, selectedFiles])

    const {acceptedFiles, getRootProps, getInputProps} = useDropzone({onDrop, multiple: false});
  
    return (
      <section className="container">
        {noFiles ? 
        <div {...getRootProps({className: 'dropzone'})} style={{display: "flex", justifyContent: "center", alignItems: "center", padding: "20px", border: "2px dashed #ccc" }}>
          <input {...getInputProps()} />
          <p style={{display: "flex", flexWrap: "wrap"}}>Drag 'n' drop your lrc file here, or click to select a file</p> 
        </div> : 
        <div>
          {/* <h4>File</h4> */}

          {selectedFiles.map(file => <p>{file.name}</p>)}
        </div>
        }
      </section>
    );
}

export default LrcUploadDropzone
