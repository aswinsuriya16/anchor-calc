use anchor_lang::prelude::*;

#[derive(Debug)]
struct Rectangle {
    length : u32,
    width : u32
}

impl Rectangle {
    fn area(&self) -> u32 {
        self.length * self.width
    }
}

declare_id!("")

#[program]
pub mod calculator {
    use super::*;

    pub fn initialize(ctx : Context(Initialize)) -> Result<()> {
        ctx.accounts.account.data = 1;
        Ok(())
    }

    pub fn add(ctx : Context(Add) , value : u32) -> Result<()> {
        ctx.accounts.account.data = ctx.accounts.account.data  + value;
        Ok(())
    }

    pub fn sub(ctx : Context(Subtract) , value : u32) -> Result<()> {
        ctx.accounts.account.data = ctx.accounts.account.data - value;
        Ok(())
    }

    pub fn mul(ctx : Context(Multiply) , value : u32) -> Result<()> {
        ctx.accounts.account.data = ctx.accounts.account.data * value;
        Ok(())
    }

    pub fn div(ctx : Context(Divide) , value : u32) -> Result<()> {
        ctx.accounts.account.data = ctx.accounts.account.data / value;
        Ok(())
    }
}

#[account]
struct NewAccount { 
    data : u32
}

#[derive(Accounts)]
pub struct Initialize<'info>{
    #[account(init,payer = signer, space = 8 + 8)]
    pub account : Account<'info,NewAccount>,
    #[account(mut)]
    pub signer : Signer<'info>,
    pub system_program : Program<'info,System>,
}

#[derive(Accounts)]
pub struct Add<'info> {
    #[account(mut)]
    pub account : Account<'info,NewAccount>,
    pub signer : Signer<'info>,
}

#[derive(Accounts)]
pub struct Subtract<'info> {
    #[account(mut)]
    pub account : Account<'info,NewAccount>,
    pub signer : Signer<'info>,
}

#[derive(Accounts)]
pub struct Multiply<'info> {
    #[account(mut)]
    pub account : Account<'info,NewAccount>,
    pub signer : Signer<'info>,
}

#[derive(Accounts)]
pub struct Divide<'info> {
    #[account(mut)]
    pub account : Account<'info,NewAccount>,
    pub signer : Signer<'info>,
}