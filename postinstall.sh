# Clear out any old images
rm src/assets/material/*.svg
# Clear out old libs
rm src/assets/lib -rf

# Clone mat-icons JSON
cp node_modules/material-icon-theme/dist/material-icons.json src/assets/mat-icons.json

# Clone the latest svg assets
cp node_modules/material-icon-theme/icons/*.svg src/assets/material

mkdir src/assets/lib

cp -r node_modules/monaco-editor/min/vs src/assets/lib/vs
