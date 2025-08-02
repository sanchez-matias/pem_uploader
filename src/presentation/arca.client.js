const { soap } = require('strong-soap');
const fs = require('fs');
const Afip = require('@afipsdk/afip.js');
const path = require('path');
const { randomUUID } = require('crypto');

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
        const contentId = `${randomUUID()}@pymtom-xop`;

        console.log(`El tamaño del archivo es de ${file.length}`);

        const clientOptions = {
            forceMTOM: true,
        };
        
        soap.createClient(url, clientOptions, (err, client) => {
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