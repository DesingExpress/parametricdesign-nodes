import * as THREE from "three";

const TextureMatCap = new THREE.TextureLoader().load("/lightMatCap.png");
export const userMaterials = {
    red : new THREE.MeshMatcapMaterial(
        {
            name : "red",
            mapCap : TextureMatCap,
            color: new THREE.Color(1, 0, 0),
            side : THREE.DoubleSide,
            flatShading : true,
            opacity : 1,
            transparent : false
        },
    ),
    blue : new THREE.MeshMatcapMaterial(
        {
            name : "blue",
            mapCap : TextureMatCap,
            color: new THREE.Color(0, 0, 1),
            side : THREE.DoubleSide,
            flatShading : true,
            opacity : 0.5,
            transparent : true
        },
    ),
}