import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { App } from "locar";

const btn = document.getElementById("start");
const statusEl = document.getElementById("status");
const coordsEl = document.getElementById("coords");
const accuracyEl = document.getElementById("accuracy");
const distanceEl = document.getElementById("distance");
const canvas = document.getElementById("ar-canvas");

const TARGET = {
  lat: -2.299114,
  lon: -78.118125,
  name: "LABORATORIO DE REDES"
};

function setStatus(msg) {
  statusEl.textContent = msg;
}

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const p1 = toRad(lat1), p2 = toRad(lat2);
  const dp = toRad(lat2 - lat1);
  const dl = toRad(lon2 - lon1);
  const a = Math.sin(dp / 2) ** 2 +
            Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function prepareModel(model) {
  model.traverse((obj) => {
    if (obj.isMesh) {
      obj.frustumCulled = false;
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((mat) => {
          mat.side = THREE.DoubleSide;
          mat.needsUpdate = true;
        });
      }
    }
  });

  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 0) {
    const desiredSize = 14;
    const s = desiredSize / maxDim;
    model.scale.setScalar(s);
  }

  const scaledBox = new THREE.Box3().setFromObject(model);
  scaledBox.getCenter(center);
  model.position.sub(center);

  model.position.y += 3;
  model.rotation.y = THREE.MathUtils.degToRad(0);

  return model;
}

btn.addEventListener("click", async () => {
  btn.disabled = true;
  btn.textContent = "INICIANDO...";
  setStatus("Solicitando cámara y sensores...");

  try {
    const app = new App({
      canvas,
      cameraOptions: {
        hFov: 80,
        near: 0.001,
        far: 2000
      },
      videoConstraints: {
        video: { facingMode: "environment" }
      }
    });

    const locar = await app.start();

    app.renderer.setClearColor(0x000000, 0);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 2.2);
    app.scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 2.5);
    dir.position.set(10, 20, 10);
    app.scene.add(dir);

    locar.setGpsOptions({
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 30000
    });

    let modelAdded = false;
    let routerTemplate = null;

    setStatus("Cargando router.glb...");
    const loader = new GLTFLoader();

    try {
      const gltf = await loader.loadAsync("/models/router.glb");
      routerTemplate = prepareModel(gltf.scene);
      setStatus("Router cargado. Esperando posición GPS...");
    } catch (modelError) {
      console.error(modelError);
      setStatus("ERROR: no se pudo cargar /models/router.glb. Verifica public/models/router.glb");
      btn.disabled = false;
      btn.textContent = "REINTENTAR";
      return;
    }

    locar.on("gpserror", (err) => {
      const code = err?.code ?? "";
      const msg = err?.message ?? "Error desconocido";
      setStatus(`Error GPS ${code}: ${msg}`);
      btn.disabled = false;
      btn.textContent = "REINTENTAR";
    });

    locar.on("gpsupdate", (ev) => {
      const c = ev.position.coords;

      coordsEl.textContent =
        `GPS: ${c.latitude.toFixed(7)}, ${c.longitude.toFixed(7)}`;
      accuracyEl.textContent =
        `Precisión: ${Math.round(c.accuracy)} m`;

      const dist = haversineMeters(
        c.latitude, c.longitude, TARGET.lat, TARGET.lon
      );
      distanceEl.textContent =
        `Distancia al router: ${Math.round(dist)} m`;

      if (!modelAdded && routerTemplate) {
        locar.add(
          routerTemplate,
          TARGET.lon,
          TARGET.lat,
          4
        );

        modelAdded = true;
        setStatus(
          "Router agregado. Gira lentamente hacia la ubicación objetivo. Si no lo ves, acércate al punto GPS."
        );
        btn.style.display = "none";
      }
    });

    setStatus("Cámara iniciada. Solicitando ubicación GPS...");
    await locar.startGps();

  } catch (e) {
    console.error(e);
    const msg = e?.message || String(e);
    setStatus(`No se pudo iniciar AR: ${msg}`);
    btn.disabled = false;
    btn.textContent = "REINTENTAR";
  }
});
