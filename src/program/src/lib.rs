use solana_program::{
    account_info::{AccountInfo},
    pubkey::Pubkey,
    entrypoint,
    entrypoint::ProgramResult,
    program_error::ProgramError,
    msg
};

entrypoint!(run_program);

pub fn run_program(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instructions: &[u8]
) -> ProgramResult {
    msg!("Executing the program of id: {}", program_id);
    
    Ok(())
}
