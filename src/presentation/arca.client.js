const fs = require('fs');
const Afip = require('@afipsdk/afip.js');
const path = require('path');
const soap = require('strong-soap').soap;

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
        const url = 'https://aws.arca.gov.ar/setiws/webservices/uploadPresentacionService?wsdl';
        const request = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"xmlns:dom="http://domain.presentacion.seti.osiris.arca.gov/">
            <soapenv:Header/>
            <soapenv:Body>
                <dom:dummy/>
            </soapenv:Body>
        </soapenv:Envelope>`;

        try {
            const response = await fetch( url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'text/xml; charset=utf-8',
                    // 'SOAPAction': `${namespaceSOAP}djprocessorcontribuyente_cf`
                },
            });

            if (!response.ok) {
                throw new Error('HTTP error!')
            }

            const responseText = await response.text();
            console.log(response);

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(responseText, 'text/xml');

            return xmlDoc;

        } catch (error) {
            console.log(`Error al llamar al servicio SOAP: ${error}`);
            throw error;
        }
    }

    static async upload({ticket, filePath, cuit}) {
        const fileName = path.basename(filePath);
        const file = fs.readFileSync(filePath);
        const url = 'https://aws.afip.gov.ar/setiws/webservices/uploadPresentacionService?wsdl=uploadPresentacionServiceParent.wsdl';

        const options = { 
            forceMTOM: true,
            mtom: true ,
        };

        const data = {
            token: ticket.token,
            sign: ticket.sign,
            representadoCuit: cuit,
            fileName: fileName, // o 'archivo.xml.gz' si comprimís
            presentacionDataHandler: {
                value: file,
                options: {
                    contentType: 'application/octet-stream',
                    include: true // <-- para usar xop:Include
                }
            },
        };

        soap.createClient(url, options, (err, client) => {
            if (err) return console.error('Error al crear cliente:', err);

            const des = client.describe();
            
            const upload = client.xmlHandler.schemas["http://domain.presentacion.seti.osiris.afip.gov/"].complexTypes.upload;


            // upload(data, (err, result, envelope, soapHeader) => {
            //     if (err) return console.error(err);
            //     console.log(`Exito: ${result}`);
            // });
        });
    }

}

module.exports = {
    ArcaClient,
}