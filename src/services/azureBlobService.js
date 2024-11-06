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
  static async uploadFile(file) {
    try {
      const blobName = `${Date.now()}-${file.originalname}`;
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
        "Error al subir archivo a Azure Blob Storage:",
        error.message
      );
      throw new Error("Error al subir archivo");
    }
  }

  static async uploadFiles(files) {
    try {
      const uploadPromises = files.map((file) => this.uploadFile(file));
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
}

export default AzureBlobService;
