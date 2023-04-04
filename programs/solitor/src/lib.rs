use anchor_lang::prelude::*;
use anchor_lang::solana_program::entrypoint::ProgramResult;

declare_id!("2mCYvrwQNtUhCv626cwLfnco78pnGqVd6aNGZLvSKK7t");

#[program]
pub mod solitor {
    use super::*;

    pub fn create(ctx: Context<Create>) -> ProgramResult {
        let audit = &mut ctx.accounts.audit;
        audit.owner = *ctx.accounts.user.key;
        audit.auditor = *ctx.accounts.auditor.key;
        Ok({})
    }

    pub fn add_audit(ctx: Context<Requester>, asset_hash: String) -> ProgramResult {
        let audit = &mut ctx.accounts.audit;
        let user = &mut ctx.accounts.user;

        if audit.owner != user.key() {
            return Err(ProgramError::IncorrectProgramId);
        }

        for asset in &audit.assets {
            if asset.asset == asset_hash {
                return Err(ProgramError::IncorrectProgramId); // already added
            }
        }

        audit.assets.push(AuditState { asset: asset_hash, status: 0 });
        Ok({})
    }

    pub fn respond_audit(ctx: Context<Auditor>, asset_hash: String, status: u8) -> ProgramResult {
        let audit = &mut ctx.accounts.audit;
        let user = &mut ctx.accounts.user;

        if audit.auditor != user.key() {
            return Err(ProgramError::Custom(1));
        }

        for asset in audit.assets.iter_mut() {
            if asset.asset == asset_hash {
                if 0 < asset.status {
                    return Err(ProgramError::Custom(2)); // already filed
                }

                asset.status = status;
                return Ok({});
            }
        }

        return Err(ProgramError::Custom(3)); // no match
    }
}

#[derive(Accounts)]
pub struct Create<'info> {
    #[account(init, payer=user, space=5000, seeds=[b"sol-audit-trail", user.key().as_ref(), auditor.key().as_ref()], bump)]
    pub audit: Account<'info, SolAudit>,
    #[account(mut)]
    pub user: Signer<'info>,
    /// CHECK: just need their public address
    pub auditor: AccountInfo<'info>, 
    pub system_program: Program<'info, System>,
}

#[derive(AnchorDeserialize, AnchorSerialize, Default, Clone)]
pub struct AuditState {
    pub asset: String,
    pub status: u8,
}

#[account]
pub struct SolAudit {
    pub assets: Vec<AuditState>,
    pub owner: Pubkey,
    pub auditor: Pubkey,
}

#[derive(Accounts)]
pub struct Requester<'info>{
    #[account(mut)]
    pub audit: Account<'info, SolAudit>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Auditor<'info>{
    #[account(mut)]
    pub audit: Account<'info, SolAudit>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}