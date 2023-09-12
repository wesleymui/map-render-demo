import React, { useCallback, useState, useEffect } from 'react';
import FileInput from './components/FileInput';
import * as shp from 'shapefile';
import parse from 'dbf';
import tj from 'togeojson';
import './App.css';

function App() {
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [inputError, setInputError] = useState<string>('');
  const [geoJsonData, setGeoJsonData] = useState<GeoJSON.GeoJSON | null>(null);

  // A list of all accepted file types.
  const accept : string = '.shp, .shx, .dbf, ' // Shape Files
    + '.json, .geojson, application/geo+json, ' // GeoJSON Files
    + '.kml, .kmz, application/vnd.google-earth.kml+xml, ' // Keyhole Files
      + 'application/vnd.google-earth.kmz';

  const handleFiles = useCallback(
    (event : React.ChangeEvent<HTMLInputElement>) => {
      // Cleanup.
      setInputError('');
      fileUrls.forEach((file : string) => URL.revokeObjectURL(file));

      // Load each new file as a blob URL.
      const fileList : FileList | null = event.target.files;
      if (fileList) {
        // Validate File Types.
        // TODO: Handle more file extensions listed in the accept string.
        // TODO: Verify files more rigorously (not through file extension).
        // TODO: Verify file combinations.
        for (let i = 0; i < fileList.length; i += 1) {
          if (!/.(shp|dbf|json|kml)/.test(fileList[i].name)) {
            setInputError('File types must be .shp, .dbf, .json, or .kml');
            return;
          }
          const reader = new FileReader();
          // Handle shapefile conversion to GeoJSON
          if (/.shp/.test(fileList[i].name)) {
              reader.onload = async (e) => {
                  if (e.target?.result) {
                      const arrayBuffer = e.target.result as ArrayBuffer;
                      const result = await shp.read(arrayBuffer);
                      setGeoJsonData(result);
                  }
              };
              reader.readAsArrayBuffer(fileList[i]);
          }
          // Handle KML conversion to GeoJSON
          else if (/.kml/.test(fileList[i].name)) {
              reader.onload = (e) => {
                  if (e.target?.result) {
                      const parser = new DOMParser();
                      const kml = parser.parseFromString(e.target.result as string, 'text/xml');
                      const converted = tj.kml(kml);
                      setGeoJsonData(converted);
                  }
              };
              reader.readAsText(fileList[i]);
          }
          // Handle JSON conversion to GeoJSON
          else if (/.json/.test(fileList[i].name)) {
              reader.onload = (e) => {
                const content = e.target?.result as string;
                const geojsonData = JSON.parse(content);
                setGeoJsonData(geojsonData);
              };
              reader.readAsText(fileList[i]);
          }
          // Handle DBF conversion to GeoJSON
          else if (/.dbf/.test(fileList[i].name)) {
              reader.onload = (e) => {
                const buffer = e.target?.result as ArrayBuffer;
                const parsedData = parse(buffer);
                setGeoJsonData(parsedData.records);
              }
              reader.readAsArrayBuffer(fileList[i]);
          }
        }

        const newFileUrls : string[] = [];
        for (let i = 0; i < fileList.length; i += 1) {
          newFileUrls.push(URL.createObjectURL(fileList[i]));
        }
        setFileUrls(newFileUrls);
      } else {
        // TODO: Warn the user that the file list is null.
      }
    },
    [setInputError, fileUrls, setFileUrls],
  );


  return (
    <div className="App">
      <FileInput id="map-file-input" accept={accept} onChange={handleFiles}>
        Choose a Map to Render:
      </FileInput>
      { inputError ? <p>{inputError}</p> : '' }
      {geoJsonData && (
                <pre>
                    {JSON.stringify(geoJsonData, null, 2)}
                </pre>
      )}
    </div>
  );
}

export default App;
