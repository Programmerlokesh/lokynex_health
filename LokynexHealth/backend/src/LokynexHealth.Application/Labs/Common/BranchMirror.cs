using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;

namespace LokynexHealth.Application.Labs.Common;

/// <summary>
/// SuperAdmin-side branch creation used to write ONLY to platform.tenant_branches.
/// LabAdmin's own "Branches" tab reads ONLY from the tenant-schema `branches`
/// table — a completely different table with no shared key — so a branch the
/// SuperAdmin added was invisible to the lab that owns it, and could never be
/// edited again (no update command touched platform.tenant_branches at all).
///
/// Fix: every SuperAdmin branch operation now keeps TWO rows in lockstep,
/// using the SAME Guid as their Id:
///   - platform.tenant_branches  → SuperAdmin's per-lab registry (billing/ops view)
///   - lab_demo.branches         → the operational row LabAdmin's UI reads
///
/// Centralising the "build a Branch row" logic here means AddLabBranch,
/// UpdateLabBranch and CreateLab (initial branches) can't drift out of sync
/// with each other the way the two separate tables did.
/// </summary>
public static class BranchMirror
{
    public static TenantBranch BuildTenantBranch(
        Guid id,
        Guid tenantId,
        string branchName,
        string branchCode,
        string? branchAddress,
        string? branchPincode,
        string? branchPhone,
        DateTimeOffset createdAt) => new()
        {
            Id = id,
            TenantId = tenantId,
            BranchName = branchName,
            BranchCode = branchCode,
            BranchAddress = branchAddress,
            BranchPincode = branchPincode,
            BranchPhone = branchPhone,
            CreatedAt = createdAt
        };

    /// <summary>
    /// The lab's primary ("Main") branch as an operational row. Its Id is the
    /// tenant's own Id, so the SuperAdmin registry and the lab's `branches`
    /// table stay joinable without a separate mapping column. Without this row
    /// the Main branch could never appear in the New Order branch dropdown
    /// (orders.branch_id has a foreign key to `branches`).
    /// </summary>
    public static Branch BuildMainBranch(Tenant tenant) => new()
    {
        Id = tenant.Id,
        BranchName = tenant.PrimaryBranchName,
        BranchCode = tenant.LabCode,
        BranchAddress = tenant.PrimaryBranchAddress,
        BranchPincode = tenant.PrimaryBranchPincode,
        BranchPhone = tenant.PrimaryBranchPhone,
        BranchEmail = tenant.PrimaryBranchEmail,
        CreatedBySuperAdmin = true,
        IsMain = true,
        Status = RecordStatus.Active,
        CreatedBy = null,
        CreatedAt = tenant.CreatedAt
    };

    public static Branch BuildOperationalBranch(
        Guid id,
        string branchName,
        string branchCode,
        string? branchAddress,
        string? branchPincode,
        string? branchPhone,
        Guid? createdBy,
        DateTimeOffset createdAt) => new()
        {
            Id = id,
            BranchName = branchName,
            BranchCode = branchCode,
            BranchAddress = branchAddress,
            BranchPincode = branchPincode,
            BranchPhone = branchPhone,
            CreatedBySuperAdmin = true,
            Status = RecordStatus.Active,
            CreatedBy = createdBy,
            CreatedAt = createdAt
        };
}