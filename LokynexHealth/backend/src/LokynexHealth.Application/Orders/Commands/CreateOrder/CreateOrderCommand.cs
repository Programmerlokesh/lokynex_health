using MediatR;

namespace LokynexHealth.Application.Orders.Commands.CreateOrder;

public class CreateOrderCommand : IRequest<Guid>
{
    // ---- Patient (find-or-create by phone). The first person registered under a
    // phone number is the family GUARDIAN; everybody else is a relative. ----
    public string PatientPhone { get; set; } = default!;

    /// <summary>Guardian name — required only when the phone number is new.</summary>
    public string? PatientName { get; set; }
    public int? PatientAge { get; set; }
    public string? PatientGender { get; set; }
    public string? PatientAddress { get; set; }
    public string? PatientEmail { get; set; }
    public string? PatientWhatsapp { get; set; }

    // ---- Who the order is for. Leave all Relative* empty = the guardian. ----
    /// <summary>An existing family member (picked from the phone-search result).</summary>
    public Guid? RelativeId { get; set; }

    /// <summary>A new family member added on this order ("Add patient").</summary>
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

    /// <summary>Legacy single-payment shape; used only when <see cref="Payments"/> is empty.</summary>
    public string? PaymentMethod { get; set; }
    public decimal PaidAmount { get; set; }

    /// <summary>Split payments, e.g. Cash 500 + UPI 300.</summary>
    public List<OrderPaymentInput> Payments { get; set; } = new();

    public List<OrderItemInput> Items { get; set; } = new();
}

public class OrderPaymentInput
{
    public string Method { get; set; } = default!;
    public decimal Amount { get; set; }
}

public class OrderItemInput
{
    public Guid TestId { get; set; }
    public Guid? TechnicianId { get; set; }
    public bool DoctorCommissionEnabled { get; set; }
    public bool ReferralCommissionEnabled { get; set; }
}