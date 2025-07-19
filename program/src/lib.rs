use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    entrypoint, 
    account_info::{
        next_account_info,
        AccountInfo
    }, 
    entrypoint::ProgramResult, 
    pubkey::Pubkey,
    program_error::ProgramError,
};

#[derive(BorshSerialize, BorshDeserialize)]
struct Number {
    count: u32
}

#[derive(BorshSerialize, BorshDeserialize)]
enum Instruction {
    Init,
    Double,
    Half,
    Add { val: u32 },
    Subtract { val: u32 },
}

entrypoint!(process_instruction);


fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8]
) -> ProgramResult {
    
    let mut iter = accounts.iter();
    let data_account = next_account_info(&mut iter)?;
    
    if !data_account.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let instruction = Instruction::try_from_slice(instruction_data)?;
    let mut data = Number::try_from_slice(&data_account.data.borrow())?;
    
    match instruction {
        Instruction::Init => {
            data.count = 1;
        },
        Instruction::Double => {
            data.count = data.count.saturating_mul(2);
        },
        Instruction::Half => {
            data.count = data.count / 2;
        },
        Instruction::Add { val } => {
            data.count = data.count.saturating_add(val);
        },
        Instruction::Subtract { val } => {
            data.count = data.count.saturating_sub(val);
        },
    }
    
    data.serialize(&mut *data_account.data.borrow_mut())?;
    Ok(())
}