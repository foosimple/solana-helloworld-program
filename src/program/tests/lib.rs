use solana_program::{
    account_info::{AccountInfo},
    pubkey::Pubkey,
    program_error::ProgramError,
    clock::Epoch,
};
use solana_program_test::*;
use std::mem;
use my_program::{ run_program };

#[tokio::test]
async fn test_ok() {
    let program_id = Pubkey::default();

    let key = Pubkey::default();
    let owner = Pubkey::default();
    let mut lamports = 0;
    let mut data = vec![0; mem::size_of::<u32>()];
    let account = AccountInfo::new(
        &key,
        true,
        true,
        &mut lamports,
        &mut data,
        &owner,
        false,
        Epoch::default()
    );

    let accounts: Vec<AccountInfo> = vec![account];
    let instruction_data: Vec<u8> = vec![];
    let result = run_program(&program_id, &accounts, &instruction_data);
    assert_eq!(result, Ok(()));
}