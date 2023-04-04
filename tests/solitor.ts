import * as anchor from "@project-serum/anchor";
import { Program, utils } from "@project-serum/anchor";
import { Solitor } from "../target/types/solitor";
import { PublicKey, SystemProgram } from "@solana/web3.js";

import idl from '../target/idl/solitor.json';
import AUDITOR_SECRET from '../auditor-keypair.json';
import { assert } from "chai";

const idlString = JSON.stringify(idl);
const idlObject = JSON.parse(idlString);
const programID = new PublicKey(idl.metadata.address);

describe("solitor", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.local("http://127.0.0.1:8899");
  anchor.setProvider(provider);
  
  const program = new Program(idlObject, programID, anchor.getProvider());

  const user = (program.provider as anchor.AnchorProvider).wallet;
  const auditor = anchor.web3.Keypair.fromSecretKey(new Uint8Array(AUDITOR_SECRET));;
  const other = anchor.web3.Keypair.generate();

  console.log('user: ', user.publicKey);
  console.log('auditor: ', auditor.publicKey);
  



  it.skip("Is created!", async () => {
    const [ auditPDA ] = await PublicKey.findProgramAddressSync([
      utils.bytes.utf8.encode("sol-audit-trail"), 
      user.publicKey.toBuffer(),
      auditor.publicKey.toBuffer(),
    ], program.programId); // program id for smart contract

    console.log('auditPDA: ', auditPDA);

    // Add your test here.
    const tx = await program.methods.create().accounts({
      audit: auditPDA,
      user: user.publicKey,
      auditor: auditor.publicKey,
      systemProgram: SystemProgram.programId
    }).rpc();

    console.log("Your transaction signature", tx);
  });

  it.skip('Read auditor', async () => {
    const [ auditPDA ] = await PublicKey.findProgramAddressSync([
      utils.bytes.utf8.encode("sol-audit-trail"), 
      user.publicKey.toBuffer(),
      auditor.publicKey.toBuffer(),
    ], program.programId);
    
    const auditPDAccount = await program.account.solAudit.fetch(auditPDA);
    //console.log('auditPDAccount: ', auditPDAccount);

    assert.isTrue(user.publicKey.equals(auditPDAccount.owner));
    assert.isTrue(auditor.publicKey.equals(auditPDAccount.auditor));

  });

  it.skip('Add audit', async () => {
    const [ auditPDA ] = await PublicKey.findProgramAddressSync([
      utils.bytes.utf8.encode("sol-audit-trail"), 
      user.publicKey.toBuffer(),
      auditor.publicKey.toBuffer(),
    ], program.programId);

    const tx = await program.methods.addAudit("1").accounts({
      audit: auditPDA,
      user: user.publicKey,
      systemProgram: SystemProgram.programId
    }).rpc();

    const auditPDAccount = await program.account.solAudit.fetch(auditPDA);
    //console.log('auditPDAccount: ', auditPDAccount);
  });

  it.skip('Respond to audit (auditor signs)', async () => {
    const [ auditPDA ] = await PublicKey.findProgramAddressSync([
      utils.bytes.utf8.encode("sol-audit-trail"), 
      user.publicKey.toBuffer(),
      auditor.publicKey.toBuffer(),
    ], program.programId);

    const tx = await program.methods.respondAudit("1", 21).accounts({
      audit: auditPDA,
      user: auditor.publicKey,
      systemProgram: SystemProgram.programId
    }).signers([auditor]).rpc();

    const auditPDAccount = await program.account.solAudit.fetch(auditPDA);
    console.log('auditPDAccount: ', auditPDAccount);

  });
});
