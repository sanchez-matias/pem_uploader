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
    .option('d', {
        alias: 'dummy',
        type: 'boolean',
        default: false,
        describe: 'Calls dummy method',
    })
    .option('v', {
        alias: 'verbose',
        type: 'boolean',
        default: false,
        describe: 'Print some useful debug info',
    })
    .check(( argv ) => {

        ( argv.d )
            ? console.log('Proyecto inicializado en modo PRUEBAS')
            : console.log('Proyecto inicializado en modo PRODUCCION. Toda acción será definitiva.');

        return true;
    })
    .parseSync();


module.exports = {
    args,
}