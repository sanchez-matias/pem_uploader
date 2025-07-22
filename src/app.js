const { args, envs } = require('./plugins/index');
const { Server } = require("./presentation/server");

(async () => {
    await main();
})();

async function main() {
    const { d: dummy, v: verbose } = args;

    await Server.run({dummy, verbose, envs});

    console.log('Fin del programa');
}
