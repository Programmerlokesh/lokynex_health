using MediatR;

namespace LokynexHealth.Application.Labs.Commands.AddLabBranch;

public class AddLabBranchCommand : IRequest<Guid>
{
    public Guid LabId { get; set; }
    public string BranchName { get; set; } = default!;
    public string BranchCode { get; set; } = default!;
    public string? BranchAddress { get; set; }
    public string? BranchPincode { get; set; }
    public string? BranchPhone { get; set; }
}