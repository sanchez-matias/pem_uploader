const fs = require('fs');
const Afip = require('@afipsdk/afip.js');
const path = require('path');
const soap = require('soap');

class ArcaClient {

    static async getArcaTicket({cert_path, key_path, cuit, options}) {
        const SERVICE = 'djprocessorcontribuyente_cf';

        const cert = fs.readFileSync(cert_path, {encoding: 'utf8'});
        const key = fs.readFileSync(key_path, {encoding: 'utf8'});    

        const afip = Afip({
            cert,
            key,
            CUIT: cuit,
            production: true,
            access_token: 'iE97v5WXA1vVcbwr1ISFZpAeYvUPqGgsmYOgveI2hMGb4zcWu4GvJUR8TC2goy1m'
        });        

        const ws = afip.WebService(SERVICE, options);
        const ticket = await ws.getTokenAuthorization();

        if ( !ticket.token || !ticket.sign) {
            throw new Error('HUBO UN ERROR AL EXPEDIR EL TICKET');
        };

        return ticket;
    }

    static async getWebServiceStatus() {
        const url = path.join(__dirname, '../../wsdl/dummy.wsdl');
        // let isServiceOk;
        const isServiceOk = await fetch(url);

        return isServiceOk;
    }

    static async upload({ticket, filePath, cuit}) {
        const url = path.join(__dirname, '../../wsdl/uploadPresentacionService.wsdl');
        const file = fs.readFileSync(filePath);
        const fileName = path.basename(filePath);

        const clientOptions = {
            parseReponseAttachments: true,
        }
        
        soap.createClient(url, clientOptions, async(clientError, client) => {
            if ( clientError ) return console.error(`Hubo un problema creando el cliente ${clientError}`);

            client.on('request', function (xml, eid) {
               console.log('Solicitud SOAP enviada:\n', xml);
            });

            const presentacion = {
                presentacionDataHandler: `cid:${fileName}`,
                fileName: fileName,
            };

            const args = {
                token: ticket.token,
                sign: ticket.sign,
                representadoCuit: cuit,
                presentacion: presentacion,
            };

            const uploadOptions = {
                forceMTOM: true,
                // timeout: 60000,
                forceGzip: true,
                attachments: [{
                    mimetype: 'application/octet-stream',
                    contentId: `cid:${fileName}`,
                    name: fileName,
                    body: file,
                }],
            };

            try {
                const result = await client.uploadAsync(args, uploadOptions);
                console.log(result);
            } catch (error) {
                console.log(error);
            }
        });
    }

}

module.exports = {
    ArcaClient,
}