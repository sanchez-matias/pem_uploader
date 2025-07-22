const fs = require('fs');
const Afip = require('@afipsdk/afip.js');
const axios = require('axios');
const path = require('path');

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
        try {
            const fileName = path.basename(filePath);
            const mtomFile = fs.readFileSync(filePath);
            const base64Zip = mtomFile.toString('base64');


            const soapRequest = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
 xmlns:dom="http://domain.presentacion.seti.osiris.arca.gov/">
    <soapenv:Header/>
    <soapenv:Body>
     <dom:upload>
<token>${ticket.token}</token>

<sign>${ticket.sign}</sign>
    <representadoCuit>${cuit}</representadoCuit>
    <presentacion>
     <presentacionDataHandler>${base64Zip}</presentacionDataHandler>
     <fileName>${fileName}</fileName>
    </presentacion>
   </dom:upload>
  </soapenv:Body>
</soapenv:Envelope>`;

            axios.post('https://awshomo.arca.gov.ar/setiws/webservices/uploadPresentacionService?wsdl', soapRequest, {
                headers: {
                    'Content-Type': 'text/xml',
                    'SOAPAction': 'http://ar.gov.afip.dif.FVE1/uploadPresentacionService'
                }
            })
            .then(res => console.log('Exito'));
    

        } catch (error) {
            console.error(`FALLO EN LA SUBIDA DE ARCHIVOS: ${error}`);
        }
    }

}

module.exports = {
    ArcaClient,
}