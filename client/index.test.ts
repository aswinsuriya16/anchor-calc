import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction
} from "@solana/web3.js";
import { LiteSVM } from "litesvm";
import { describe, beforeEach, test, expect, beforeAll } from "bun:test";
import { serialize } from "borsh";

enum InstructionType {
  Init = 0,
  Double = 1,
  Half = 2,
  Add = 3,
  Subtract = 4,
}

function createInstructionData(instructionType: InstructionType, value?: number): Buffer {
  switch (instructionType) {
    case InstructionType.Init:
    case InstructionType.Double:
    case InstructionType.Half:
      return Buffer.from([instructionType]);
    
    case InstructionType.Add:
    case InstructionType.Subtract:
      if (value === undefined) {
        throw new Error("Value required to add/sub");
      }
      // Borsh serialization: instruction type + 4 bytes for u32 value 
      const buffer = Buffer.alloc(5);
      buffer[0] = instructionType;
      //le -> little endian
      buffer.writeUInt32LE(value, 1);
      return buffer;
    
    default:
      throw new Error("Unknown instruction type");
  }
}

describe("Counter Program Tests", () => {
    let svm: LiteSVM;
    let programId: PublicKey;
    let dataAccount: Keypair;
    let userAccount: Keypair;
  
    beforeAll(() => {
      svm = new LiteSVM();
      programId = PublicKey.unique();
      svm.addProgramFromFile(programId, "./deployed.so");
      dataAccount = new Keypair();
      userAccount = new Keypair();
      svm.airdrop(userAccount.publicKey, BigInt(LAMPORTS_PER_SOL));
      
      let ix = SystemProgram.createAccount({
        fromPubkey: userAccount.publicKey,
        newAccountPubkey: dataAccount.publicKey,
        lamports: Number(svm.minimumBalanceForRentExemption(BigInt(4))),
        space: 4,
        programId
      });
      
      let tx = new Transaction().add(ix);
      tx.recentBlockhash = svm.latestBlockhash();
      tx.sign(userAccount, dataAccount);
      svm.sendTransaction(tx);
      svm.expireBlockhash();
    });

    test("Initialize counter to 1", () => {
        const instruction = new TransactionInstruction({
            programId,
            keys: [
                { pubkey: dataAccount.publicKey, isSigner: true, isWritable: true }
            ],
            data: createInstructionData(InstructionType.Init)
        });

        const transaction = new Transaction().add(instruction);
        transaction.recentBlockhash = svm.latestBlockhash();
        transaction.feePayer = userAccount.publicKey;
        transaction.sign(dataAccount, userAccount);
        svm.sendTransaction(transaction);

        const updatedAccountData = svm.getAccount(dataAccount.publicKey);
        if (!updatedAccountData) {
            throw new Error("Account not found");
        }

        // Check count = 1 -> little-endian: [1, 0, 0, 0]
        expect(updatedAccountData.data[0]).toBe(1);
        expect(updatedAccountData.data[1]).toBe(0);
        expect(updatedAccountData.data[2]).toBe(0);
        expect(updatedAccountData.data[3]).toBe(0);
    });

    test("It doubles the counter value", () => {
        const instruction = new TransactionInstruction({
            programId,
            keys: [
                { pubkey: dataAccount.publicKey, isSigner: true, isWritable: true }
            ],  
            data: createInstructionData(InstructionType.Double)
        });

        const transaction = new Transaction().add(instruction);
        transaction.recentBlockhash = svm.latestBlockhash();
        transaction.feePayer = userAccount.publicKey;
        transaction.sign(dataAccount, userAccount);
        svm.sendTransaction(transaction);

        const updatedAccountData = svm.getAccount(dataAccount.publicKey);
        if (!updatedAccountData) {
            throw new Error("Account not found");
        }

        // Should be 2 now (1 * 2 = 2)
        expect(updatedAccountData.data[0]).toBe(2);
        expect(updatedAccountData.data[1]).toBe(0);
        expect(updatedAccountData.data[2]).toBe(0);
        expect(updatedAccountData.data[3]).toBe(0);
    });

    test("It halves the counter value", () => {
        const instruction = new TransactionInstruction({
            programId,
            keys: [
                { pubkey: dataAccount.publicKey, isSigner: true, isWritable: true }
            ],  
            data: createInstructionData(InstructionType.Half)
        });

        const transaction = new Transaction().add(instruction);
        transaction.recentBlockhash = svm.latestBlockhash();
        transaction.feePayer = userAccount.publicKey;
        transaction.sign(dataAccount, userAccount);
        svm.sendTransaction(transaction);

        const updatedAccountData = svm.getAccount(dataAccount.publicKey);
        if (!updatedAccountData) {
            throw new Error("Account not found");
        }

        // Should be 1 now (2 / 2 = 1)
        expect(updatedAccountData.data[0]).toBe(1);
        expect(updatedAccountData.data[1]).toBe(0);
        expect(updatedAccountData.data[2]).toBe(0);
        expect(updatedAccountData.data[3]).toBe(0);
    });

    test("Adds a value to the counter", () => {
        const instruction = new TransactionInstruction({
            programId,
            keys: [
                { pubkey: dataAccount.publicKey, isSigner: true, isWritable: true }
            ],  
            data: createInstructionData(InstructionType.Add, 5) 
        });

        const transaction = new Transaction().add(instruction);
        transaction.recentBlockhash = svm.latestBlockhash();
        transaction.feePayer = userAccount.publicKey;
        transaction.sign(dataAccount, userAccount);
        svm.sendTransaction(transaction);

        const updatedAccountData = svm.getAccount(dataAccount.publicKey);
        if (!updatedAccountData) {
            throw new Error("Account not found");
        }

        // Should be 6 now (1 + 5 = 6)
        expect(updatedAccountData.data[0]).toBe(6);
        expect(updatedAccountData.data[1]).toBe(0);
        expect(updatedAccountData.data[2]).toBe(0);
        expect(updatedAccountData.data[3]).toBe(0);
    });

    test("Subtracts a value from the counter", () => {
        const instruction = new TransactionInstruction({
            programId,
            keys: [
                { pubkey: dataAccount.publicKey, isSigner: true, isWritable: true }
            ],  
            data: createInstructionData(InstructionType.Subtract, 3) 
        });

        const transaction = new Transaction().add(instruction);
        transaction.recentBlockhash = svm.latestBlockhash();
        transaction.feePayer = userAccount.publicKey;
        transaction.sign(dataAccount, userAccount);
        svm.sendTransaction(transaction);

        const updatedAccountData = svm.getAccount(dataAccount.publicKey);
        if (!updatedAccountData) {
            throw new Error("Account not found");
        }

        // Should be 3 now (6 - 3 = 3)
        expect(updatedAccountData.data[0]).toBe(3);
        expect(updatedAccountData.data[1]).toBe(0);
        expect(updatedAccountData.data[2]).toBe(0);
        expect(updatedAccountData.data[3]).toBe(0);
    });
});