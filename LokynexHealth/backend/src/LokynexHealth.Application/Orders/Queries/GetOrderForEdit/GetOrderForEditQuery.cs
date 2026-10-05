using MediatR;

namespace LokynexHealth.Application.Orders.Queries.GetOrderForEdit;

public class GetOrderForEditQuery : IRequest<OrderEditDto>
{
    public Guid Id { get; set; }
}

/// <summary>Everything the New-Order form needs to open pre-filled for an edit.</summary>
public class OrderEditDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = default!;
    public bool IsDeleted { get; set; }

    public EditPatientDto Patient { get; set; } = default!;
    public Guid? RelativeId { get; set; }

    public Guid BranchId { get; set; }
    public EditPartyDto? Doctor { get; set; }
    public EditPartyDto? Referral { get; set; }

    public string DiscountType { get; set; } = "Flat";
    public decimal DiscountValue { get; set; }
    public bool IsComplimentary { get; set; }

    public List<EditLineDto> Items { get; set; } = new();
    public List<EditPaymentDto> Payments { get; set; } = new();
}

public class EditPatientDto
{
    public Guid Id { get; set; }
    public string PatientCode { get; set; } = default!;
    public string FullName { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public int? Age { get; set; }
    public string? Gender { get; set; }
    public string? Address { get; set; }
    public string? Email { get; set; }
    public List<EditRelativeDto> Relatives { get; set; } = new();
}

public class EditRelativeDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public int? Age { get; set; }
    public string? Gender { get; set; }
    public string? Relationship { get; set; }
}

public class EditPartyDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public string? Address { get; set; }
    public string? Email { get; set; }
    public string? Specialization { get; set; }
}

public class EditLineDto
{
    public Guid TestId { get; set; }
    public string TestName { get; set; } = default!;
    public Guid DepartmentId { get; set; }
    public string DepartmentName { get; set; } = default!;
    /// <summary>The price this order was billed at.</summary>
    public decimal Price { get; set; }
    public string ReferralCommissionType { get; set; } = "Flat";
    public decimal ReferralCommissionValue { get; set; }
    public Guid? TechnicianId { get; set; }
    public bool DoctorCommissionEnabled { get; set; }
    public bool ReferralCommissionEnabled { get; set; }
}

public class EditPaymentDto
{
    public string Method { get; set; } = default!;
    public decimal Amount { get; set; }
}