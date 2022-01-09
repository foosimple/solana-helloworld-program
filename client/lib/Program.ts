import {
    clusterApiUrl, Keypair, Connection, LAMPORTS_PER_SOL,
    PublicKey, Transaction, SystemProgram, Cluster,
    sendAndConfirmTransaction,
    TransactionInstruction
} from '@solana/web3.js';
import * as borsh from 'borsh';


export default class Program<T> {
    conn: Connection;
    programId: PublicKey;
    schema: any;
    schemaSize: number = 0;
    classValue?: { new(): T };

    constructor(
        network: Cluster,
        programId: PublicKey
    ) {
        const rpcUrl = clusterApiUrl(network);
        this.conn = new Connection(rpcUrl);
        this.programId = programId;
    }

    async checkProgram() {
        const accountInfo = await this.conn.getAccountInfo(this.programId);
        if (!accountInfo) {
            throw new Error(`There is no such account with programId: ${this.programId.toBase58()}`)
        }

        if (!accountInfo.executable) {
            throw new Error(`The program of id: ${this.programId.toBase58()} is not an executable program.`)
        }
    }

    async checkBalance(payer: Keypair) {
        const { feeCalculator } = await this.conn.getRecentBlockhash();
        let fee = 0;

        // transactions fee (because we are going to do a lot of them)
        fee += feeCalculator.lamportsPerSignature * 100;

        // cost of data storage & renting
        fee += await this.conn.getMinimumBalanceForRentExemption(this.schemaSize);

        const balance = await this.conn.getBalance(payer.publicKey);
        
        console.log(`Estimate cost: ${fee / LAMPORTS_PER_SOL} SOL (You have: ${balance/LAMPORTS_PER_SOL} SOL)`);
        if (balance < fee) {
            throw new Error(`Insufficient balance in the account: ${payer.publicKey.toBase58()}`);
        }
    }

    async defineFields(classValue: { new(): T }, fields: string[][]) {
        this.classValue = classValue;
        this.schema = new Map([
            [classValue, {
                kind: 'struct',
                fields
            }]
        ]);

        this.schemaSize = borsh.serialize(this.schema, new classValue()).length;
    }

    async deriveDataAccountForProgram(fromPublicKey: PublicKey, seed: string) {
        return await PublicKey.createWithSeed(fromPublicKey, seed, this.programId);
    }

    async ensureDataAccountForProgram(payer: Keypair, seed: string) {
        const dataAccountId = await this.deriveDataAccountForProgram(payer.publicKey, seed);

        const dataAccountInfo = await this.conn.getAccountInfo(dataAccountId);
        const rentCost = await this.conn.getMinimumBalanceForRentExemption(this.schemaSize);

        if (!dataAccountInfo) {
            console.log("Creating the data account & paying for it.");
            this.checkBalance(payer);

            // we need to create a data account
            const transaction = new Transaction();
            transaction.add(SystemProgram.createAccountWithSeed({
                /** The account that will transfer lamports to the created account */
                fromPubkey: payer.publicKey,
                /** Public key of the created account. Must be pre-calculated with PublicKey.createWithSeed() */
                newAccountPubkey: dataAccountId,
                /** Base public key to use to derive the address of the created account. Must be the same as the base key used to create `newAccountPubkey` */
                basePubkey: payer.publicKey,
                /** Seed to use to derive the address of the created account. Must be the same as the seed used to create `newAccountPubkey` */
                seed: seed,
                /** Amount of lamports to transfer to the created account */
                lamports: rentCost,
                /** Amount of space in bytes to allocate to the created account */
                space: this.schemaSize,
                /** Public key of the program to assign as the owner of the created account */
                programId: this.programId
            }));
            
            await sendAndConfirmTransaction(this.conn, transaction, [payer]);
        }

        console.log(`Using the data accountId: ${dataAccountId.toBase58()}`);
        return dataAccountId;
    }

    async invoke(payer: Keypair, dataAccountId: PublicKey, inputData: Buffer = Buffer.alloc(0)) {
        const programInstruction = new TransactionInstruction({
            keys: [{pubkey: dataAccountId, isSigner: false, isWritable: true}],
            programId: this.programId,
            data: inputData
        });
    
        const transaction = new Transaction();
        transaction.add(programInstruction);
    
        await sendAndConfirmTransaction(this.conn, transaction, [payer]);
    }

    async readOutput(dataAccountId: PublicKey): Promise<T> {
        const accountInfo = await this.conn.getAccountInfo(dataAccountId);
        if (accountInfo === null) {
            throw new Error("There is no such data account")
        }

        if (!this.classValue) {
            throw new Error("Call .defineFields() first");
        }

        const value = borsh.deserialize(
            this.schema,
            this.classValue,
            accountInfo.data,
        );
        
        return value
    }
}