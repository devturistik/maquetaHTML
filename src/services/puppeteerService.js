// src/services/puppeteerService.js
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

class PuppeteerService {
  constructor() {
    this.browserPromise = null;
    this.logoDataURI = null;
    this.initLogo();
    this.initBrowser();
  }

  async initBrowser() {
    if (!this.browserPromise) {
      this.browserPromise = puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
  }

  async getPage() {
    const browser = await this.browserPromise;
    const page = await browser.newPage();
    return page;
  }

  async closePage(page) {
    if (page && !page.isClosed()) {
      await page.close();
    }
  }

  initLogo() {
    try {
      const absolutePath = path.resolve('src/public/assets/img/logoTK/logo.png');
      const imageBuffer = fs.readFileSync(absolutePath);
      const mimeType = 'image/png';
      const base64Image = imageBuffer.toString('base64');
      this.logoDataURI = `data:${mimeType};base64,${base64Image}`;
    } catch (error) {
      console.error('Error al cargar el logo para Puppeteer:', error.message);
      throw new Error('No se pudo cargar el logo para la generación de PDFs.');
    }
  }

  /**
   * Genera un PDF a partir del contenido HTML proporcionado.
   * @param {string} htmlContent - Contenido HTML para renderizar en el PDF.
   * @param {string} codigooc - Código de la orden de compra para incluir en el encabezado y pie de página.
   * @returns {Promise<Buffer>} - Buffer del PDF generado.
   */
  async generatePdf(htmlContent, codigooc) {
    await this.initBrowser();
    const page = await this.getPage();

    try {
      await page.setViewport({ width: 794, height: 1123 });

      await page.setRequestInterception(true);
      page.on('request', (request) => {
        const resourceType = request.resourceType();
        if (['image', 'stylesheet', 'font', 'script'].includes(resourceType)) {
          request.abort();
        } else {
          request.continue();
        }
      });

      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      if (!this.logoDataURI) {
        throw new Error('Logo no está inicializado.');
      }

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '2.54cm',
          bottom: '2.54cm',
          left: '2.54cm',
          right: '2.54cm',
        },
        displayHeaderFooter: true,
        headerTemplate: `
          <style>
            .header-container {
              font-size: 12px;
              padding: 0;
              height: 2.54cm;
              position: relative;
              width: 100%;
            }
            .header-left {
              position: absolute;
              left: 0;
              top: 0;
              display: flex;
              align-items: center;
              padding-left: 2.54cm;
              height: 2.54cm;
            }
            .header-left img {
              height: 30px;
            }
            .header-center {
              text-align: center;
              position: absolute;
              left: 0;
              right: 0;
              top: 0;
              height: 2.54cm;
              display: flex;
              align-items: center;
              justify-content: center;
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
              position: absolute;
              right: 0;
              top: 0;
              padding-right: 2.54cm;
              height: 2.54cm;
              display: flex;
              align-items: center;
              justify-content: flex-end;
            }
            .header-right p {
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
              font-size: 10px;
              color: #777;
              padding: 0;
              height: 2.54cm;
              width: 100%;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
            }
            .footer-note {
              margin: 0 0 5px 0;
            }
            .page-footer {
              font-size: 10px;
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

      await page.setRequestInterception(false);
      page.removeAllListeners('request');

      return pdfBuffer;
    } finally {
      await this.closePage(page);
    }
  }

  async close() {
    if (this.browserPromise) {
      const browser = await this.browserPromise;
      await browser.close();
      this.browserPromise = null;
    }
  }
}

const puppeteerService = new PuppeteerService();
export default puppeteerService;
