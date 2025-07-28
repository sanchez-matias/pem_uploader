const soap = require('soap');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib'); // Para compresión gzip si es necesario

// --- Configuración ---
// Se recomienda usar variables de entorno para las URLs en un entorno de producción
const WSDL_URL_TESTING = 'https://awshomo.arca.gov.ar/setiws/webservices/upload Presentacion Service?wsdl';
const WSDL_URL_PRODUCTION = 'https://aws.arca.gov.ar/setiws/webservices/upload Presentacion Service?wsdl';

// Usar la URL de pruebas para este ejemplo
const wsdlUrl = WSDL_URL_TESTING;

// Parámetros de ejemplo (deben obtenerse de WSAA y de su lógica de negocio)
const TOKEN_EJEMPLO = "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9InllcyI/Pgo8c3NvIHZlcnNpb249IjIuMCI+CiAgICA8aWQgc3JjPSJDTj13c2FhLCBPPUFGSVAsIEM9QVIsIFNFUklBTE5VTUJFUj1DVUlUIDMzNjkzNDUwMjM5IiB1bmlxdWVfaWQ9IjE4OTg4NzcxNjQiIGdlbl90aW1lPSIxNzUzMzU4Mzg5IiBleHBfdGltZT0iMTc1MzQwMTY0OSIvPgogICAgPG9wZXJhdGlvbiB0eXBlPSJsb2dpbiIgdmFsdWU9ImdyYW50ZWQiPgogICAgICAgIDxsb2dpbiBlbnRpdHk9IjMzNjkzNDUwMjM5IiBzZXJ2aWNlPSJkanByb2Nlc3NvcmNvbnRyaWJ1eWVudGVfY2YiIHVpZD0iU0VSSUFMlNUMxNTAyNjY3LCBDTj1lc3R1ZGlvIiBhdXRobWV0aG9kPSJjbXMiIHJlZ21ldGhvZD0iMjIiPgogICAgICAgICAgICA8cmVsYXRpb25zPgogICAgICAgICAgICAgICAgPHJlbGF0aW9uIGtleT0iMzA1ODM0ODI2NjciIHJlbHR5cGU9IjQiLz4KICAgICAgICAgICAgPC9yZWxhdGlvbnM+CiAgICAgICAgPC9sb2dpbj4KICAgIDwvb3BlcmF0aW9uPgogPC9zc28+Cg==";
const SIGN_EJEMPLO = "Vn/+q0jJqOxtSxPrepBb3ZiDMlsbb3ge4KJ9Y5AlEY0Eb1MttrZ19qpA44AleJVZyOAcMYFbzw0HGYOlTk4RfUsr+Do6hXR3HLfrBcF/W67BY/xkC4YjbjtGVEnqUHchauiUFWGIby1KvfhYgL877gvt78M5i0ZId0PnwKE0BZE=";
const REPRESENTADO_CUIT_EJEMPLO = "30583482667";

// Ruta al archivo DDJJ que se va a adjuntar.
// Asegúrese de que este archivo exista en la ruta especificada.
// Para este ejemplo, podemos crear un archivo dummy.
const DDJJ_FILE_PATH = path.join(__dirname, 'F8012.30583482667.EPEPAA0000015608.20250614.6b263c0e-518b-4880274052c1.pem');
const DDJJ_FILE_NAME = "F8012.30583482667.EPEPAA0000015608.20250614.6b263c0e-518b-4880274052c1.pem";

// Crear un archivo dummy para el ejemplo si no existe
if (!fs.existsSync(DDJJ_FILE_PATH)) {
    console.log(`Creando archivo dummy en: ${DDJJ_FILE_PATH}`);
    fs.writeFileSync(DDJJ_FILE_PATH, 'Contenido de prueba de la DDJJ. Esto simula el archivo binario.');
}

/**
 * Lee un archivo y, opcionalmente, lo comprime con gzip.
 * @param {string} filePath - La ruta al archivo.
 * @param {boolean} [compressGzip=false] - Si se debe comprimir el archivo con gzip.
 * @returns {Promise<Buffer>} El contenido del archivo como Buffer.
 */
