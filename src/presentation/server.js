const { ArcaClient } = require('./arca.client');

class Server {

    static async run({dummy, verbose, envs}) {

        const SOAP_V_1_2 = false;

        const options = {
            'WSDL': envs.WSDL_PROD,
            'WSDL_TEST': envs.WSDL_HOMO,
            'URL': envs.WSAA_URL_PROD,
            'URL_TEST': envs.WSAA_URL_HOMO,
            'soapV1_2': SOAP_V_1_2,
        };
        

        // const isServiceOk = ArcaClient.getWebServiceStatus();

        // console.log(isServiceOk);


        ArcaClient.getArcaTicket({
            cert_path: envs.CERT, 
            key_path: envs.KEY, 
            cuit: envs.CUIT, 
            options: options,
        })
        
        .then( ticket => {
            console.log('TICKET EXPEDIDO CORRECTAMENTE');

            setTimeout(() => {

                console.log('Subiendo comprobantes...');
                ArcaClient.upload({
                    ticket: ticket,
                    filePath: envs.FILE_DIR,
                    cuit: envs.CUIT,
                });

            }, 2000);
        })
        
        .catch( err => {
            console.error(`NO SE PUDO AUTENTICAR: ${err}`);
        });
    }
}

module.exports = {
    Server,
};