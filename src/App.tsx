import React, { useCallback, useState, useEffect } from 'react';
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
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [inputError, setInputError] = useState<string>('');
  const [geoJsonData, setGeoJsonData] = useState<GeoJSON.GeoJSON | null>(null);
  const [converter, setConverter] = useState<Converter| null>(null)
  const [dbfData, setDbfData] = useState<DataTable| null>(null);

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
        let gjson : null | GeoJSON.GeoJSON = null;
        let dtable : null | DataTable = null
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
                let result = await shp.read(arrayBuffer);
                gjson = result
                result = mergeData(result, dtable)
                setGeoJsonData(result);
                if (result !== null) {
                  setConverter(convertGeoJSON.createConverter(result))
                }
                
              }
            };
            reader.readAsArrayBuffer(fileList[i]);
          }
          // Handle KML conversion to GeoJSON
          else if (/.kml/.test(fileList[i].name)) {
            reader.onload = (e) => {
              if (e.target?.result) {
                const parser = new DOMParser();
                const kml = parser.parseFromString(
                  e.target.result as string,
                  'text/xml'
                );
                const converted = tj.kml(kml);
                setGeoJsonData(converted);
                setConverter(convertGeoJSON.createConverter(converted))
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
              setConverter(convertGeoJSON.createConverter(geojsonData))
            };
            reader.readAsText(fileList[i]);
          }
          // Handle DBF conversion to GeoJSON
          else if (/.dbf/.test(fileList[i].name)) {
              reader.readAsArrayBuffer(fileList[i]);
              reader.onload = () => {
                var arrayBuffer: ArrayBuffer = reader.result as ArrayBuffer;
                if (arrayBuffer) {
                  let buffer: Buffer = Buffer.from(arrayBuffer);
                  let datatable:DataTable = Dbf.read(buffer);
                  let merged = mergeData(gjson, datatable)
                  dtable = datatable
                  setDbfData(datatable);
                  setGeoJsonData(merged)
                  if (merged !== null) {
                    setConverter(convertGeoJSON.createConverter(merged))
                  } 
                 
                }
              };
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

  return (
    <>
    <script type="text/javascript" src="smil-in-javascript.js"></script>
    <script type="text/javascript" src="web-animations.js"></script>
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
