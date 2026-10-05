namespace LokynexHealth.Application.Orders.Queries.GetOrderById;

/// <summary>Everything the order-details page and the printable bill need, in one payload.</summary>
public class OrderInvoiceDto
{
    public Guid Id { get; set; }

    // ---- Company / branch ----
    public string CompanyName { get; set; } = default!;
    public string CompanyType { get; set; } = default!;
    public string BranchName { get; set; } = default!;
    public string? BranchAddress { get; set; }
    public string? BranchPhone { get; set; }

    // ---- Invoice ----
    public string InvoiceNo { get; set; } = default!;
    public string BillNo { get; set; } = default!;
    public DateTimeOffset BillDate { get; set; }
    public string PaymentMode { get; set; } = default!;

    // ---- Patient ----
    public string PatientName { get; set; } = default!;
    public int? PatientAge { get; set; }
    public string? PatientGender { get; set; }
    public string PatientPhone { get; set; } = default!;
    public string? PatientAddress { get; set; }

    /// <summary>"Profile guardian name" — the head of the family record.</summary>
    public string GuardianName { get; set; } = default!;
    public string? Relationship { get; set; }

    public OrderPartyDto? Doctor { get; set; }
    public OrderPartyDto? Referral { get; set; }

    // ---- Amounts ----
    public decimal Subtotal { get; set; }
    public decimal Discount { get; set; }
    public decimal Total { get; set; }
    public decimal Paid { get; set; }
    public decimal Due { get; set; }
    public string PaymentStatus { get; set; } = default!;
    public bool IsComplimentary { get; set; }

    public List<OrderInvoiceLineDto> Lines { get; set; } = new();
    public List<OrderInvoicePaymentDto> Payments { get; set; } = new();

    // ---- Who / when ----
    public string? CreatedByName { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public string? UpdatedByName { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
    public string? DeletedByName { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }

    /// <summary>Newest first: every edit / delete / restore with the user's name and time.</summary>
    public List<OrderAuditEntryDto> History { get; set; } = new();
}

public class OrderAuditEntryDto
{
    public string Action { get; set; } = default!;
    public string? ChangedByName { get; set; }
    public DateTimeOffset ChangedAt { get; set; }
    public string? Summary { get; set; }
}

public class OrderPartyDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public string? Phone { get; set; }
    public string? Address { get; set; }
}

public class OrderInvoiceLineDto
{
    public Guid TestId { get; set; }
    public string Description { get; set; } = default!;
    public string DepartmentName { get; set; } = default!;
    public decimal Rate { get; set; }

    /// <summary>This line's share of the order discount (sums exactly to the order discount).</summary>
    public decimal Less { get; set; }
    public decimal Amount { get; set; }
}

public class OrderInvoicePaymentDto
{
    public string Method { get; set; } = default!;
    public decimal Amount { get; set; }
    public DateTimeOffset PaidAt { get; set; }
}