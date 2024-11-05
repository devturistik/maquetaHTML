// // src/services/azureBlobService.js
// import { BlobServiceClient } from "@azure/storage-blob";
// import dotenv from "dotenv";

// dotenv.config();

// const AZURE_STORAGE_CONNECTION_STRING =
//   process.env.AZURE_STORAGE_CONNECTION_STRING;

// if (!AZURE_STORAGE_CONNECTION_STRING) {
//   throw new Error(
//     "Azure Storage Connection string not found in environment variables."
//   );
// }

// const blobServiceClient = BlobServiceClient.fromConnectionString(
//   AZURE_STORAGE_CONNECTION_STRING
// );

// /**
//  * Sube un archivo a Azure Blob Storage.
//  * @param {Buffer} buffer - El contenido del archivo.
//  * @param {string} nombreArchivo - El nombre del archivo.
//  * @param {string} contenedor - El nombre del contenedor.
//  * @returns {string} La URL del blob subido.
//  */
// export const subirArchivo = async (
//   buffer,
//   nombreArchivo,
//   contenedor = "solicitudes-archivos"
// ) => {
//   try {
//     const containerClient = blobServiceClient.getContainerClient(contenedor);

//     // Verificar si el contenedor existe, si no, crearlo
//     const exists = await containerClient.exists();
//     if (!exists) {
//       await containerClient.create();
//       console.log(`Contenedor '${contenedor}' creado.`);
//     }

//     const blockBlobClient = containerClient.getBlockBlobClient(nombreArchivo);
//     await blockBlobClient.uploadData(buffer, {
//       blobHTTPHeaders: { blobContentType: "application/octet-stream" }, // Puedes ajustar el tipo MIME
//     });

//     return blockBlobClient.url;
//   } catch (error) {
//     console.error("Error al subir archivo a Azure:", error.message);
//     throw new Error("Error al subir archivo.");
//   }
// };
