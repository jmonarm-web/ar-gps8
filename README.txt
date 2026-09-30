LocAR GPS Router TI - v3

CORRECCIONES
1. Se eliminaron los cuatro cubos de calibración para que ninguno tape el router.
2. Se agregó iluminación HemisphereLight + DirectionalLight.
3. Se normaliza automáticamente el tamaño del router.glb.
4. Se centra el modelo para evitar que su origen esté muy lejos de la geometría visible.
5. Se desactiva frustum culling en las mallas.
6. Se fuerza DoubleSide en materiales.
7. El canvas se deja transparente para ver la cámara.

MUY IMPORTANTE
Copia tu archivo router.glb exactamente aquí:
public/models/router.glb

Estructura:
LocAR_GPS_Vercel_TI_v3/
  index.html
  package.json
  vercel.json
  src/main.js
  public/models/router.glb

VERCEL
Framework: Vite
Build command: npm run build
Output directory: dist

Si el router aparece de espaldas:
en src/main.js cambia:
model.rotation.y = THREE.MathUtils.degToRad(0);
por 90, 180 o 270.

Si quieres cambiar tamaño:
const desiredSize = 14;
por 8, 10, 20, etc.

Coordenada objetivo:
lat -2.299114
lon -78.118125
