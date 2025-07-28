const fileName = path.basename(filePath);
        const file = fs.readFileSync(filePath);

        // const url = 'https://aws.arca.gov.ar/setiws/webservices/uploadPresentacionService?wsdl';
        // const url = 'https://aws.afip.gov.ar/setiws/webservices/uploadPresentacionService?wsdl=uploadPresentacionService        // filepath: c:\Users\matia\js_projects\pem_uploader\src\presentation\arca.client.js
        const url = path.join(__dirname, '../../wsdl/uploadPresentacionService.wsdl');

        const options = { 
            forceMTOM: true,
            mtom: true,
        };

        soap.createClient(url, options, (err, client) => {
            if (err) {
                console.error(`Error al crear el cliente SOAP: ${err}`);
                return;
            }

            const presentacion = {
                presentacionDataHandler: {
                    value: file,
                    options: {
                        contentType: 'application/octet-stream', // o 'application/pdf' si aplica
                        include: true // Esto reemplaza la necesidad de .get_cid()
                    }
                },
                fileName: fileName,
            };

            const args = {
                token: ticket.token,
                sign: ticket.sign,
                representadoCuit: cuit,
                presentacion: presentacion,
            };

            const uploadPresentacion = client.upload.PresentacionProcessorMTOMImplPort.upload;

            uploadPresentacion(args, (err, result, envelope, soapHeader) => {
                if (err) {
                    console.error(`Error al subir el archivo: ${err}`);
                    return;
                }

                console.log('Resultado de la subida:', result);
                console.log('Envelope:', envelope);
                console.log('SOAP Header:', soapHeader);
            });
        });