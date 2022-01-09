// load the keys & so files
import { loadKeyPairFromDisk } from '../lib/utils';
import path from 'path';
import Program from '../lib/Program';

const APP_DIR = path.resolve(__dirname, "../../dist/program");
const APP_KEYPAIR = loadKeyPairFromDisk(path.resolve(APP_DIR, 'my_program-keypair.json'));
const PAYER_KEYPAIR = loadKeyPairFromDisk(path.resolve(__dirname, "../../keys/wallet.json"));

// generate the struct
class CounterData {
    counter: number = 0;
    constructor(fields: {counter: number} | undefined = undefined) {
        if (fields) {
            this.counter = fields.counter;
        }
    }
}
const programId = APP_KEYPAIR.publicKey;
const payerPubKey = PAYER_KEYPAIR.publicKey;
const program = new Program<CounterData>("devnet", programId);

program.defineFields(CounterData, [
    ["counter", "u32"]
]);

async function main() {
    await program.checkProgram();

    const dataAccountId = await program.deriveDataAccountForProgram(payerPubKey, "this-is-the-seed");
    const output = await program.readOutput(dataAccountId);

    console.log(`COUNTER=${output.counter}`);

    process.exit(0);
}   

main()
    .catch((err: Error) => {
        console.error(err);
        process.exit(1);
    })
