using MediatR;

namespace LokynexHealth.Application.Labs.Commands.UpdateLabBranch;

public class UpdateLabBranchCommand : IRequest
{
    public Guid LabId { get; set; }
    public Guid BranchId { get; set; }
    public string BranchName { get; set; } = default!;
    public string? BranchAddress { get; set; }
    public string? BranchPincode { get; set; }
    public string? BranchPhone { get; set; }

    /// <summary>"Active" or "Inactive". Lets SuperAdmin deactivate a branch
    /// without deleting it (deleting is blocked once staff are assigned).</summary>
    public string Status { get; set; } = "Active";
}