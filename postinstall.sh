# Clear out any old images
rm src/assets/*.svg

# Clone mat-icons JSON
# cp node_modules/material-icon-theme/dist/material-icons.json src/lib/mat-icons.json

# Clone the latest svg assets
cp node_modules/material-icon-theme/icons/*.svg src/assets
