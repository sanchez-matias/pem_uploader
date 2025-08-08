const { args, envs } = require('./plugins/index');
const { Server } = require("./presentation/server");

(async () => {
    await main();
})();

async function main() {
    const { p: production, v: verbose } = args;

    const certificates = {
        cert: ( production ) ? envs.CERT : envs.CERT_TESTING,
        key: ( production ) ? envs.KEY : envs.KEY_TESTING,
    }

    await Server.run({production, certificates, envs});

    // console.log('Fin del programa');

}
