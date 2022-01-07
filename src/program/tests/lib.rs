use borsh::BorshDeserialize;
use solana_program::{
    account_info::{AccountInfo},
    pubkey::Pubkey,
    program_error::ProgramError,
    clock::Epoch,
};
use solana_program_test::*;
use std::mem;
use my_program::{ run_program, CounterData };

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

#[tokio::test]
async fn test_noaccounts() {
    let program_id = Pubkey::default();
    let accounts: Vec<AccountInfo> = Vec::new();
    let instruction_data: Vec<u8> = Vec::new();

    let result = run_program(&program_id, &accounts, &instruction_data);
    assert_eq!(result, Err(ProgramError::AccountDataTooSmall));
}

#[tokio::test]
async fn test_different_owner() {
    let program_id = Pubkey::default();

    let owner = Pubkey::new_unique();
    let mut lamports = 0;
    let mut data = vec![0; mem::size_of::<u32>()];
    let account = AccountInfo::new(
        &owner,
        true,
        true,
        &mut lamports,
        &mut data,
        &owner,
        false,
        Epoch::default()
    );

    let instruction_data: Vec<u8> = Vec::new();
    let accounts: Vec<AccountInfo> = vec![account];

    let result = run_program(&program_id, &accounts, &instruction_data);
    assert_eq!(result, Err(ProgramError::IllegalOwner));
}

#[tokio::test]
async fn test_counter_value() {
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
    run_program(&program_id, &accounts, &instruction_data).unwrap();
    run_program(&program_id, &accounts, &instruction_data).unwrap();
    
    let counter = CounterData::try_from_slice(&data).unwrap();
    assert_eq!(counter.value, 2);
}