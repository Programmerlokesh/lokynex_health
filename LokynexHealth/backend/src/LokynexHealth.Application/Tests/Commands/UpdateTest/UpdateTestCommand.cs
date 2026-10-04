using MediatR;

namespace LokynexHealth.Application.Tests.Commands.UpdateTest;

public class UpdateTestCommand : IRequest
{
    public Guid Id { get; set; }                       // set from the route
    public string Name { get; set; } = default!;
    public decimal Price { get; set; }
    public string Status { get; set; } = "Active";     // "Active" | "Inactive"

    public string DoctorCommissionType { get; set; } = "Flat";
    public decimal DoctorCommissionValue { get; set; }
    public string ReferralCommissionType { get; set; } = "Flat";
    public decimal ReferralCommissionValue { get; set; }
    public string TechnicianCommissionType { get; set; } = "Flat";
    public decimal TechnicianCommissionValue { get; set; }

    /// <summary>The COMPLETE list of per-person commissions for this test (rows not listed are removed).</summary>
    public List<TestCommissionInput> Commissions { get; set; } = new();
}