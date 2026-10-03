using MediatR;

namespace LokynexHealth.Application.Labs.Commands.UpdateLab;

public class UpdateLabCommand : IRequest<Unit>
{
    public Guid Id { get; set; }

    public string PrimaryBranchName { get; set; } = default!;
    public string PrimaryBranchAddress { get; set; } = default!;
    public string PrimaryBranchPhone { get; set; } = default!;
    public string PrimaryBranchEmail { get; set; } = default!;
    public string PrimaryBranchPincode { get; set; } = default!;

    public string AdminName { get; set; } = default!;
    public string AdminPhone { get; set; } = default!;
    public string? AdminAddress { get; set; }
    public string AdminEmail { get; set; } = default!;

    /// <summary>Null = leave the current company type unchanged.</summary>
    public string? CompanyType { get; set; }

    public int UserLimit { get; set; }
    public string Status { get; set; } = default!;
}