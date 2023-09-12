import React, { useCallback, useState } from 'react';
import FileInput from './components/FileInput';
import * as shp from 'shapefile';
import parse from 'dbf';
import tj from 'togeojson';
import './App.css';
import { convertGeoJSON } from './geojson2svg';
import MapNav from './components/MapNav';

function App() {
  const [inputError, setInputError] = useState<string>('');
  const [geoJsonData, setGeoJsonData] = useState<GeoJSON.GeoJSON | null>(null);

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
      setGeoJsonData(null);

      // Input File List
      const fileList: FileList | null = event.target.files;
      // New File List
      const files : File[] = [];
      if (fileList) {
        // Iterate and insert into a new file list.
        for (let i = 0; i < fileList.length; i += 1) {
          files.push(fileList[i]);
        }

        // Sort by file extension.
        files.sort(((a, b) => {
          const aFileExt : string | undefined = a.name.split('.').pop();
          const bFileExt : string | undefined = b.name.split('.').pop();
          if (aFileExt && bFileExt) {
            // Sort both file extensions alphabetically.
            if (aFileExt < bFileExt) {
              return -1;
            } else if (aFileExt > bFileExt) {
              return 1;
            }
          } else if (aFileExt && !bFileExt) {
            // Move file without no extension to the back.
            return -1;
          } else if (!aFileExt && bFileExt) {
            // Move file without no extension to the back.
            return 1;
          } else {
            // Sort file names alphabetically.
            if (a.name < b.name) {
              return -1;
            } else if (a.name > b.name) {
              return 1;
            }
          }
          return 0;
        }));
      }

      // Handle loading files.
      // TODO: Handle more file extensions listed in the accept string.
      // TODO: Verify files more rigorously (not through file extension).
      // TODO: Verify file combinations.
      const reader = new FileReader();
      if (files.length === 1 && files[0].name.split('.').pop() === 'json') {
        // Handle shape file conversion to GeoJSON.
        reader.onload = (e) => {
          const content = e.target?.result as string;
          const geojsonData = JSON.parse(content);
          setGeoJsonData(geojsonData);
        };
        reader.readAsText(files[0]);
      } else if (files.length === 1 && files[0].name.split('.').pop() === 'kml') {
        // Handle KML conversion to GeoJSON.
        reader.onload = (e) => {
          if (e.target?.result) {
            const parser = new DOMParser();
            const kml = parser.parseFromString(
              e.target.result as string,
              'text/xml'
            );
            const converted = tj.kml(kml);
            setGeoJsonData(converted);
          }
        };
        reader.readAsText(files[0]);
      } else if (files.length === 3 
          && files[0].name.split('.').pop() === 'dbf'
          && files[1].name.split('.').pop() === 'shp'
          && files[2].name.split('.').pop() === 'shx'
        ) {
          // Handle shape file conversion to GeoJSON.
          reader.onload = async (e) => {
            if (e.target?.result) {
              const arrayBuffer = e.target.result as ArrayBuffer;
              const result = await shp.read(arrayBuffer);
              setGeoJsonData(result);
            }
          };
          reader.readAsArrayBuffer(files[1]);

          // Handle DBF conversion to GeoJSON
          // TODO: Load both .shp and .dbf files together.
          /* reader.onload = (e) => {
            const buffer = e.target?.result as ArrayBuffer;
            const parsedData = parse(buffer);
            setGeoJsonData(parsedData.records);
          };
          reader.readAsArrayBuffer(files[0]); */
        } else if (files.reduce((acc, curr) => acc || /.(dbf|shp|shx)$/.test(curr.name), false)) {
          setInputError('To load a shape file, a .shp, .shx, and .dbf file must be included.');
        } else {
          setInputError('Can only load .shp, .shx, .dbf, .json, and .kml');
        }
    },
    []
  );

  return (
    <div className="App">
      <FileInput id="map-file-input" accept={accept} onChange={handleFiles}>
        Choose a Map to Render:
      </FileInput>
      {inputError ? <p>{inputError}</p> : ''}

      {geoJsonData &&
        ((): JSX.Element => {
          let converter = convertGeoJSON.createConverter(geoJsonData);
          let elements = converter.createSVG() as Array<JSX.Element>;
          return (
            <MapNav
              svgContent={elements}
              width={800}
              height={800}
              initialViewBox={converter.getBBox().join(' ')}
            />
          );
        })()}
    </div>
  );
}

export default App;
