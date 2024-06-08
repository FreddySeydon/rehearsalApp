import React, { useCallback } from 'react'
import {useDropzone} from 'react-dropzone';

const FileUploadDropZone = ({setSelectedFiles, selectedFiles, initializeTrackNames, initializeTrackNumbers}) => {
    const onDrop = useCallback((files) => {
      if(selectedFiles.length === 0){
        setSelectedFiles(files);
        initializeTrackNames(files);
        initializeTrackNumbers(files);
      } else {
        setSelectedFiles((...prev) => [...prev, ...files]);
        initializeTrackNames(files);
        initializeTrackNumbers(files);
      }
    }, [setSelectedFiles, selectedFiles])

    const {acceptedFiles, getRootProps, getInputProps} = useDropzone({onDrop});
  
    return (
      <section className="container">
        {selectedFiles.length === 0 ? 
        <div {...getRootProps({className: 'dropzone'})} style={{minHeight: 250, display: "flex", justifyContent: "center", alignItems: "center", padding: "20px", border: "2px dashed #ccc" }}>
          <input {...getInputProps()} />
          <p>Drag 'n' drop some files here, or click to select files</p>
        </div> : null
        }
        {/* <aside>
          <h4>Files</h4>
          <ul>{acceptedFiles}</ul>
        </aside> */}
      </section>
    );
}

export default FileUploadDropZone
