// src/services/azureBlobService.js
import { BlobServiceClient } from "@azure/storage-blob";
import dotenv from "dotenv";

dotenv.config();

const AZURE_STORAGE_CONNECTION_STRING =
  process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME;

if (!AZURE_STORAGE_CONNECTION_STRING) {
  console.error(
    "Error: AZURE_STORAGE_CONNECTION_STRING no está definido en el entorno."
  );
  process.exit(1);
}

if (!CONTAINER_NAME) {
  console.error(
    "Error: AZURE_STORAGE_CONTAINER_NAME no está definido en el entorno."
  );
  process.exit(1);
}

const blobServiceClient = BlobServiceClient.fromConnectionString(
  AZURE_STORAGE_CONNECTION_STRING
);

const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

class AzureBlobService {
  /**
   * Sube un archivo a Azure Blob Storage con un nombre de blob específico.
   * @param {string} blobName - Nombre del blob.
   * @param {object} file - Archivo a subir (objeto de multer).
   * @returns {Promise<string>} - URL del blob subido.
   */
  static async uploadFile(blobName, file) {
    try {
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      const uploadBlobResponse = await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: { blobContentType: file.mimetype },
      });

      console.log(
        `Blob "${blobName}" cargado con éxito. Request ID: ${uploadBlobResponse.requestId}`
      );

      return blockBlobClient.url;
    } catch (error) {
      console.error(
        `Error al subir archivo a Azure Blob Storage: ${error.message}`
      );
      throw new Error("Error al subir archivo");
    }
  }

  /**
   * Sube múltiples archivos a Azure Blob Storage con nombres de blobs específicos.
   * @param {Array} archivos - Array de objetos { blobName, file }.
   * @returns {Promise<Array<string>>} - Array de URLs de los blobs subidos.
   */
  static async uploadFilesWithNames(archivos) {
    try {
      const uploadPromises = archivos.map(({ blobName, file }) =>
        this.uploadFile(blobName, file)
      );
      const blobUrls = await Promise.all(uploadPromises);
      return blobUrls;
    } catch (error) {
      console.error(
        "Error al subir múltiples archivos a Azure Blob Storage:",
        error.message
      );
      throw new Error("Error al subir múltiples archivos");
    }
  }

  /**
   * Elimina un blob de Azure Blob Storage dado su URL.
   * @param {string} blobUrl - La URL completa del blob a eliminar.
   * @returns {Promise<void>}
   */
  static async deleteBlob(blobUrl) {
    try {
      // Extraer el nombre del blob desde la URL
      const url = new URL(blobUrl);
      const blobName = decodeURIComponent(url.pathname.split("/").pop());

      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      const deleteResponse = await blockBlobClient.delete();

      console.log(
        `Blob "${blobName}" eliminado con éxito. Request ID: ${deleteResponse.requestId}`
      );
    } catch (error) {
      console.error(`Error al eliminar el blob "${blobUrl}":`, error.message);
      throw new Error("Error al eliminar el archivo de Azure Blob Storage");
    }
  }
}

export default AzureBlobService;
