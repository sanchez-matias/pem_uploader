const yargs = require("yargs");
const { hideBin } = require('yargs/helpers');
// const fs = require('fs');

const args = yargs( hideBin(process.argv) )
    // .option('c', {
    //     alias: 'config',
    //     type: 'string',
    //     demandOption: true,
    //     describe: 'Path to the configuration INI file (e.g., config.ini)',
    // })
    // .option('f', {
    //     alias: 'file',
    //     type: 'string',
    //     demandOption: true,
    //     describe: 'Path to the .pem or pem.bz2 file to upload',
    // })
    .option('p', {
        alias: 'production',
        type: 'boolean',
        default: false,
        describe: 'Initialize in production mode (default: false)',
    })
    .option('v', {
        alias: 'verbose',
        type: 'boolean',
        default: false,
        describe: 'Print some useful debug info',
    })
    .check(( argv ) => {

        ( argv.p )
            ? console.log('Proyecto inicializado en modo PRODUCCION. Toda acción será definitiva.')
            : console.log('Proyecto inicializado en modo PRUEBAS');

        return true;
    })
    .parseSync();


module.exports = {
    args,
}