async function readFileContent(filePath, compressGzip = false) {
    const fileBuffer = fs.readFileSync(filePath);
    if (compressGzip) {
        console.log(`Comprimiendo ${filePath} con gzip...`);
        return zlib.gzipSync(fileBuffer);
    }
    return fileBuffer;
}

/**
 * Ejecuta la operación 'upload' del servicio web de ARCA.
 */
async function uploadDDJJ() {
    let client;
    try {
        console.log('1. Inicializando cliente SOAP desde WSDL...');
        client = await soap.createClientAsync(wsdlUrl);
        console.log('Cliente SOAP inicializado.');

        // 2. Preparar el contenido del archivo para MTOM
        // La documentación sugiere comprimir txt/xml con gzip.
        // Aquí se asume que el archivo.pem no necesita gzip, pero se muestra la opción.
        const fileContentBuffer = await readFileContent(DDJJ_FILE_PATH, false); // No gzip para.pem

        // El Content-ID debe coincidir con la referencia en presentacionDataHandler
        const contentId = DDJJ_FILE_NAME; // Usamos el nombre del archivo como Content-ID
        const attachmentMimeType = 'application/octet-stream'; // Según la documentación

        // Configurar el adjunto MTOM
        const attachments = {
            
        };

        // 3. Construir el objeto de argumentos para la operación 'upload'
        const args = {
            token: TOKEN_EJEMPLO,
            sign: SIGN_EJEMPLO,
            representadoCuit: REPRESENTADO_CUIT_EJEMPLO,
            presentacion: {
                // Importante: aquí se usa la referencia cid: al adjunto MTOM, no el contenido binario
                presentacionDataHandler: `cid:${contentId}`,
                fileName: DDJJ_FILE_NAME
            }
        };

        // 4. Configurar opciones del cliente para MTOM y timeout
        const options = {
            forceMTOM: true, // Forzar el uso de MTOM
            attachments: attachments, // Adjuntos MTOM
            // Configurar timeout (60s para <1MB, 5min para >1MB)
            // Ajustar según el tamaño real de sus archivos DDJJ
            timeout: 60000 // 60 segundos
        };

        console.log('2. Enviando solicitud de upload...');
        // client.uploadAsync devuelve un array
        const [result] = await client.uploadAsync(args, options);

        console.log('Solicitud de upload exitosa.');
        console.log('Número de Transacción ARCA:', result);

    } catch (error) {
        console.error('Error al ejecutar la operación upload:');
        if (error.response && error.response.data) {
            // Intentar parsear el fault SOAP si está disponible
            const faultMatch = error.response.data.match(/<faultcode>(.*?)<\/faultcode>.*<faultstring>(.*?)<\/faultstring>/s);
            if (faultMatch) {
                const faultCode = faultMatch;
                const faultString = faultMatch;
                console.error(`Código de Falla SOAP: ${faultCode}`);
                console.error(`Mensaje de Falla SOAP: ${faultString}`);

                if (faultCode.includes('Client.contentError') || faultCode.includes('User.businessError')) {
                    console.error('Este es un error del lado del cliente o de negocio. Revise los parámetros de la solicitud, el formato del archivo y la configuración de MTOM.');
                    if (faultString.includes('413 Request Entity Too Large')) {
                        console.error('El error "413 Request Entity Too Large" indica que MTOM no se configuró correctamente y el contenido binario se envió en línea. Asegúrese de que `forceMTOM: true` y los `attachments` estén correctos.');
                    }
                } else if (faultCode.includes('Server.processError')) {
                    console.error('Este es un error del lado del servidor. Se recomienda reintentar la operación después de un tiempo.');
                }
            } else {
                console.error('Respuesta de error SOAP no parseada:', error.response.data);
            }
        } else {
            console.error('Error desconocido o de red:', error.message);
        }
    }
}

// Ejecutar la función de upload
uploadDDJJ();