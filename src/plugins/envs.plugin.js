require('dotenv/config');
const env = require('env-var');

const envs = {

    // Data
    CUIT: env.get('CUIT').required().asInt(),
    REPRESENTADO_CUIT: env.get('REPRESENTADO_CUIT').asString(), // <--- Si se quiere rellenar este campo, será parseado como string
    KEY_PASSPHRASE: env.get('KEY_PASSPHRASE').asString(),
    FILE_DIR: env.get('FILE_DIR').required().asString(),
    
    // Certs
    CERT: env.get('CERT').required().asString(),
    KEY: env.get('KEY').required().asString(),
    CERT_TESTING: env.get('CERT_TESTING').required().asString(),
    KEY_TESTING: env.get('KEY_TESTING').required().asString(),

    // Base URLs
    WSDL_HOMO: env.get('WSDL_HOMO').required().asUrlString(),
    WSDL_PROD: env.get('WSDL_PROD').required().asUrlString(),
    WSAA_URL_HOMO: env.get('WSAA_URL_HOMO').required().asUrlString(),
    WSAA_URL_PROD: env.get('WSAA_URL_PROD').required().asUrlString(),
}

module.exports = {
    envs,
}