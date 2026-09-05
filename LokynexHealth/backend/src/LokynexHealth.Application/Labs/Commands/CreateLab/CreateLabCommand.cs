using MediatR;

namespace LokynexHealth.Application.Labs.Commands.CreateLab;

public class CreateLabCommand : IRequest<Guid>
{
    public string PrimaryBranchName { get; set; } = default!;
    public string PrimaryBranchAddress { get; set; } = default!;
    public string PrimaryBranchPhone { get; set; } = default!;
    public string PrimaryBranchEmail { get; set; } = default!;
    public string PrimaryBranchPincode { get; set; } = default!;

    public string AdminName { get; set; } = default!;
    public string AdminPhone { get; set; } = default!;
    public string? AdminAddress { get; set; }
    public string AdminEmail { get; set; } = default!;
    public string AdminUsername { get; set; } = default!;
    public string AdminPassword { get; set; } = default!;

    public int UserLimit { get; set; } = 5;

    public List<ExtendBranchInput> ExtendBranches { get; set; } = new();
}

public class ExtendBranchInput
{
    public string BranchName { get; set; } = default!;
    public string BranchCode { get; set; } = default!;
    public string? BranchAddress { get; set; }
    public string? BranchPincode { get; set; }
    public string? BranchPhone { get; set; }
}