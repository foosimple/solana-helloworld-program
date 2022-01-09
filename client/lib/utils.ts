import { Keypair } from "@solana/web3.js";
import fs from 'fs';

export function loadKeyPairFromDisk(pathname: string): Keypair {
    const payerWalletData = JSON.parse(fs.readFileSync(pathname, 'utf-8'));
    return Keypair.fromSecretKey(Uint8Array.from(payerWalletData));;
}