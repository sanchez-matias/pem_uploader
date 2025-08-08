const { ArcaClient } = require('./arca.client');


class Server {

    static async run({production, certificates, envs}) {

        
        ArcaClient.getArcaTicket({
            cert_path: certificates.cert, 
            key_path: certificates.key, 
            cuit: envs.CUIT, 
        })
        
        .then( ticket => {
            console.log('TICKET EXPEDIDO CORRECTAMENTE');

            // setTimeout(() => {

            //     console.log('Subiendo comprobantes...');
            //     ArcaClient.upload({
            //         ticket: ticket,
            //         filePath: envs.FILE_DIR,
            //         cuit: envs.CUIT,
            //     });

            // }, 2000);
        })
        
        .catch( err => {
            console.error(`NO SE PUDO AUTENTICAR: ${err}`);
        });
    }
}

module.exports = {
    Server,
};