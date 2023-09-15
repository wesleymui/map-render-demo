import React, { useCallback, useState } from 'react';
import FileInput from './components/FileInput';
import * as shp from 'shapefile';
import { Dbf } from 'dbf-reader';
import { DataTable } from 'dbf-reader/models/dbf-file';
import { Buffer } from 'buffer';
import tj from 'togeojson';
import './App.css';
import { convertGeoJSON } from './geojson2svg';
import MapNav from './components/MapNav';
import { Converter } from './geojson2svg/converter';
window.Buffer = Buffer;

function mergeData(gjson : GeoJSON.GeoJSON | null , dbf : DataTable| null) : GeoJSON.GeoJSON | null {
  console.log("MERGING DATA")
  console.log(gjson)
  console.log(dbf)
  if (!dbf && gjson) {
    return gjson
  }
  if (!gjson) {
    return null
  }
  // go through looking for features
  let featureNo = 0;
  function visit(gjson : GeoJSON.GeoJSON) {
    switch(gjson.type) {
      case 'Feature': {
        gjson.properties = dbf?.rows[featureNo]
        featureNo++;
        break;
      }
      case 'FeatureCollection': {
        for (let f of gjson.features) {
          visit(f)
        }
        break;
      }
        
      default:
          break;
    }
  }
  visit(gjson)
  return gjson
}



function App() {
  const [inputError, setInputError] = useState<string>('');
  // const [geoJsonData, setGeoJsonData] = useState<GeoJSON.GeoJSON | null>(null);
  const [converter, setConverter] = useState<Converter| null>(null)
  // const [dbfData, setDbfData] = useState<DataTable| null>(null);

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
      setConverter(null);

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
      if (files.length === 1 && files[0].name.split('.').pop() === 'json') {
        // Handle shape file conversion to GeoJSON.
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          const geojsonData = JSON.parse(content);
          setConverter(convertGeoJSON.createConverter(geojsonData))
        };
        reader.readAsText(files[0]);
      } else if (files.length === 1 && files[0].name.split('.').pop() === 'kml') {
        // Handle KML conversion to GeoJSON.
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            const parser = new DOMParser();
            const kml = parser.parseFromString(
              e.target.result as string,
              'text/xml'
            );
            const converted = tj.kml(kml);
            setConverter(convertGeoJSON.createConverter(converted))
          }
        };
        reader.readAsText(files[0]);
      } else if ( (files.length === 2 
          && files[0].name.split('.').pop() === 'dbf'
          && files[1].name.split('.').pop() === 'shp') || (files.length === 3
            && files[0].name.split('.').pop() === 'dbf'
            && files[1].name.split('.').pop() === 'shp' && files[2].name.split('.').pop() === 'shx' )
        ) {
          let gjson : GeoJSON.GeoJSON | null = null
          let dtable : DataTable | null = null
          // Handle shape file conversion to GeoJSON.
          const shpReader = new FileReader();
          shpReader.onload = async (e) => {
            if (e.target?.result) {
              const arrayBuffer = e.target.result as ArrayBuffer;
              gjson = await shp.read(arrayBuffer);
              let result = mergeData(gjson, dtable)
              if (result) {
                setConverter(convertGeoJSON.createConverter(result));
              }
              
            }
          };
          shpReader.readAsArrayBuffer(files[1]);

          // Handle DBF conversion to GeoJSON
          const dbfReader = new FileReader();
          dbfReader.onload = () => {
            var arrayBuffer: ArrayBuffer = dbfReader.result as ArrayBuffer;
            if (arrayBuffer) {
              let buffer: Buffer = Buffer.from(arrayBuffer);
              dtable = Dbf.read(buffer);
              let result = mergeData(gjson, dtable)
              if (result) {
                setConverter(convertGeoJSON.createConverter(result));
              }
            }
          };
          dbfReader.readAsArrayBuffer(files[0]);
        } else if (files.reduce((acc, curr) => acc || /.(dbf|shp)$/.test(curr.name), false)) {
          setInputError('To load a shape file map, upload 1 .shp, and 1 .dbf file.');
        } else {
          setInputError('To load a map, upload 1 combination of .shp and .dbf file, 1 .json file, or 1 .kml file.');
        }
    },
    [],
  );

  return (
    <>
    <div className="App">
      <FileInput id="map-file-input" accept={accept} onChange={handleFiles}>
        Choose a Map to Render:
      </FileInput>
      {inputError ? <p>{inputError}</p> : ''}
      {converter &&
        <MapNav
            svgContent={converter.createSVG(0.7)}
            width={800}
            height={800}
            initialViewBox={converter.getBBox().join(' ')}
        />
        }
        <div  
            id="countryTextLabel"
            style={{
                pointerEvents: "none",
                // visibility: "hidden",
                // fontSize: `${STROKE_WIDTH * 10}px`,
                textAnchor: "middle",
                dominantBaseline: "middle",
                position: "fixed",
                backgroundColor: "white",
                // width: "300px",
                // height: "300px",
            }}
        >
        </div>
    </div>
    </>
  );
}

export default App;
