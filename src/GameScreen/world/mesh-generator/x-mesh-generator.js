import { BLOCK_TRANSPARENCY } from "../../block-type";
import CONFIG from "../config";
import LightEngine from "./LightEngine";
import MeshGenerator from "./mesh-generator";
import MESH_TEXTURES from "./mesh-textures";

const MAX_LIGHT = CONFIG.MAX_LIGHT;

export default class XMeshGenerator extends MeshGenerator {
  generate(x, y, z, chunk, blocks) {
    const mesh = chunk.mesh;
    const blockType = blocks[CENTER_BLOCK_INDEX];
    const textureConfig = MESH_TEXTURES[blockType] || { all: [1000, 1000] };

    const vertNormal = [];

    const currentBlock = chunk.getBlock(x, y, z);

    for (const key in blockData) {
      if (!Object.hasOwnProperty.call(blockData, key))
        continue;

      const data = blockData[key];
      // const sideBlock = this.getBv(blocks, data.normal);

      // if (sideBlock === null || BLOCK_TRANSPARENCY[sideBlock] === 0) {
      //   continue;
      // }

      const vertices = data.vertices;
      const elementIndexOffset = mesh.vertices.length / this.floatsPerVertice;
      const cornerAo = [];

      mesh.vertices.push(...vertices);

      for (let i = mesh.vertices.length - vertices.length, j = 0; i < mesh.vertices.length; i += this.floatsPerVertice, j++) {
        const [u, v] = textureConfig[key] || textureConfig.all;

        mesh.vertices[i + 3] = this.textureCoord(u, mesh.vertices[i + 3]);
        mesh.vertices[i + 4] = this.textureCoord(v, mesh.vertices[i + 4]);

        mesh.vertices[i + 6] = chunk.getBlockIndex(x, y, z);

        vertNormal[0] = mesh.vertices[i];
        vertNormal[1] = mesh.vertices[i + 1];
        vertNormal[2] = mesh.vertices[i + 2];

        // let { lb, ls } = this.getVertexLight(blocks, data.normal[j], vertNormal, this.getBv(blocks, data.normal[j]));

        const lb = LightEngine.getBlockLight(currentBlock.light);
        const ls = LightEngine.getSkyLight(currentBlock.light);

        mesh.vertices[i + 5] = (mesh.vertices[i + 5] * 0.1 + (Math.max(lb, ls) / MAX_LIGHT) * 0.9);

        cornerAo.push(mesh.vertices[i + 5]);

        // mesh.vertices[i + 5] = Math.max(0, Math.min(1, mesh.vertices[i + 5]));

        mesh.vertices[i] = (mesh.vertices[i] + 1) * 0.5 + x;
        mesh.vertices[i + 1] = (mesh.vertices[i + 1] + 1) * 0.5 + y;
        mesh.vertices[i + 2] = (mesh.vertices[i + 2] + 1) * 0.5 + z;
      }

      const triangles = data.triangles.default;//((cornerAo[0] + cornerAo[2]) < (cornerAo[1] + cornerAo[3])) ? data.triangles.flipped : data.triangles.default;

      for (let i = 0; i < triangles.length; i++) {
        mesh.indices.push(triangles[i] + elementIndexOffset);
      }

      // if ((cornerAo[0] || cornerAo[2]) && !(cornerAo[1] || cornerAo[3])) {
      //   const index = mesh.indices.length - 6;
      //   const triangles = [
      //     mesh.indices[index + 1],
      //     mesh.indices[index + 2],
      //     mesh.indices[index + 5],
      //     mesh.indices[index + 1],
      //     mesh.indices[index + 5],
      //     mesh.indices[index]
      //   ];

      //   mesh.indices.splice(index, 6, ...triangles);
      // }
    }
  }

  static get blockData() {
    return blockData;
  }
}

const CENTER_BLOCK_INDEX = 13;

const blockData = {
  a: {
    normal: [
      [0, 0, -1],
      [0, 0, -1],
      [0, 0, 1],
      [0, 0, 1],
    ],
    light: 1,
    vertices: [
      -1.0, 1.0, -1.0, 0, 0,
      -1.0, -1.0, -1.0, 0, 1,
      1.0, 1.0, 1.0, 1, 0,
      1.0, -1.0, 1.0, 1, 1,
    ],
    triangles: {
      default: [
        0, 1, 2,
        1, 3, 2,

        2, 1, 0,
        2, 3, 1,
      ],
    }
  },
  b: {
    normal: [
      [-1, 0, 0],
      [-1, 0, 0],
      [1, 0, 0],
      [1, 0, 0],
    ],
    light: 1,
    vertices: [
      -1.0, 1.0, 1.0, 0, 0,
      -1.0, -1.0, 1.0, 0, 1,
      1.0, 1.0, -1.0, 1, 0,
      1.0, -1.0, -1.0, 1, 1,
    ],
    triangles: {
      default: [
        0, 1, 2,
        1, 3, 2,

        2, 1, 0,
        2, 3, 1,
      ],
    }
  }
};

function clamp(min, max, val) {
  return val < min ? min : val > max ? max : val;
}

for (const key in blockData) {
  if (!Object.hasOwnProperty.call(blockData, key)) {
    continue;
  }

  blockData[key].triangles.flipped = blockData[key].triangles.flipped || blockData[key].triangles.default;

  for (let i = 0; i < blockData[key].vertices.length; i += MeshGenerator.floatsPerVertice) {
    blockData[key].vertices.splice(i + 5, 0, blockData[key].light);
    blockData[key].vertices.splice(i + 6, 0, 0);
  }
}