// src/services/azureBlobService.js
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} from "@azure/storage-blob";
import dotenv from "dotenv";

dotenv.config();

const AZURE_STORAGE_CONNECTION_STRING =
  process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME;
const AZURE_STORAGE_ACCOUNT_KEY = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const AZURE_STORAGE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME;

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

if (!AZURE_STORAGE_ACCOUNT_KEY) {
  console.error(
    "Error: AZURE_STORAGE_ACCOUNT_KEY no está definido en el entorno."
  );
  process.exit(1);
}

if (!AZURE_STORAGE_ACCOUNT_NAME) {
  console.error(
    "Error: AZURE_STORAGE_ACCOUNT_NAME no está definido en el entorno."
  );
  process.exit(1);
}

const blobServiceClient = BlobServiceClient.fromConnectionString(
  AZURE_STORAGE_CONNECTION_STRING
);
const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

const sharedKeyCredential = new StorageSharedKeyCredential(
  AZURE_STORAGE_ACCOUNT_NAME,
  AZURE_STORAGE_ACCOUNT_KEY
);

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
    } catch (error) {
      console.error(`Error al eliminar el blob "${blobUrl}":`, error.message);
      throw new Error("Error al eliminar el archivo de Azure Blob Storage");
    }
  }

  /**
   * Genera una URL SAS para un blob con permisos de lectura y el encabezado Content-Disposition.
   * @param {string} blobName - Nombre del blob.
   * @param {string} [downloadName] - Nombre que tendrá el archivo al descargarse.
   * @returns {string} - URL SAS completa.
   */
  static generateSasUrl(
    blobName,
    originalFilename = null,
    disposition = "inline"
  ) {
    try {
      const sasOptions = {
        containerName: CONTAINER_NAME,
        blobName: blobName,
        permissions: BlobSASPermissions.parse("r"),
        startsOn: new Date(),
        expiresOn: new Date(new Date().valueOf() + 60 * 60 * 1000), // 1 hora
      };

      if (originalFilename) {
        const sanitizedFilename = originalFilename.replace(/"/g, '\\"');
        sasOptions.contentDisposition = `${disposition}; filename="${sanitizedFilename}"`;
      }

      const sasToken = generateBlobSASQueryParameters(
        sasOptions,
        sharedKeyCredential
      ).toString();
      const sasUrl = `${
        containerClient.getBlockBlobClient(blobName).url
      }?${sasToken}`;
      return sasUrl;
    } catch (error) {
      console.error("Error al generar SAS URL:", error.message);
      throw new Error("Error al generar SAS URL");
    }
  }

  /**
   * Sube un buffer a Azure Blob Storage con un nombre de blob específico.
   * @param {string} blobName - Nombre del blob.
   * @param {Buffer} buffer - Buffer de datos a subir.
   * @param {string} contentType - Tipo de contenido MIME.
   * @returns {Promise<string>} - URL del blob subido.
   */
  static async uploadBufferWithName(blobName, buffer, contentType) {
    try {
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      const uploadBlobResponse = await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: { blobContentType: contentType },
      });

      return blockBlobClient.url;
    } catch (error) {
      console.error(
        `Error al subir buffer a Azure Blob Storage: ${error.message}`
      );
      throw new Error("Error al subir el archivo");
    }
  }

  /**
   * Obtiene el cliente de un blob específico.
   * @param {string} blobName - Nombre del blob.
   * @returns {BlobClient} - Cliente del blob.
   */
  static getBlobClient(blobName) {
    return containerClient.getBlockBlobClient(blobName);
  }
}

export default AzureBlobService;
