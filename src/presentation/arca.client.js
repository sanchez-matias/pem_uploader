const fs = require('fs');
const Afip = require('@afipsdk/afip.js');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

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
        const url = 'https://aws.arca.gov.ar/setiws/webservices/uploadPresentacionService?wsdl';
        const file = fs.readFileSync(filePath);
        const fileBase64 = file.toString('base64');
        const fileName = path.basename(filePath);

        const boundary = `----=_Part_${uuidv4().replace(/-/g, '')}`;
        const soapId = `<${uuidv4().replace(/-/g, '')}@jsmtom.com>`;
        const attachmentId = `<${uuidv4().replace(/-/g, '')}@jsmtom.com>`;

        const soapMessage = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
xmlns:dom="http://domain.presentacion.seti.osiris.arca.gov/">
    <soapenv:Header/>
    <soapenv:Body>
        <dom:upload>
<token>${ticket.token}</token>
<sign>${ticket.sign}</sign>
    <representadoCuit>${cuit}</representadoCuit>
    <presentacion>
        <presentacionDataHandler>cid:${attachmentId.slice(1, -1)}.pem</presentacionDataHandler>
        <fileName>${fileName}</fileName>
    </presentacion>
 </dom:upload>
 </soapenv:Body>
 </soapenv:Envelope>`.trim();

        const bodyMtom = [
            `--${boundary}`,
            `Content-Type: application/xop+xml; charset=UTF-8; type="application/soap+xml"`,
            `Content-Transfer-Encoding: 8bit`,
            `Content-ID: ${soapId}`,
            '',
            soapMessage,
            `--${boundary}`,
            `Content-Type: application/octet-stream`,
            `Content-Transfer-Encoding: base64`,
            `Content-ID: ${attachmentId}`,
            `Content-Disposition: attachment; filename="${fileName}"`,
            '',
            fileBase64,
            `--${boundary}--`,
            ''
        ].join('\r\n');
        
        const headers = {
            'Content-Type': `multipart/related; type="application/xop+xml"; start="${soapId}"; start-info="application/soap+xml"; boundary="${boundary}"`,
            'SOAPAction': 'https://aws.afip.gov.ar/setiws/webservices/uploadPresentacionService?wsdl=uploadPresentacionServiceParent.wsdl'
        };

        try {
            const respuesta = await axios.post(url, bodyMtom, { headers: headers });
            console.log('Respuesta del servicio:', respuesta.data);
            return respuesta.data;
        } catch (error) {
            console.error('Error al enviar el archivo:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

}

module.exports = {
    ArcaClient,
}