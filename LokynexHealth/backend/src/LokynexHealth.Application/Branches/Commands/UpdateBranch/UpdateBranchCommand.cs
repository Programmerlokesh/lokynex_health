using MediatR;

namespace LokynexHealth.Application.Branches.Commands.UpdateBranch;

public class UpdateBranchCommand : IRequest
{
    public Guid Id { get; set; }
    public string BranchName { get; set; } = default!;
    public string? BranchAddress { get; set; }
    public string? BranchPincode { get; set; }
    public string? BranchPhone { get; set; }
    public string? BranchEmail { get; set; }
    public string Status { get; set; } = default!;
}