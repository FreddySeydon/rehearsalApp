import React, { useCallback } from 'react'
import {useDropzone} from 'react-dropzone';

const FileUploadDropZone = ({setSelectedFiles, initializeTrackNames, initializeTrackNumbers}) => {
    const onDrop = useCallback((files) => {
        console.log(files)
        setSelectedFiles(files);
        initializeTrackNames(files);
        initializeTrackNumbers(files);
    }, [setSelectedFiles])

    const {acceptedFiles, getRootProps, getInputProps} = useDropzone({onDrop});
  
    return (
      <section className="container">
        <div {...getRootProps({className: 'dropzone'})}>
          <input {...getInputProps()} />
          <p>Drag 'n' drop some files here, or click to select files</p>
        </div>
        {/* <aside>
          <h4>Files</h4>
          <ul>{acceptedFiles}</ul>
        </aside> */}
      </section>
    );
}

export default FileUploadDropZone
