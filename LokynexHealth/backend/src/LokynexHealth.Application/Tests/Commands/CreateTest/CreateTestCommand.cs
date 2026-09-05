using MediatR;

namespace LokynexHealth.Application.Tests.Commands.CreateTest;

public class CreateTestCommand : IRequest<Guid>
{
    public Guid DepartmentId { get; set; }
    public string Name { get; set; } = default!;
    public decimal Price { get; set; }

    public string DoctorCommissionType { get; set; } = "Flat";
    public decimal DoctorCommissionValue { get; set; }

    public string ReferralCommissionType { get; set; } = "Flat";
    public decimal ReferralCommissionValue { get; set; }

    public string TechnicianCommissionType { get; set; } = "Flat";
    public decimal TechnicianCommissionValue { get; set; }
}