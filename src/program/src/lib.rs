use solana_program::{
    account_info::{AccountInfo},
    pubkey::Pubkey,
    entrypoint,
    entrypoint::ProgramResult,
    program_error::ProgramError,
    msg
};
use borsh::{BorshDeserialize, BorshSerialize};

entrypoint!(run_program);

#[derive(BorshDeserialize, BorshSerialize)]
pub struct CounterData {
    pub value: i32,
}

pub fn run_program(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instructions: &[u8]
) -> ProgramResult {
    if accounts.len() == 0 {
        msg!("No accounts found!");
        return Err(ProgramError::AccountDataTooSmall);
    }

    let account = &accounts[0];
    if account.owner != program_id {
        msg!("Data owner should be the program owner");
        return Err(ProgramError::IllegalOwner);
    }

    let mut counter = CounterData::try_from_slice(&account.data.borrow())?;
    counter.value += 1;
    counter.serialize(&mut &mut account.data.borrow_mut()[..])?;

    msg!("Set the counter value to: {}", counter.value);
    
    Ok(())
}
