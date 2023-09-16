# Map Render Demo

### Installation
Run `npm i` to install relevant node dependencies. To start the server, run `npm run start`.

### Testing
Included in this project directory is a director named `maps/`. `maps/` contains three subdirectories named `geojson/`, `kml/`, and `shapefile/`, which each contain geojson files, kml files, and shapefile projects, respectively. Use these files to test this application. 

The directory structure should be as follows:
```
maps
├── geojson
│   ├── PRK_adm0.json
│   └── africa.json
├── kml
│   ├── cb_2018_us_state_500k.kml
│   └── north-korea-detailed-boundary_951 (1).kml
└── shapefile
    ├── GEO_adm1.dbf
    ├── GEO_adm1.shp
    ├── GEO_adm1.shx
    ├── PRK_adm0.dbf
    ├── PRK_adm0.shp
    └── PRK_adm0.shx
```

Down the tree, these are: North Korean borders, African borders, US borders, North Korean borders, Georgian borders (the country), and North Korean borders.

### Functionality
Upload files via the `Browse...` button. This accepts either a single `.json`, a single `.kml`, a pair of `.shp` and `.dbf`, or a triplet of `.shp`, `.shx`, and `.dbf`.

Additionally, there is a slider that prescribes a precision. The precision value ranges from 0 to 1, where 0 preserves all data, and 1 deletes all data. Increase the precision value if the map renders or pans too slowly.

### Authors
(Team Cerulean)
Wesley Mui, Allen Chen, William Gao, Edward Ng 