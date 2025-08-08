const soap = require('soap');;
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');
const { randomUUID } = require('crypto');
const { spawnSync } = require('child_process');

class ArcaClient {

    static async getArcaTicket({cert_path, key_path, cuit}) {
        // Crear el XML del ticket de acceso
        const now = new Date();
        const uniqueId = Math.floor(now.getTime() / 1000).toString();
        const generationTime = now.toISOString().slice(0, 19);
        const expirationTime = new Date(now.getTime() + 600000).toISOString().split('.')[0];
        const serviceId = "djprocessorcontribuyente_cf";

        const xmlTA = `
<loginTicketRequest>
    <header>
        <uniqueId>${uniqueId}</uniqueId>
        <generationTime>${generationTime}</generationTime>
        <expirationTime>${expirationTime}</expirationTime>
    </header>
    <service>${serviceId}</service>
</loginTicketRequest>`.trim();

        // Guardar el XML en un archivo temporal
        const tempDir = path.join('./', 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }

        const xmlPath = path.join(tempDir, `LoginTicketRequest-${uniqueId}.xml`);
        fs.writeFileSync(xmlPath, xmlTA, 'utf-8');

        // Firmar el CMS con openssl
        const cmsDerPath = path.join(tempDir, `LoginTicketRequest-${uniqueId}.cms.der`);
        try {
            spawnSync('openssl', [
                'cms',
                '-sign',
                '-in', xmlPath,
                '-signer', cert_path,
                '-inkey', key_path,
                '-nodetach',
                '-outform', 'der',
                '-out', cmsDerPath
            ], { stdio: 'inherit' });
        } catch (error) {
            console.error('Error al firmar el CMS con OpenSSL:', error);
            return null;
        }

        // Codificar el CMS a Base64
        const cmsB64Path = path.join(tempDir, `LoginTicketRequest-${uniqueId}.cms.b64`);
        try {
            spawnSync('openssl', [
                'base64',
                '-in', cmsDerPath,
                '-e',
                '-out', cmsB64Path
            ], { stdio: 'inherit' });
        } catch (error) {
            console.error('Error al codificar a Base64 con OpenSSL:', error);
            return null;
        }

        const cmsBase64Content = fs.readFileSync(cmsB64Path, 'utf-8').replace(/\n/g, '');

        try {
            const client = await soap.createClientAsync('https://wsaahomo.afip.gov.ar/ws/services/LoginCms?WSDL');
            const result = await client.loginCmsAsync({ in0: cmsBase64Content });
            return result[0].loginCmsReturn;
        } catch (error) {
            console.error(`Error al invocar el servicio: ${error}`);
            return null;
        } finally {
            // Limpiar archivos temporales
            fs.unlinkSync(xmlPath);
            fs.unlinkSync(cmsDerPath);
            fs.unlinkSync(cmsB64Path);
            fs.rmdirSync(tempDir);
        }
    }

    static async getWebServiceStatus() {
        const url = path.join(__dirname, '../../wsdl/dummy.wsdl');
        // let isServiceOk;
        const isServiceOk = await fetch(url);

        return isServiceOk;
    }

    static async upload({ticket, filePath, cuit}) {
        const url = 'https://aws.arca.gov.ar/setiws/webservices/uploadPresentacionService?wsdl';
        const file = fs.readFileSync(filePath);
        const fileBase64 = file.toString('base64');
        const fileName = path.basename(filePath);
        const contentId =`${randomUUID()}@pymtom-xop`;

//         const form = new FormData();

//         const soapMessage = `
// <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
// xmlns:dom="http://domain.presentacion.seti.osiris.arca.gov/">
//     <soapenv:Header/>
//     <soapenv:Body>
//         <dom:upload>
//             <token>${ticket.token}</token>
//             <sign>${ticket.sign}</sign>
//             <representadoCuit>${cuit}</representadoCuit>
//             <presentacion>
//                 <presentacionDataHandler>cid:${fileName}</presentacionDataHandler> 
//                 <fileName>${fileName}</fileName>
//             </presentacion>
//         </dom:upload>
//     </soapenv:Body>
// </soapenv:Envelope>
// `;
// //! recordar cambiar el presentacionDataHandler a contentId si no funciona

//         form.append('rootPart', soapMessage, {
//             contentType: 'application/octet-stream',
//             // Es crucial definir el Content-ID para el cuerpo XML.
//             // La especificación recomienda un Content-ID con ángulos.
//             headers: {
//                 'Content-ID': `<${contentId}>`
//             }
//         });

//         const fileStream = fs.createReadStream(filePath);

//         form.append('attachmentPart', fileStream, {
//             contentType: 'application/octet-stream', // O el tipo MIME correcto de tu archivo
//             // El Content-ID del archivo adjunto DEBE coincidir
//             // con el valor que pusiste en el XML (con los ángulos).
//             headers: {
//                 'Content-ID': contentId
//             }
//         });

//         const headers = {
//             // Los headers de form-data son esenciales para la petición multipart/related
//             ...form.getHeaders(),
//             // SOAPAction es a menudo requerido por los servicios SOAP
//             // 'SOAPAction': soapAction, 
//             // Content-Type debe ser multipart/related
//             // form.getHeaders() ya se encarga de esto y añade el boundary
//         };

//         axios.post(url, form, { headers })
//         .then(response => {
//             console.log('Respuesta del servidor:', response.data);
//             console.log('Estado HTTP:', response.status);
//         })
//         .catch(error => {
//             // Manejo de errores
//             if (error.response) {
//                 console.error('Error de respuesta del servidor:', error.response.status);
//                 console.error('Datos del error:', error.response.data);
//             } else if (error.request) {
//                 console.error('No se recibió respuesta del servidor:', error.request);
//             } else {
//                 console.error('Error al configurar la petición:', error.message);
//             }
//         });

        
        soap.createClient(url, (err, client) => {
            if (err) return console.error('Error creando el cliente:', err);

            const presentacion = {
                presentacionDataHandler: contentId,
                fileName: fileName,
            };

            const args = {
                token: ticket.token,
                sign: ticket.sign,
                representadoCuit: cuit,
                presentacion: presentacion,
                fileContent: file,
                fileName: fileName,
            };

            const options = {
                attachments: [
                    {
                        mimetype: 'application/octet-stream',
                        contentId: contentId,
                        name: fileName,
                        body: file,
                    }
                ],
                forceMTOM: true,
            };

            const uploadPresentacion = client.upload.PresentacionProcessorMTOMImplPort.upload;

            uploadPresentacion(args, function(err, result, envelope, soapHeader) {
                if (err) return console.error('Error en upload:', err);
                console.log('Transaccion Numero:', result);
            },
            options,
            );
        });
    }

}

module.exports = {
    ArcaClient,
}