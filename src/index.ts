import * as tf from "@tensorflow/tfjs-core"
import "@tensorflow/tfjs-backend-webgl"
import * as detection from "@tensorflow-models/face-landmarks-detection"
import * as THREE from "three"
import { TRIANGLES } from "./triangle"
import { UVs } from "./uv"
import { uniforms, rainbowChecker as mat } from "./materials"

window.addEventListener("DOMContentLoaded", async () => {
  await tf.setBackend("webgl")
  let time = 0
  const model = await detection.load(detection.SupportedPackages.mediapipeFacemesh)
  const update = async () => {
    time += 0.1
    const predictions = await model.estimateFaces({
      input: videoElem
    })
    if (predictions.length > 0) {
      const prediction = predictions[0]
      const mesh = (prediction as any).scaledMesh
      for (let j = 0; j < 468; j++) {
        uvs[j * 2] = UVs[j][0]
        uvs[j * 2 + 1] = 1 - UVs[j][1];
      }
      mesh.forEach((v: any, i:number) => {
        positions[3 * i] = v[0] - 320
        positions[3 * i + 1] = - v[1] + 240
        positions[3 * i + 2] = v[2]
      })
      g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
      g.getAttribute("position").needsUpdate = true;
      g.setAttribute("uv", new THREE.BufferAttribute(uvs, 2))
      g.getAttribute("uv").needsUpdate = true;
      g.computeVertexNormals()
    }
    uniforms.iResolution.value.set(threeCanvas.width, threeCanvas.height, 1);
    uniforms.iTime.value = time;
    threeRenderer.render(scene, camera)
    requestAnimationFrame(() => update())
  }
  const videoElem = document.createElement("video")
  videoElem.style.position = "absolute"
  videoElem.style.top = "0"
  videoElem.style.left = "0"
  videoElem.style.zIndex = "1"
  videoElem.autoplay = true
  videoElem.addEventListener("playing", () => {
    threeRenderer.setSize(videoElem.videoWidth, videoElem.videoHeight)
    update()
  })
  document.body.appendChild(videoElem)
  const stream = await navigator.mediaDevices.getUserMedia({ video: true })
  videoElem.srcObject = stream

  const threeCanvas = document.createElement("canvas")
  threeCanvas.style.position = "absolute"
  threeCanvas.style.top = "0"
  threeCanvas.style.left = "0"
  threeCanvas.style.zIndex = "1"
  document.body.appendChild(threeCanvas)

  const threeRenderer = new THREE.WebGLRenderer({ alpha: true, canvas: threeCanvas })
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 16 / 12, 1, 10000);
  camera.position.set(0, 0, 640)
  camera.lookAt(0, 0, 0)
  const light = new THREE.DirectionalLight(0xffffff);
  light.position.set(1, 1, 1);
  scene.add(light);
  const positions = new Float32Array(468 * 3)
  const uvs = new Float32Array(468 * 2);
  const g = new THREE.BufferGeometry()
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  g.getAttribute("position").needsUpdate = true;
  g.setAttribute("uv", new THREE.BufferAttribute(uvs, 2))
  g.getAttribute("uv").needsUpdate = true;
  g.setIndex(TRIANGLES)
  g.computeVertexNormals()
  scene.add(new THREE.Mesh(g, mat));
  threeRenderer.render(scene, camera)
})
