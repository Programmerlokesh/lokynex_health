namespace LokynexHealth.Application.Orders.Queries.GetOrders;

public class OrderDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = default!;

    public string PatientName { get; set; } = default!;
    public string PatientPhone { get; set; } = default!;

    public Guid BranchId { get; set; }
    public string BranchName { get; set; } = default!;

    public Guid? DoctorId { get; set; }
    public Guid? ReferralId { get; set; }

    public decimal GrossAmount { get; set; }
    public decimal FinalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public string PaymentStatus { get; set; } = default!;
    public string? PaymentMethod { get; set; }

    public bool IsComplimentary { get; set; }
    public bool IsDeleted { get; set; }

    public int TestCount { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}