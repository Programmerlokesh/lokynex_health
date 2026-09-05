using MediatR;

namespace LokynexHealth.Application.Orders.Commands.CreateOrder;

public class CreateOrderCommand : IRequest<Guid>
{
    // Patient (find-or-create by phone)
    public string PatientPhone { get; set; } = default!;
    public int? PatientAge { get; set; }
    public string? PatientGender { get; set; }
    public string? PatientAddress { get; set; }
    public string? PatientEmail { get; set; }
    public string? PatientWhatsapp { get; set; }

    // Optional relative (order placed for a family member)
    public string? RelativeName { get; set; }
    public int? RelativeAge { get; set; }
    public string? RelativeRelationship { get; set; }
    public string? RelativeGender { get; set; }

    public Guid BranchId { get; set; }
    public Guid? DoctorId { get; set; }
    public Guid? ReferralId { get; set; }

    public string DiscountType { get; set; } = "Flat";
    public decimal DiscountValue { get; set; }
    public bool IsComplimentary { get; set; }
    public string? PaymentMethod { get; set; }
    public decimal PaidAmount { get; set; }

    public List<OrderItemInput> Items { get; set; } = new();
}

public class OrderItemInput
{
    public Guid TestId { get; set; }
    public Guid? TechnicianId { get; set; }
    public bool DoctorCommissionEnabled { get; set; }
    public bool ReferralCommissionEnabled { get; set; }
}