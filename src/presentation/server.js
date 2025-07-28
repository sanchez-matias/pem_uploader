const { ArcaClient } = require('./arca.client');


class Server {

    static async run({dummy, verbose, envs}) {

        const soapV1_2 = true;
        
        // const cert = fs.readFileSync(envs.CERT, {encoding: 'utf8'});
        // const key = fs.readFileSync(envs.KEY, {encoding: 'utf8'});

        // const afip = Afip({
        //     cert,
        //     key,
        //     CUIT: envs.CUIT,
        //     production: true,
        //     access_token: 'iE97v5WXA1vVcbwr1ISFZpAeYvUPqGgsmYOgveI2hMGb4zcWu4GvJUR8TC2goy1m'
        // });

        const options = {
            'WSDL': envs.WSDL_PROD,
	        'WSDL_TEST': envs.WSDL_HOMO,
	        'URL': envs.WSAA_URL_PROD,
	        'URL_TEST': envs.WSAA_URL_HOMO,
	        'soapV1_2': soapV1_2
        }

        // const loginWS = afip.WebService(SERVICE, loginOptions);
        // const ticket = await loginWS.getTokenAuthorization();

        // if ( !ticket.token || !ticket.sign) {
        //     throw new Error('HUBO UN ERROR AL EXPEDIR EL TICKET');
        // };

        // console.log('Ticket Expedido Correctamente. Se intentará subir el archivo');



        // const presentacion = {
        //     presentacionDataHandler: `cid:${envs.FILE_DIR}`,
        //     fileName: envs.FILE_DIR,
        // };

        // const uploadOptions = {
        //     token: ticket.token,
        //     sign: ticket.sign,
        //     representadoCuit: envs.CUIT,
        //     presentacion: presentacion,
        // };

        // const url = path.join(__dirname, '../wsdl/uploadPresentacionService.xml');
        // const result = await loginWS.executeRequest(url, uploadOptions);

        // console.log(result);

        // await ArcaClient.getWebServiceStatus()
        //     .then(isServiceOk => {
        //         if (!isServiceOk) {
        //             throw new Error('El servicio de ARCA no está activo. Intente mas tarde.');
        //         }
        //     });
        
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