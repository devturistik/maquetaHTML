// src/services/puppeteerService.js
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

class PuppeteerService {
  constructor() {
    this.browser = null;
    this.logoDataURI = null;
    this.initLogo();
  }

  async init() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    }
    return this.browser;
  }

  async getPage() {
    const browser = await this.init();
    const page = await browser.newPage();
    return page;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  initLogo() {
    try {
      const absolutePath = path.resolve(
        "src/public/assets/img/logoTK/logo.png"
      );
      const imageBuffer = fs.readFileSync(absolutePath);
      const mimeType = "image/png";
      const base64Image = imageBuffer.toString("base64");
      this.logoDataURI = `data:${mimeType};base64,${base64Image}`;
    } catch (error) {
      console.error("Error al cargar el logo para Puppeteer:", error.message);
      throw new Error("No se pudo cargar el logo para la generación de PDFs.");
    }
  }

  /**
   * Genera un PDF a partir del contenido HTML proporcionado.
   * @param {string} htmlContent - Contenido HTML para renderizar en el PDF.
   * @param {string} codigooc - Código de la orden de compra para incluir en el encabezado y pie de página.
   * @returns {Promise<Buffer>} - Buffer del PDF generado.
   */
  async generatePdf(htmlContent, codigooc) {
    const page = await this.getPage();
    await page.setViewport({ width: 794, height: 1123 });
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    if (!this.logoDataURI) {
      throw new Error("Logo no está inicializado.");
    }

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "2.54cm",
        bottom: "2.54cm",
        left: "2.54cm",
        right: "2.54cm",
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <style>
            .header-container {
                width: 100%;
                font-size: 12px;
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                box-sizing: border-box;
                height: 2.54cm;
                position: relative;
            }
            .header-left, .header-right {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
            }
            .header-left {
                left: 2.54cm;
                display: flex;
                align-items: center;
            }
            .header-left img {
                height: 30px;
                margin-right: 10px;
            }
            .header-center {
                text-align: center;
            }
            .header-center .title {
                font-size: 14px;
                font-weight: bold;
                color: #444;
                margin: 0;
                text-transform: uppercase;
                text-decoration: underline;
            }
            .header-right {
                right: 2.54cm;
                text-align: right;
            }
            .header-right p {
                white-space: nowrap;
                margin: 0;
            }
        </style>
        <div class="header-container">
            <div class="header-left">
                <img src="${this.logoDataURI}" alt="Logotipo">
            </div>
            <div class="header-center">
                <p class="title">Orden de Compra</p>
            </div>
            <div class="header-right">
                <p><strong>N°:</strong> ${codigooc}</p>
            </div>
        </div>
    `,

      footerTemplate: `
        <style>
            .footer-container {
                width: 100%;
                font-size: 12px;
                color: #777;
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                height: 2.54cm;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }
            .footer-note {
                font-size: 10px;
                margin: 0 0 5px 0;
            }
            .page-footer {
                font-size: 12px;
            }
        </style>
        <div class="footer-container">
            <div class="footer-note">
                <p>Este documento no es una factura. Se emite con fines de registro.</p>
            </div>
            <div class="page-footer">
                <p>© ${new Date().getFullYear()} TURISTIK | Orden N° ${codigooc} | Página <span class="pageNumber"></span> de <span class="totalPages"></span></p>
            </div>
        </div>
    `,
    });

    await page.close();
    return pdfBuffer;
  }
}

const puppeteerService = new PuppeteerService();
export default puppeteerService;
