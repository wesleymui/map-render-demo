import React, { useCallback, useState } from 'react';
import FileInput from './components/FileInput';
import MapNav from './components/MapNav';
import './App.css';

function App() {
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [inputError, setInputError] = useState<string>('');

  // A list of all accepted file types.
  const accept: string =
    '.shp, .shx, .dbf, ' + // Shape Files
    '.json, .geojson, application/geo+json, ' + // GeoJSON Files
    '.kml, .kmz, application/vnd.google-earth.kml+xml, ' + // Keyhole Files
    'application/vnd.google-earth.kmz';

  const handleFiles = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      // Cleanup.
      setInputError('');
      fileUrls.forEach((file: string) => URL.revokeObjectURL(file));

      // Load each new file as a blob URL.
      const fileList: FileList | null = event.target.files;
      if (fileList) {
        // Validate File Types.
        // TODO: Handle more file extensions listed in the accept string.
        // TODO: Verify files more rigorously (not through file extension).
        // TODO: Verify file combinations.
        for (let i = 0; i < fileList.length; i += 1) {
          if (!/.(shp|dbf|json|kml)/.test(fileList[0].name)) {
            setInputError('File types must be .shp, .dbf, .json, or .kml');
            return;
          }
        }

        const newFileUrls: string[] = [];
        for (let i = 0; i < fileList.length; i += 1) {
          newFileUrls.push(URL.createObjectURL(fileList[i]));
        }
        setFileUrls(newFileUrls);
      } else {
        // TODO: Warn the user that the file list is null.
      }
    },
    [setInputError, fileUrls, setFileUrls]
  );
  const mapSvg = <rect x="20" y="20" width="60" height="40" fill="blue" />;
  return (
    <div className="App">
      <MapNav
        svgContent={mapSvg}
        width={500}
        height={500}
        viewBox="0 0 100 100"
      />
      <FileInput id="map-file-input" accept={accept} onChange={handleFiles}>
        Choose a Map to Render:
      </FileInput>
      {inputError ? <p>{inputError}</p> : ''}
    </div>
  );
}

export default App;
