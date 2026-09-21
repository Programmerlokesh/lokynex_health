using MediatR;

namespace LokynexHealth.Application.Labs.Commands.DeleteLabBranch;

public class DeleteLabBranchCommand : IRequest
{
    public Guid LabId { get; set; }
    public Guid BranchId { get; set; }
}